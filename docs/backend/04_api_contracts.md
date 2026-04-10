# API Contracts — Mapa de Endpoints del Backend

## 1. Blueprints y URL Prefixes

| Blueprint | Prefijo | Audience | Auth |
|---|---|---|---|
| `console` | `/console/api` | Panel de administración | Session / JWT |
| `service_api` | `/api` | Integraciones externas | API Key (`Bearer sk-xxx`) |
| `web` | `/` | Web app del chat | Session de end-user |
| `files` | `/files` | Upload/download | Session o API Key |
| `inner_api` | `/inner` | Servicios internos | Internal secret |
| `mcp` | `/mcp` | Model Context Protocol | API Key |
| `trigger` | `/trigger` | Webhooks | Token de trigger |

---

## 2. Console API (`/console/api`)

### 2.1 Autenticación (`/console/api/`)

| Método | Path | Descripción |
|---|---|---|
| `POST` | `/login` | Login con email + password |
| `POST` | `/logout` | Cerrar sesión |
| `GET` | `/system-features` | Features disponibles (sin auth) |
| `POST` | `/email-code/validity` | Verificar código OTP email |
| `POST` | `/reset-password/validity` | Verificar token de reset |
| `POST` | `/reset-password/resets` | Ejecutar reset de password |
| `GET/POST` | `/oauth/login/{provider}` | Iniciar OAuth flow |
| `GET` | `/oauth/authorize/{provider}` | Callback OAuth |

### 2.2 Workspace (`/console/api/workspaces`)

| Método | Path | Descripción |
|---|---|---|
| `GET` | `/workspaces/current` | Info del workspace actual |
| `POST` | `/workspaces/current/name` | Renombrar workspace |
| `GET` | `/workspaces/current/members` | Listar miembros |
| `POST` | `/workspaces/current/members/invite-email` | Invitar por email |
| `DELETE` | `/workspaces/current/members/{account_id}` | Eliminar miembro |
| `PUT` | `/workspaces/current/members/{account_id}/role` | Cambiar rol |
| `GET` | `/workspaces/current/model-providers` | Listar providers configurados |
| `POST` | `/workspaces/current/model-providers/{provider}` | Configurar provider |
| `DELETE` | `/workspaces/current/model-providers/{provider}` | Eliminar provider |
| `POST` | `/workspaces/current/model-providers/{provider}/models` | Añadir modelo custom |
| `GET` | `/workspaces/current/models/model-types/{model_type}` | Modelos por tipo |
| `GET` | `/workspaces/current/default-model` | Modelos por defecto |
| `POST` | `/workspaces/current/default-model` | Configurar modelos por defecto |

### 2.3 Apps (`/console/api/apps`)

| Método | Path | Descripción |
|---|---|---|
| `GET` | `/apps` | Listar apps del workspace |
| `POST` | `/apps` | Crear app |
| `GET` | `/apps/{app_id}` | Detalle de app |
| `PUT` | `/apps/{app_id}` | Actualizar app |
| `DELETE` | `/apps/{app_id}` | Eliminar app |
| `POST` | `/apps/{app_id}/copy` | Duplicar app |
| `GET` | `/apps/{app_id}/model-config` | Config del modelo |
| `POST` | `/apps/{app_id}/model-config` | Actualizar config |
| `GET` | `/apps/{app_id}/api-keys` | Listar API keys |
| `POST` | `/apps/{app_id}/api-keys` | Crear API key |
| `DELETE` | `/apps/{app_id}/api-keys/{api_key_id}` | Revocar API key |
| `GET` | `/apps/{app_id}/site` | Config del web app |
| `POST` | `/apps/{app_id}/site` | Actualizar web app |
| `POST` | `/apps/{app_id}/site/access-token-reset` | Rotar token web |

### 2.4 Conversaciones (`/console/api/apps/{app_id}`)

| Método | Path | Descripción |
|---|---|---|
| `POST` | `/completion-messages` | Completion (modo texto) |
| `POST` | `/chat-messages` | Enviar mensaje de chat |
| `POST` | `/chat-messages/{message_id}/stop` | Detener generación |
| `GET` | `/conversations` | Listar conversaciones |
| `GET` | `/conversations/{conversation_id}` | Detalle conversación |
| `DELETE` | `/conversations/{conversation_id}` | Eliminar conversación |
| `GET` | `/conversations/{conversation_id}/messages` | Mensajes de conversación |
| `POST` | `/messages/{message_id}/feedbacks` | Dar feedback (thumbs up/down) |
| `GET` | `/messages/{message_id}/suggested` | Preguntas sugeridas |

### 2.5 Workflows (`/console/api/apps/{app_id}/workflows`)

