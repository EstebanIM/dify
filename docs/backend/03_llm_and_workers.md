# LLM Providers, RAG Pipeline y Workers — Dify Backend

## 1. Arquitectura de Integración con LLMs

Dify abstrae todos los proveedores de LLM mediante una capa llamada **model-runtime** (`core/model_runtime/`). Cada proveedor implementa interfaces comunes, lo que permite añadir nuevos proveedores sin cambiar el código de la aplicación.

```mermaid
graph TB
    subgraph App Layer
        SVC[AppGenerateService\nServices]
        AGN[Agent Runner]
        WFL[Workflow Engine]
    end

    subgraph Core Layer
        MM[ModelManager\ncore/model_manager.py]
        PM[ProviderManager\ncore/provider_manager.py]
        RT[ModelRuntime\ncore/model_runtime/]
    end

    subgraph Providers
        OAI[OpenAI Provider]
        ANT[Anthropic Provider]
        OLL[Ollama Provider]
        AZU[Azure OpenAI Provider]
        GGL[Google Gemini Provider]
        DOT[...100+ providers]
    end

    SVC & AGN & WFL --> MM
    MM --> PM
    PM --> RT
    RT --> OAI & ANT & OLL & AZU & GGL & DOT
```

## 2. Sistema de Providers

### 2.1 Tipos de Providers

| Tipo | Descripción | Configuración |
|---|---|---|
| `system` | Proveedores gestionados por Dify (cuotas globales) | Sin credenciales del usuario |
| `custom` | Credenciales del usuario (BYOK) | Cifradas en DB por tenant |
| `hosting` | Proveedores hosteados por Dify (quota freemium) | Configuración centralizada |

### 2.2 Tipos de Modelos

Cada proveedor puede exponer varios tipos de modelos:

| Tipo | Uso |
|---|---|
| `llm` | Chat y completions |
| `text_embedding` | Generación de embeddings (RAG) |
| `reranking` | Reordenamiento de resultados RAG |
| `speech2text` | Transcripción de audio |
| `tts` | Text-to-speech |
| `moderation` | Moderación de contenido |

### 2.3 ProviderManager — Lógica Central

**Archivo:** `core/provider_manager.py`

```python
class ProviderManager:
    def get_configuration(self, tenant_id: str, provider_name: str) -> ProviderConfiguration:
        """
        Obtiene la configuración completa de un proveedor para un tenant.
        Incluye: credenciales, modelos disponibles, cuotas, load balancing.
        """
        
    def get_provider_model_bundle(
        self, 
        tenant_id: str, 
        provider: str, 
        model: str, 
        model_type: ModelType
    ) -> ProviderModelBundle:
        """
        Retorna el bundle listo para usar: proveedor + modelo + credenciales.
        Este bundle se pasa al ModelRuntime para ejecutar inferencia.
        """
```

### 2.4 ModelManager — Invocación de Modelos

**Archivo:** `core/model_manager.py`

```python
class ModelManager:
    def invoke_llm(
        self,
        tenant_id: str,
        model_config: ModelConfigWithCredentials,
        prompt_messages: list[PromptMessage],
        stream: bool = True,
        **kwargs
    ) -> LLMResult | Generator[LLMResultChunk]:
        """
        Punto único de entrada para llamadas LLM.
        Gestiona: credenciales, retry, logging, tracing, cuotas.
        """
```

**Flujo de una llamada LLM:**

```mermaid
sequenceDiagram
    participant SVC as Service/Agent
    participant MM as ModelManager
    participant PM as ProviderManager
    participant RT as ModelRuntime
    participant LLM as LLM Provider API

    SVC->>MM: invoke_llm(tenant_id, model, messages)
    MM->>PM: get_provider_model_bundle(tenant_id, provider, model)
    PM->>PM: Desencripta credenciales
    PM->>PM: Verifica cuotas y límites
    PM-->>MM: ProviderModelBundle
    MM->>RT: llm.invoke(messages, credentials)
    RT->>LLM: HTTP POST (streaming o batch)
    LLM-->>RT: Response chunks
    RT-->>MM: LLMResultChunk (streaming)
    MM->>MM: Registra token usage
    MM-->>SVC: yield chunks
```

