# Guía de Modificación del Backend — Dify

Esta guía cubre los tres casos de extensión más comunes: añadir un proveedor LLM, crear un endpoint nuevo y añadir una tarea Celery.

---

## A. Cómo Añadir un Nuevo Proveedor de LLM

Dify usa un sistema de plugins para providers. Cada proveedor es un directorio dentro de `api/core/model_runtime/model_providers/`.

### Paso 1 — Crear la estructura del directorio

```
api/core/model_runtime/model_providers/
└── mi_proveedor/
    ├── __init__.py
    ├── mi_proveedor.py          # Clase principal del provider
    ├── mi_proveedor.yaml        # Metadatos del provider
    ├── _assets/
    │   └── icon_s.png           # Ícono del proveedor (32x32)
    └── llm/
        ├── __init__.py
        ├── llm.py               # Implementación del modelo LLM
        └── mi_modelo.yaml       # Metadatos del modelo
```

### Paso 2 — Definir el Provider YAML (`mi_proveedor.yaml`)

```yaml
provider: mi_proveedor
label:
  en_US: Mi Proveedor LLM
  zh_Hans: 我的LLM提供商
description:
  en_US: My custom LLM provider
icon_small:
  en_US: icon_s.png
supported_model_types:
  - llm
configurate_methods:
  - customizable-model     # El usuario configura sus credenciales
model_credential_schema:
  credential_form_schemas:
    - variable: api_key
      label:
        en_US: API Key
      type: secret-input
      required: true
      placeholder:
        en_US: Enter your API key
    - variable: api_base
      label:
        en_US: API Base URL
      type: text-input
      required: false
      default: https://api.mi-proveedor.com/v1
```

### Paso 3 — Implementar la clase del Provider (`mi_proveedor.py`)

```python
from core.model_runtime.model_providers.__base.model_provider import ModelProvider

class MiProveedorProvider(ModelProvider):
    def validate_provider_credentials(self, credentials: dict) -> None:
        """
        Valida que las credenciales del provider sean correctas.
        Lanza CredentialsValidateFailedError si son inválidas.
        """
        try:
            # Llamada mínima al API para verificar credenciales
            model_instance = self.get_model_instance(ModelType.LLM)
            model_instance.validate_credentials(
                model="mi-modelo-default",
                credentials=credentials
            )
        except Exception as e:
            raise CredentialsValidateFailedError(str(e))
```

### Paso 4 — Implementar el Modelo LLM (`llm/llm.py`)

```python
from core.model_runtime.model_providers.__base.large_language_model import LargeLanguageModel
from core.model_runtime.entities.message_entities import PromptMessage, AssistantPromptMessage
from core.model_runtime.entities.llm_entities import LLMResult, LLMResultChunk

class MiProveedorLargeLanguageModel(LargeLanguageModel):
    
    def _invoke(
        self,
        model: str,
        credentials: dict,
        prompt_messages: list[PromptMessage],
        model_parameters: dict,
        tools: list | None = None,
        stop: list[str] | None = None,
        stream: bool = True,
        user: str | None = None,
    ) -> LLMResult | Generator[LLMResultChunk]:
        """
        Invoca el modelo. Debe retornar LLMResult (blocking) o Generator (streaming).
        """
        import mi_sdk  # Tu SDK o requests
        
        client = mi_sdk.Client(api_key=credentials["api_key"])
        
        messages = self._convert_messages(prompt_messages)
        
        if stream:
            return self._handle_stream(client, model, messages, model_parameters)
        else:
            response = client.chat.complete(model=model, messages=messages, **model_parameters)
            return self._handle_response(response)
    
    def _convert_messages(self, prompt_messages: list[PromptMessage]) -> list[dict]:
        """Convierte PromptMessage al formato que acepta tu proveedor."""
        result = []
        for msg in prompt_messages:
            result.append({
                "role": msg.role.value,
                "content": msg.content
            })
        return result
    
    def _handle_stream(self, client, model, messages, params) -> Generator:
        response = client.chat.stream(model=model, messages=messages, **params)
        for chunk in response:
            delta_content = chunk.choices[0].delta.content or ""
            if delta_content:
                yield LLMResultChunk(
                    model=model,
                    prompt_messages=[],
                    delta=LLMResultChunkDelta(
                        index=0,
                        message=AssistantPromptMessage(content=delta_content),
                    )
                )
    
    def validate_credentials(self, model: str, credentials: dict) -> None:
        """Valida que las credenciales funcionen para este modelo."""
        self._invoke(
            model=model,
            credentials=credentials,
            prompt_messages=[UserPromptMessage(content="test")],
            model_parameters={"max_tokens": 5},
            stream=False,
        )
    
    def get_num_tokens(
        self, model: str, credentials: dict, prompt_messages: list[PromptMessage], tools=None
    ) -> int:
        """Estima tokens. Puede usar tiktoken u otro tokenizer."""
        # Implementación básica
        return sum(len(msg.content.split()) * 1.3 for msg in prompt_messages)
    
    def get_customizable_model_schema(self, model: str, credentials: dict) -> AIModelEntity | None:
        """Retorna el schema del modelo. None si no se requiere customización."""
        return None
```