| Método | Path | Descripción |
|---|---|---|
| `GET` | `/workflows/draft` | Obtener draft del workflow |
| `POST` | `/workflows/draft` | Guardar draft |
| `POST` | `/workflows/draft/run` | Ejecutar workflow (debug) |
| `GET` | `/workflows/draft/run` | Estado del run actual |
| `POST` | `/workflows/draft/run/stop` | Detener ejecución |
| `POST` | `/workflows/publish` | Publicar workflow |
| `GET` | `/workflows/run` | Historial de ejecuciones |
| `GET` | `/workflows/run/{workflow_run_id}` | Detalle de ejecución |
| `GET` | `/workflows/run/{workflow_run_id}/node-executions` | Nodos del run |

### 2.6 Datasets / Knowledge Base (`/console/api/datasets`)

| Método | Path | Descripción |
|---|---|---|
| `GET` | `/datasets` | Listar datasets |
| `POST` | `/datasets` | Crear dataset |
| `GET` | `/datasets/{dataset_id}` | Detalle dataset |
| `PUT` | `/datasets/{dataset_id}` | Actualizar dataset |
| `DELETE` | `/datasets/{dataset_id}` | Eliminar dataset |
| `POST` | `/datasets/{dataset_id}/documents` | Subir documento |
| `GET` | `/datasets/{dataset_id}/documents` | Listar documentos |
| `GET` | `/datasets/{dataset_id}/documents/{document_id}` | Detalle documento |
| `DELETE` | `/datasets/{dataset_id}/documents/{document_id}` | Eliminar documento |
| `GET` | `/datasets/{dataset_id}/documents/{document_id}/segments` | Segmentos |
| `POST` | `/datasets/{dataset_id}/documents/{document_id}/segments` | Crear segmento |
| `PUT` | `/datasets/{dataset_id}/documents/{document_id}/segments/{segment_id}` | Actualizar segmento |
| `DELETE` | `/datasets/{dataset_id}/documents/{document_id}/segments/{segment_id}` | Eliminar segmento |
| `POST` | `/datasets/{dataset_id}/retrieve` | Búsqueda de prueba |
| `GET` | `/datasets/{dataset_id}/hit-testing-logs` | Logs de retrieval |
| `GET` | `/datasets/{dataset_id}/queries` | Historial de queries |

### 2.7 Usuarios y Cuenta (`/console/api/account`)

| Método | Path | Descripción |
|---|---|---|
| `GET` | `/account/profile` | Perfil del usuario |
| `POST` | `/account/name` | Cambiar nombre |
| `POST` | `/account/avatar` | Cambiar avatar |
| `POST` | `/account/interface-language` | Cambiar idioma |
| `POST` | `/account/interface-theme` | Cambiar tema |
| `POST` | `/account/timezone` | Cambiar timezone |
| `POST` | `/account/password` | Cambiar password |
| `GET` | `/account/integrations` | OAuth integrations vinculadas |
| `DELETE` | `/account/integrations/{provider}` | Desvincular OAuth |

---

## 3. Service API (`/api`) — API Pública

Esta API es la que consumen los SDKs de Dify y las integraciones externas. Requiere **API Key** como Bearer token.

### 3.1 Chat

| Método | Path | Descripción |
|---|---|---|
| `POST` | `/chat-messages` | Enviar mensaje (streaming/blocking) |
| `POST` | `/chat-messages/{message_id}/stop` | Detener generación |
| `POST` | `/messages/{message_id}/feedbacks` | Feedback del mensaje |
| `GET` | `/messages/{message_id}/suggested` | Preguntas sugeridas |
| `GET` | `/conversations` | Listar conversaciones del usuario |
| `DELETE` | `/conversations/{conversation_id}` | Eliminar conversación |
| `POST` | `/conversations/{conversation_id}/name` | Renombrar conversación |
| `GET` | `/conversations/{conversation_id}/messages` | Historial de mensajes |

**Ejemplo de request — Chat:**
```http
POST /api/chat-messages
Authorization: Bearer sk-xxxxxxxxxxxxxxxx
Content-Type: application/json

{
    "query": "¿Qué es la inteligencia artificial?",
    "conversation_id": null,
    "inputs": {},
    "response_mode": "streaming",
    "user": "user-identifier-123"
}
```

**Response (SSE streaming):**
```
data: {"event": "message", "answer": "La inteligencia", "conversation_id": "uuid", "message_id": "uuid"}
data: {"event": "message", "answer": " artificial es...", ...}
data: {"event": "message_end", "metadata": {"usage": {"prompt_tokens": 10, "completion_tokens": 50}}}
```

### 3.2 Completion (modo texto)

| Método | Path | Descripción |
|---|---|---|
| `POST` | `/completion-messages` | Generación de texto |
| `POST` | `/completion-messages/{message_id}/stop` | Detener |

### 3.3 Workflows

| Método | Path | Descripción |
|---|---|---|
| `POST` | `/workflows/run` | Ejecutar workflow |
| `GET` | `/workflows/run/{workflow_run_id}` | Estado de ejecución |
| `POST` | `/workflows/tasks/{task_id}/stop` | Detener tarea |
| `GET` | `/workflows/logs` | Logs de ejecuciones |

### 3.4 Files