## 3. Pipeline RAG (Retrieval-Augmented Generation)

### 3.1 Vista General del Pipeline

```mermaid
flowchart TB
    subgraph Ingestion Pipeline
        U[Upload\nPDF/Word/HTML/Notion/URL] --> EX
        EX[Extractor\ncore/rag/extractor/] --> CL
        CL[Cleaner\ncore/rag/cleaner/] --> SP
        SP[Splitter\ncore/rag/splitter/] --> EM
        EM[Embedder\ncore/rag/embedding/] --> VS
        VS[(Vector Store\nWeaviate/Milvus/pgvector)]
    end

    subgraph Retrieval Pipeline
        Q[User Query] --> QE
        QE[Query Embedder] --> VR
        VR[Vector Retrieval\ncore/rag/retrieval/] --> RR
        KW[Keyword Search\nBM25] --> RR
        RR[Reranker\ncore/rag/rerank/] --> PP
        PP[Post-Processor\ncore/rag/data_post_processor/] --> CTX
        CTX[Context para LLM]
    end
```

### 3.2 Extractores Soportados (`core/rag/extractor/`)

| Extractor | Formatos |
|---|---|
| PDF Extractor | `.pdf` |
| Word Extractor | `.docx`, `.doc` |
| Excel Extractor | `.xlsx`, `.xls` |
| CSV Extractor | `.csv` |
| HTML Extractor | `.html`, `.htm` |
| Markdown Extractor | `.md` |
| Text Extractor | `.txt` |
| Notion Extractor | Páginas Notion vía API |
| Unstructured Extractor | Múltiples formatos vía Unstructured.io |

### 3.3 Proceso de Indexación

**Disparador:** Al subir un documento, se encola una tarea Celery.

```mermaid
sequenceDiagram
    participant U as Usuario
    participant API as Flask API
    participant RD as Redis (Queue)
    participant WRK as Celery Worker
    participant DB as PostgreSQL
    participant VS as Vector Store

    U->>API: POST /datasets/{id}/documents (upload file)
    API->>DB: INSERT document (status=waiting)
    API->>RD: ENQUEUE document_indexing_task(doc_id)
    API-->>U: 202 {document_id, status: "waiting"}

    WRK->>RD: DEQUEUE task
    WRK->>DB: UPDATE document (status=parsing)
    WRK->>WRK: Extract text from file
    WRK->>DB: UPDATE document (status=cleaning)
    WRK->>WRK: Clean and normalize text
    WRK->>DB: UPDATE document (status=splitting)
    WRK->>WRK: Split into chunks (DocumentSegments)
    WRK->>DB: INSERT document_segments[]
    WRK->>DB: UPDATE document (status=indexing)
    WRK->>WRK: Generate embeddings (batch)
    WRK->>VS: UPSERT vectors (index_node_id → vector)
    WRK->>DB: UPDATE segments (status=completed)
    WRK->>DB: UPDATE document (status=completed)
```

### 3.4 Técnicas de Indexación

**High Quality (por defecto):**
- Embeddings por chunk de texto
- Metadatos enriquecidos (keywords, summary)
- Mayor coste en tokens, mejor calidad de retrieval

**Economy:**
- Sin embeddings individuales por chunk
- Indexación BM25 keyword-based
- Menor coste, retrieval menos semántico

### 3.5 Métodos de Retrieval (`core/rag/retrieval/`)

| Método | Descripción |
|---|---|
| Vector similarity | Cosine similarity en el vector store |
| Keyword BM25 | Búsqueda léxica clásica |
| Hybrid | Combinación vector + keyword con alpha configurable |
| Full-text | PostgreSQL full-text search |