### Paso 5 — Registrar el modelo YAML (`llm/mi_modelo.yaml`)

```yaml
model: mi-modelo-v1
label:
  en_US: Mi Modelo V1
model_type: llm
features:
  - streaming
  - tool-call
model_properties:
  mode: chat
  context_size: 128000
parameter_rules:
  - name: temperature
    use_template: temperature
  - name: max_tokens
    use_template: max_tokens
    default: 4096
    min: 1
    max: 128000
pricing:
  input: "0.002"
  output: "0.008"
  unit: "0.001"
  currency: USD
```

### Paso 6 — Verificar el registro

No se necesita registro explícito. Dify descubre los providers automáticamente via `ModelProviderFactory` que escanea el directorio `model_providers/`.

```bash
# Verificar que el proveedor se carga correctamente
cd api
python -c "
from core.model_runtime.model_providers.__base.model_provider_extension import ModelProviderExtension
ext = ModelProviderExtension()
print('mi_proveedor' in ext.get_all_providers())
"
```

### Paso 7 — Agregar icono en el frontend (opcional)

El icono también se referencia en el frontend en `web/public/provider-icons/`. Añade `mi_proveedor.svg` allí.

---

## B. Cómo Crear un Nuevo Endpoint en la API

### Ejemplo: `GET /console/api/apps/{app_id}/statistics`

### Paso 1 — Crear el controlador

**Archivo:** `api/controllers/console/app/statistics.py`

```python
from flask_restx import Resource
from flask_login import current_user, login_required

from controllers.console import api
from controllers.console.app.wraps import get_app_model
from controllers.console.wraps import account_initialization_required
from models.model import App
from services.statistics_service import StatisticsService

# Namespace (puede reutilizar uno existente o crear uno nuevo)
# Los namespaces están definidos en controllers/console/__init__.py


class AppStatisticsApi(Resource):
    
    @login_required
    @account_initialization_required
    def get(self, app_id: str):
        """Retorna estadísticas de uso de la app."""
        app_model = get_app_model(app_id)
        
        stats = StatisticsService.get_app_stats(
            app_id=app_model.id,
            tenant_id=app_model.tenant_id,
        )
        
        return {
            "total_messages": stats.total_messages,
            "total_conversations": stats.total_conversations,
            "total_tokens": stats.total_tokens,
            "avg_response_time": stats.avg_response_time,
        }, 200
```

### Paso 2 — Registrar la ruta

**Archivo:** `api/controllers/console/app/__init__.py` (o donde estén las demás rutas de app)

Busca el patrón de registro de rutas en el archivo correspondiente:

```python
# controllers/console/app/__init__.py (ejemplo aproximado)
from . import (
    app,
    completion,
    conversation,
    message,
    workflow,
    statistics,   # <-- Importar tu nuevo módulo
)
```

Y en el archivo de rutas de la app (busca `api.add_resource`):

```python
# Añadir después de las rutas existentes de app
api.add_resource(
    statistics.AppStatisticsApi,
    "/apps/<uuid:app_id>/statistics"
)
```

**Nota:** Busca el patrón exacto de registro en `controllers/console/app/app.py` y replica la convención usada allí.

### Paso 3 — Crear el Service

**Archivo:** `api/services/statistics_service.py`