| Método | Path | Descripción |
|---|---|---|
| `POST` | `/files/upload` | Subir archivo |

### 3.5 Knowledge Base / Datasets

| Método | Path | Descripción |
|---|---|---|
| `GET` | `/datasets` | Listar datasets |
| `POST` | `/datasets` | Crear dataset |
| `DELETE` | `/datasets/{dataset_id}` | Eliminar dataset |
| `POST` | `/datasets/{dataset_id}/documents` | Crear documento |
| `GET` | `/datasets/{dataset_id}/documents` | Listar documentos |
| `GET` | `/datasets/{dataset_id}/documents/{document_id}` | Estado del documento |
| `DELETE` | `/datasets/{dataset_id}/documents/{document_id}` | Eliminar documento |
| `POST` | `/datasets/{dataset_id}/documents/{document_id}/update-by-file` | Actualizar por archivo |
| `GET` | `/datasets/{dataset_id}/documents/{document_id}/indexing-status` | Estado de indexación |
| `GET` | `/datasets/{dataset_id}/documents/{document_id}/segments` | Segmentos |
| `POST` | `/datasets/{dataset_id}/documents/{document_id}/segments` | Crear segmento |
| `PUT` | `/datasets/{dataset_id}/documents/{document_id}/segments/{segment_id}` | Actualizar segmento |
| `DELETE` | `/datasets/{dataset_id}/documents/{document_id}/segments/{segment_id}` | Eliminar segmento |
| `POST` | `/datasets/{dataset_id}/retrieve` | Consultar dataset |

### 3.6 App Info

| Método | Path | Descripción |
|---|---|---|
| `GET` | `/info` | Info básica de la app |
| `GET` | `/parameters` | Parámetros de la app (inputs, prompt vars) |
| `GET` | `/meta` | Metadatos (tool icons, etc.) |

---

## 4. Web App API (`/`) — Chat Embebido

Usada por el web app público de la app (sin login de tenant, con token de end-user).

| Método | Path | Descripción |
|---|---|---|
| `POST` | `/api/passport` | Obtener token de sesión de end-user |
| `POST` | `/api/chat-messages` | Chat |
| `GET` | `/api/conversations` | Conversaciones del end-user |
| `DELETE` | `/api/conversations/{id}` | Eliminar conversación |
| `GET` | `/api/parameters` | Parámetros de la app |
| `GET` | `/api/site` | Config del sitio |
| `POST` | `/api/files/upload` | Subir archivos |

---

## 5. Files API (`/files`)

| Método | Path | Descripción |
|---|---|---|
| `GET` | `/files/{file_id}/preview` | Preview de imagen |
| `GET` | `/files/tools/{tool_file_id}/{extension}` | Archivos generados por tools |
| `GET` | `/files/{upload_file_id}/image-preview` | Preview con firma |

---

## 6. MCP API (`/mcp`)

Implementa el protocolo **Model Context Protocol** para exponer recursos y tools a clientes MCP.

| Método | Path | Descripción |
|---|---|---|
| `POST` | `/mcp` | Endpoint principal MCP (JSON-RPC) |
| `GET` | `/mcp/sse` | SSE para notificaciones MCP |
| `GET/POST` | `/mcp/servers/{app_id}/sse` | SSE por app |
| `POST` | `/mcp/servers/{app_id}/messages` | Mensajes por app |

---

## 7. Trigger API (`/trigger`)

| Método | Path | Descripción |
|---|---|---|
| `POST` | `/trigger/webhook/{trigger_id}` | Webhook entrante |
| `GET` | `/trigger/oauth/callback/{provider}` | OAuth callback para datasources |

---

## 8. Formatos de Response

### Response de error estándar

```json
{
    "code": "unauthorized",
    "message": "Unauthorized",
    "status": 401
}
```

### Códigos de error comunes

| Code | HTTP Status | Descripción |
|---|---|---|
| `unauthorized` | 401 | Token/API key inválido o expirado |
| `not_found` | 404 | Recurso no encontrado |
| `forbidden` | 403 | Sin permisos para el recurso |
| `provider_not_initialize` | 400 | Provider LLM no configurado |
| `quota_exceeded` | 429 | Cuota de tokens agotada |
| `model_unavailable` | 400 | Modelo no disponible |
| `app_unavailable` | 404 | App deshabilitada |

### Headers de respuesta

| Header | Descripción |
|---|---|
| `X-Trace-Id` | ID de traza OpenTelemetry |
| `X-Span-Id` | ID de span OpenTelemetry |
| `Content-Type: text/event-stream` | Respuestas en streaming (SSE) |

---

## 9. Rate Limiting

Rate limiting a nivel de app (configurable en `App.api_rpm` y `App.api_rph`):

```python
# Configurado en AppModelConfig o directamente en App
api_rpm = 60    # Requests por minuto
api_rph = 3600  # Requests por hora
```

También existe rate limiting en el sistema de cuotas de proveedores LLM (tokens/minuto, tokens/día).