**Configuración en `Dataset.retrieval_model`:**
```json
{
    "search_method": "hybrid_search",
    "reranking_enable": true,
    "reranking_model": {"provider": "cohere", "model": "rerank-english-v3.0"},
    "top_k": 5,
    "score_threshold_enabled": true,
    "score_threshold": 0.5
}
```

### 3.6 Post-procesamiento (`core/rag/data_post_processor/`)

1. **Reranking**: Usa un modelo de reranking (Cohere, BGE, etc.) para reordenar los chunks recuperados por relevancia real.
2. **Score threshold**: Filtra chunks con score < umbral configurado.
3. **Context assembly**: Ensambla el contexto final para el prompt del LLM.

## 4. Workers Celery

### 4.1 Configuración del Worker

**Archivo:** `extensions/ext_celery.py`

```python
class FlaskTask(Task):
    """Wrapper que inyecta el contexto Flask en cada tarea"""
    def __call__(self, *args, **kwargs):
        with app.app_context():
            init_request_context()  # Logging context
            return self.run(*args, **kwargs)

# Configuración
celery_app.config_from_object({
    "broker_url": dify_config.CELERY_BROKER_URL,
    "result_backend": dify_config.CELERY_RESULT_BACKEND,
    "task_serializer": "json",
    "result_serializer": "json",
    "accept_content": ["json"],
    "timezone": "UTC",
    "enable_utc": True,
})
```

**Arrancar worker:**
```bash
celery -A app.celery worker --loglevel=info --concurrency=4
```

### 4.2 Catálogo de Tareas (`tasks/`)

#### Indexación de Documentos

| Tarea | Archivo | Descripción |
|---|---|---|
| `document_indexing_task` | `document_indexing_task.py` | Pipeline completo de indexación |
| `deal_dataset_vector_index_task` | `deal_dataset_vector_index_task.py` | Reindexar vectores |
| `clean_dataset_task` | `clean_dataset_task.py` | Limpiar dataset eliminado |
| `delete_segment_from_index_task` | `delete_segment_from_index_task.py` | Eliminar segmento del VS |
| `recover_document_indexing_task` | `recover_document_indexing_task.py` | Reintentar documentos fallidos |

#### Workflows y Generación

| Tarea | Archivo | Descripción |
|---|---|---|
| `async_workflow_tasks` | `async_workflow_tasks.py` | Ejecución asíncrona de workflows |
| `app_generate` | `app_generate/` | Generación de apps desde prompts |
| `annotation` | `annotation/` | Procesamiento de anotaciones |

#### Email y Notificaciones

| Tarea | Archivo | Descripción |
|---|---|---|
| `mail_invite_member_task` | `mail_invite_member_task.py` | Email de invitación |
| `mail_reset_password_task` | `mail_reset_password_task.py` | Email de reset de password |
| `mail_email_code_login_task` | `mail_email_code_login_task.py` | Código de login por email |
| `mail_account_deletion_task` | `mail_account_deletion_task.py` | Confirmación de eliminación |

#### Mantenimiento

| Tarea | Archivo | Descripción |
|---|---|---|
| `clean_unused_datasets_task` | `clean_unused_datasets_task.py` | Purga datasets huérfanos |
| `clean_embedding_cache_task` | `clean_embedding_cache_task.py` | Limpia caché de embeddings |
| `human_input_timeout_tasks` | `human_input_timeout_tasks.py` | Timeout de formularios humanos |

### 4.3 Tareas Programadas (Celery Beat)

**Archivo:** `schedule/` + configuración en `extensions/ext_celery.py`