```python
from dataclasses import dataclass
from datetime import datetime, timedelta

from extensions.ext_database import db
from models.model import App, Message, Conversation


@dataclass
class AppStats:
    total_messages: int
    total_conversations: int
    total_tokens: int
    avg_response_time: float


class StatisticsService:
    
    @staticmethod
    def get_app_stats(app_id: str, tenant_id: str) -> AppStats:
        """
        Calcula estadísticas de uso para una app.
        tenant_id se usa para verificar ownership.
        """
        # Verificar que la app pertenece al tenant
        app = db.session.query(App).filter_by(
            id=app_id,
            tenant_id=tenant_id
        ).first()
        if not app:
            raise ValueError("App not found")
        
        # Contar mensajes
        total_messages = db.session.query(Message).filter_by(
            app_id=app_id
        ).count()
        
        # Contar conversaciones
        total_conversations = db.session.query(Conversation).filter_by(
            app_id=app_id
        ).count()
        
        # Sumar tokens
        from sqlalchemy import func
        token_result = db.session.query(
            func.sum(Message.message_tokens + Message.answer_tokens)
        ).filter_by(app_id=app_id).scalar()
        total_tokens = token_result or 0
        
        # Tiempo promedio de respuesta
        latency_result = db.session.query(
            func.avg(Message.provider_response_latency)
        ).filter_by(app_id=app_id).scalar()
        avg_response_time = float(latency_result or 0)
        
        return AppStats(
            total_messages=total_messages,
            total_conversations=total_conversations,
            total_tokens=total_tokens,
            avg_response_time=avg_response_time,
        )
```

### Paso 4 — Probar el endpoint

```bash
# Con la API Key o sesión de consola
curl -X GET http://localhost:5001/console/api/apps/{app_id}/statistics \
  -H "Authorization: Bearer <session-token>"
```

### Convenciones a seguir

| Aspecto | Convención |
|---|---|
| Autenticación | Siempre usar `@login_required` + `@account_initialization_required` |
| Tenant isolation | Siempre filtrar por `tenant_id = current_user.current_tenant_id` |
| Error handling | Usar excepciones del módulo `core/errors/` o `werkzeug.exceptions` |
| Response format | Retornar `dict, status_code` (flask-restx lo serializa) |
| Naming | `NombreRecursoApi` para Resource, `nombre_recurso_service.py` para Service |
| Logging | Usar `logging.getLogger(__name__)` — nunca `print()` |

---

## C. Cómo Añadir una Nueva Tarea a Celery

### Ejemplo: Tarea que genera un reporte semanal de uso

### Paso 1 — Crear el archivo de tarea

**Archivo:** `api/tasks/generate_weekly_report_task.py`

```python
import logging
from celery import shared_task
from extensions.ext_database import db
from models.model import App, Tenant
from services.statistics_service import StatisticsService

logger = logging.getLogger(__name__)


@shared_task(
    queue="dataset",              # Cola donde se encola (dataset, mail, default)
    bind=True,                   # Acceso a self para retry
    max_retries=3,               # Reintentos automáticos en fallo
    soft_time_limit=300,         # Timeout suave (segundos)
    time_limit=600,              # Timeout duro (segundos)
)
def generate_weekly_report_task(self, tenant_id: str) -> dict:
    """
    Genera un reporte semanal de uso para un tenant.
    
    Args:
        tenant_id: UUID del tenant para el que se genera el reporte
    
    Returns:
        dict con el resultado del reporte
    """
    logger.info(f"[generate_weekly_report_task] Starting for tenant: {tenant_id}")
    
    try:
        tenant = db.session.query(Tenant).filter_by(id=tenant_id).first()
        if not tenant:
            logger.warning(f"Tenant {tenant_id} not found, skipping")
            return {"status": "skipped", "reason": "tenant not found"}
        
        apps = db.session.query(App).filter_by(tenant_id=tenant_id).all()
        
        report_data = []
        for app in apps:
            stats = StatisticsService.get_app_stats(app.id, tenant_id)
            report_data.append({
                "app_id": app.id,
                "app_name": app.name,
                "total_messages": stats.total_messages,
                "total_tokens": stats.total_tokens,
            })
        
        # Aquí podrías guardar el reporte en DB, enviarlo por email, etc.
        logger.info(f"[generate_weekly_report_task] Completed for tenant: {tenant_id}, apps: {len(apps)}")
        
        return {"status": "success", "tenant_id": tenant_id, "apps_processed": len(apps)}
    
    except Exception as e:
        logger.exception(f"[generate_weekly_report_task] Failed for tenant {tenant_id}: {e}")
        # Retry con backoff exponencial
        raise self.retry(exc=e, countdown=2 ** self.request.retries * 60)
```

### Paso 2 — Encolar la tarea manualmente (desde un endpoint)