```python
beat_schedule = {
    "clean_embedding_cache": {
        "task": "schedule.clean_embedding_cache_task.clean_embedding_cache",
        "schedule": crontab(hour=2, minute=0),  # Diariamente a las 2 AM
    },
    "clean_unused_datasets": {
        "task": "schedule.clean_unused_datasets_task.clean_unused_datasets",
        "schedule": crontab(hour=3, minute=0),  # Diariamente a las 3 AM
    },
    "clean_messages": {
        "task": "schedule.clean_messages.clean_messages",
        "schedule": crontab(hour=4, minute=0),
    },
    "check_upgradable_plugins": {
        "task": "schedule.check_upgradable_plugin_task",
        "schedule": timedelta(minutes=15),  # Cada 15 minutos
    },
    "workflow_schedule": {
        "task": "schedule.workflow_schedule_task",
        "schedule": timedelta(seconds=dify_config.WORKFLOW_SCHEDULE_TASK_INTERVAL),
    },
}
```

**Arrancar Beat:**
```bash
celery -A app.celery beat --loglevel=info
```

### 4.4 Monitoreo de Tareas

Las tareas se registran en la tabla `celery_tasks` (modelo `CeleryTask` en `models/task.py`). El estado se puede consultar vía:

```python
from celery.result import AsyncResult

result = AsyncResult(task_id)
print(result.status)  # PENDING | STARTED | SUCCESS | FAILURE | RETRY
print(result.result)  # Return value o excepción
```

## 5. Flujo de Chat Completo (E2E)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant API as Flask API
    participant SVC as AppGenerateService
    participant MM as ModelManager
    participant RAG as RAG Pipeline
    participant LLM as LLM Provider
    participant DB as PostgreSQL

    U->>API: POST /api/chat-messages {query, conversation_id}
    API->>SVC: generate(app_id, query, stream=True)
    
    SVC->>DB: Load App + AppModelConfig
    SVC->>DB: Load/Create Conversation
    
    alt RAG habilitado
        SVC->>RAG: retrieve(dataset_ids, query)
        RAG->>RAG: Embed query
        RAG->>RAG: Vector search
        RAG->>RAG: Rerank results
        RAG-->>SVC: context_chunks[]
    end
    
    SVC->>SVC: Build prompt\n(system + context + history + query)
    SVC->>MM: invoke_llm(model_config, messages, stream=True)
    MM->>LLM: HTTP POST (stream)
    
    loop Streaming
        LLM-->>MM: chunk
        MM-->>SVC: LLMResultChunk
        SVC-->>API: SSE event
        API-->>U: data: {"answer": "...", "event": "message"}
    end
    
    SVC->>DB: INSERT Message (query + full answer + tokens + cost)
    SVC-->>API: Final SSE event
    API-->>U: data: {"event": "message_end", "usage": {...}}
```

## 6. Sistema de Agentes

Los agentes en Dify son apps de modo `agent-chat` que ejecutan un loop de razonamiento con herramientas.

```mermaid
flowchart TB
    Q[User Query] --> AR[Agent Runner\ncore/agent/]
    AR --> LLM[LLM con Tool Calling]
    LLM -->|Tool call| TC{Tool Dispatcher}
    TC --> BT[Built-in Tools\nweb_search, code_interpreter, ...]
    TC --> AT[API Tools\nOpenAPI spec]
    TC --> WT[Workflow Tools\nWorkflow como tool]
    TC --> MT[MCP Tools\nModel Context Protocol]
    BT & AT & WT & MT -->|Tool result| AR
    AR -->|Otro ciclo| LLM
    LLM -->|Final answer| OUT[Respuesta final]
```

**Herramientas built-in disponibles** (`core/tools/builtin_tool/`):
- `web_search` — Búsqueda web (Google, Bing, DuckDuckGo)
- `code_interpreter` — Ejecuta código Python en sandbox
- `dalle` — Generación de imágenes DALL-E
- `wikipedia` — Consultas a Wikipedia
- `chart` — Generación de gráficas
- `file_operations` — Operaciones de archivos
- Y más de 50 herramientas adicionales