```python
# En cualquier controller o service
from tasks.generate_weekly_report_task import generate_weekly_report_task

# Encolar inmediatamente (asíncrono)
task = generate_weekly_report_task.delay(tenant_id="uuid-del-tenant")
task_id = task.id  # Guardar para consultar estado después

# Encolar con countdown (en 60 segundos)
generate_weekly_report_task.apply_async(
    args=[tenant_id],
    countdown=60
)

# Encolar en cola específica
generate_weekly_report_task.apply_async(
    args=[tenant_id],
    queue="dataset"
)
```

### Paso 3 (opcional) — Registrar como tarea programada (Celery Beat)

**Archivo:** `api/extensions/ext_celery.py`

Busca la sección `beat_schedule` y añade tu tarea:

```python
beat_schedule = {
    # ... tareas existentes ...
    
    "generate_weekly_reports": {
        "task": "tasks.generate_weekly_report_task.generate_weekly_report_task",
        "schedule": crontab(day_of_week="monday", hour=8, minute=0),
        "args": [],  # Argumentos estáticos — para múltiples tenants, mejor usar otra tarea
        "options": {"queue": "dataset"},
    },
}
```

**Para múltiples tenants**, crea una tarea "madre" que encola una tarea por tenant:

```python
# tasks/dispatch_weekly_reports_task.py
@shared_task(queue="default")
def dispatch_weekly_reports_task():
    """Encola generate_weekly_report_task para cada tenant activo."""
    tenants = db.session.query(Tenant).filter_by(status="active").all()
    for tenant in tenants:
        generate_weekly_report_task.delay(tenant.id)
    logger.info(f"Dispatched weekly reports for {len(tenants)} tenants")
```

```python
# En beat_schedule:
"dispatch_weekly_reports": {
    "task": "tasks.dispatch_weekly_reports_task.dispatch_weekly_reports_task",
    "schedule": crontab(day_of_week="monday", hour=8, minute=0),
    "options": {"queue": "default"},
},
```

### Paso 4 — Consultar el estado de la tarea

```python
from celery.result import AsyncResult

def get_task_status(task_id: str) -> dict:
    result = AsyncResult(task_id)
    return {
        "task_id": task_id,
        "status": result.status,      # PENDING | STARTED | SUCCESS | FAILURE | RETRY
        "result": result.result if result.ready() else None,
        "traceback": result.traceback if result.failed() else None,
    }
```

### Paso 5 — Verificar que la tarea funciona

```bash
# 1. Asegúrate de que el worker esté corriendo
celery -A app.celery worker --loglevel=info -Q dataset,default

# 2. En la shell de Flask, encola la tarea manualmente
flask shell
>>> from tasks.generate_weekly_report_task import generate_weekly_report_task
>>> task = generate_weekly_report_task.delay("tu-tenant-uuid")
>>> print(task.id)
>>> print(task.status)  # Espera unos segundos
>>> print(task.result)

# 3. Ver logs del worker en tiempo real para debug
```

---

## D. Checklist de Buenas Prácticas

### Para cualquier modificación

- [ ] Añadir logs con `logger = logging.getLogger(__name__)` — no usar `print()`
- [ ] Siempre filtrar queries por `tenant_id` para mantener el aislamiento
- [ ] No hacer queries dentro de loops (N+1 queries) — usar `joinedload` o queries batch
- [ ] Usar transacciones explícitas para operaciones multi-tabla:
  ```python
  with db.session.begin():
      # operaciones atómicas
  ```
- [ ] No hardcodear strings de configuración — usar `dify_config.MI_VARIABLE`
- [ ] Añadir variables al schema de configuración en `configs/app_config.py` y `.env.example`

### Para endpoints nuevos

- [ ] Nunca retornar información de otro tenant
- [ ] Validar inputs antes de procesarlos (pydantic o validación manual)
- [ ] Documentar con docstrings el propósito del endpoint
- [ ] Añadir el endpoint al mapa en `docs/backend/04_api_contracts.md`

### Para tareas Celery

- [ ] Manejar excepciones y hacer retry con backoff
- [ ] Establecer `soft_time_limit` y `time_limit` realistas
- [ ] Loggear el inicio y fin de la tarea con su ID
- [ ] Las tareas deben ser **idempotentes** (re-ejecutables sin efectos secundarios)
- [ ] No pasar objetos ORM como argumentos — pasar solo IDs (UUID strings)

### Para providers LLM

- [ ] Implementar `validate_credentials()` — se llama al guardar la configuración
- [ ] Implementar `get_num_tokens()` — usado para calcular costes
- [ ] Manejar rate limiting del proveedor (retry con backoff en `_invoke`)
- [ ] Testear con el fixture `tests/unit_tests/core/model_runtime/`
