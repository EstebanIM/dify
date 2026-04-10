# 04 — Consumo de API

El frontend usa **dos mecanismos paralelos** para comunicarse con el backend, ambos apuntando al mismo servidor Django/Flask pero con abstracciones diferentes:

1. **Capa "base"** — `service/fetch.ts` → `service/base.ts`: wrapper sobre `ky` (fetch), usado directamente y como transporte del cliente ORPC.
2. **Clientes ORPC tipados** — `service/client.ts`: clientes tipados generados desde contratos en `contract/router.ts`, usando la capa base como transporte.

Ambos se combinan con **TanStack Query** para los hooks de datos reactivos.

---

## Configuración de URLs base

Definidas en `config/index.ts` (leídas de env vars validadas en `env.ts`):

```ts
API_PREFIX           = NEXT_PUBLIC_API_PREFIX          // → /console/api (dashboard)
PUBLIC_API_PREFIX    = NEXT_PUBLIC_PUBLIC_API_PREFIX   // → /api (webapp pública)
MARKETPLACE_API_PREFIX = NEXT_PUBLIC_MARKETPLACE_API_PREFIX // → marketplace de plugins
```

**Inyección en runtime**: Los valores se escriben en atributos `data-*` del `<body>` por el server layout. El cliente los lee con `getRuntimeEnvFromBody(key)`. Esto permite cambiar la configuración sin rebuilds (una imagen Docker, múltiples entornos).

---

## Capa base — `service/fetch.ts`

El cliente HTTP subyacente es **`ky`** (wrappea `fetch`), con timeout de 100s.

### Selección de base URL

```ts
base(url, options, otherOptions):
  if isMarketplaceAPI → MARKETPLACE_API_PREFIX
  if isPublicAPI      → PUBLIC_API_PREFIX
  else                → API_PREFIX
```

### Headers añadidos automáticamente

| Header | Condición | Valor |
|---|---|---|
| `Content-Type: application/json` | Siempre | Default |
| `credentials: 'include'` | Dashboard (console) | Cookies HTTP-Only fluyen automáticamente |
| `X-CSRF-Token` | Dashboard | Leído del cookie `csrf_token` o `__Host-csrf_token` via `js-cookie` |
| `X-Dify-Version` | Marketplace | `APP_VERSION` o `999.0.0` |
| `credentials: 'omit'` | Marketplace | Sin cookies |
| `Authorization: Bearer <token>` | WebApp pública (`isPublicAPI`) | `access_token` de localStorage |
| `X-App-Code: <shareCode>` | WebApp pública | Share code de la URL |
| `X-App-Passport: <passport>` | WebApp pública | Passport de localStorage |

### Hooks de interceptores

- **`afterResponseErrorCode`**: Si status ≠ 2xx/3xx (excepto 401), lee el JSON del error y llama `toast.error(...)`. Si es 403 + `already_setup`, redirige a `/signin`.
- **`afterResponse204`**: Convierte `204 No Content` en un 200 con cuerpo JSON vacío (compatibilidad).
- **`beforeRequestPublicWithCode`**: Resuelve el share code desde el pathname o `redirect_url`, con deny-list de rutas de autenticación.

---

## Capa de servicios — `service/base.ts`

Exporta los helpers HTTP públicos:

```ts
get<T>(url, params?, options?)
getPublic<T>(url, params?, options?)
getMarketplace<T>(url, params?, options?)
post<T>(url, body?, options?)
postPublic<T>(...)
postMarketplace<T>(...)
put<T>(...)
del<T>(...)
delPublic<T>(...)
patch<T>(...)
patchPublic<T>(...)
```

### Manejo de 401 y retry

`request()` (función interna de `base.ts`) intercepta los errores 401:

```
request() recibe 401
  └─ llama refreshAccessTokenOrReLogin(TIME_OUT)
       ├─ éxito → reintenta la petición original
       └─ fallo → redirige a /signin
```

### Códigos de error especiales (redirigen en vez de mostrar toast)

| Código | Acción |
|---|---|
| `web_app_access_denied` | `/webapp-signin?redirect_url=...` |
| `web_sso_auth_required` | SSO flow de webapp |
| `unauthorized_and_force_logout` | Logout forzado |
| `init_validate_failed` | `/init` |
| `not_init_validated` | `/init` |
| `not_setup` | `/install` |

---

## Streaming — SSE (`ssePost` / `sseGet`)

Para respuestas de streaming (chat, workflow runs), se usan `ssePost` y `sseGet` exportados de `service/base.ts`. Implementan **Server-Sent Events** sobre fetch.

`handleStream` despacha más de 30 tipos de eventos:

| Categoría | Eventos |
|---|---|
| Chat | `message`, `agent_message`, `agent_thought`, `message_file`, `message_end`, `message_replace` |
| Workflow | `workflow_started`, `workflow_finished` |
| Nodos | `node_started`, `node_finished`, `node_retry` |
| Iteraciones | `iteration_started`, `iteration_next`, `iteration_completed` |
| Bucles | `loop_started`, `loop_next`, `loop_completed` |
| Paralelo | `parallel_branch_started`, `parallel_branch_finished` |
| Texto | `text_chunk`, `text_replace` |
| Agent | `agent_log` |
| TTS | `tts_message`, `tts_message_end` |
| Human-in-the-loop | `human_input_required`, `human_input_form_filled`, `human_input_form_timeout`, `workflow_paused` |
| Datasource | `datasource_processing`, `datasource_completed`, `datasource_error` |

---

## Subida de archivos — `upload()`

`upload()` en `service/base.ts` usa **XMLHttpRequest** (no fetch) para soporte de progreso:
- Reporta progreso via callback `onProgress`.
- Envía los mismos headers de autenticación (CSRF, passport, share code).

---

## Clientes ORPC tipados — `service/client.ts`

Para endpoints más nuevos, Dify usa **ORPC** sobre OpenAPI con contratos TypeScript en `contract/router.ts`:

```ts
// service/client.ts
const consoleLink = new OpenAPILink(consoleRouterContract, {
  url: getBaseURL(API_PREFIX),
  fetch: (input, init) => request(input.url, init, { fetchCompat: true, request: input }),
  //                       ↑ ruta por la misma función base, preservando 401-refresh y CSRF
})

export const consoleClient = createORPCClient(consoleLink)
export const marketplaceClient = createORPCClient(marketplaceLink)

// Helpers de TanStack Query generados desde los contratos
export const consoleQuery = createTanstackQueryUtils(consoleClient, { path: ['console'] })
export const marketplaceQuery = createTanstackQueryUtils(marketplaceClient, { path: ['marketplace'] })
```

Uso en componentes:
```tsx
// En un componente o hook
const { data } = useQuery(consoleQuery.someEndpoint.queryOptions({ param: value }))
```

El `consoleClient` también se usa directamente para llamadas imperativas:
```ts
// En context/global-public-context.tsx
const data = await consoleClient.systemFeatures()
```

---

## TanStack Query — hooks por feature

Cada módulo de feature tiene un archivo `use-*.ts` con hooks de TanStack Query:

| Archivo | Qué expone |
|---|---|
| `service/use-common.ts` | `useUserProfile`, `useCurrentWorkspace`, `useLangGeniusVersion`, miembros, invitaciones, bindings Notion |
| `service/use-apps.ts` | `useApps`, `useAppDetail`, mutaciones CRUD de apps |
| `service/use-workflow.ts` | `useWorkflowDraft`, `useWorkflowNodes`, mutaciones de workflow |
| `service/use-datasets.ts` | Datasets, documentos, chunks |
| `service/use-models.ts` | Proveedores de modelos, modelos disponibles |
| `service/use-tools.ts` | Tool providers |
| `service/use-plugins.ts` | Marketplace de plugins, instalación |
| `service/use-billing.ts` | Plan, uso, upgrade |
| `service/use-share.ts` | Estado de apps compartidas (webapp pública) |
| `service/use-log.ts` | Logs de conversaciones |
| `service/use-explore.ts` | Templates del marketplace |
| `service/use-workspace.ts` | Gestión de workspace |

### Patrón estándar de un hook

```ts
// service/use-apps.ts (ejemplo simplificado)
export const useApps = () => {
  return useQuery({
    queryKey: ['apps'],
    queryFn: () => get<AppsResponse>('/apps'),
  })
}

export const useCreateApp = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateAppParams) => post<AppDetail>('/apps', { body: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apps'] }),
  })
}
```

---

## Autenticación del lado cliente

### Dashboard (consola) — cookie-based

```
Login exitoso
  └─ Backend setea cookie de access token (HTTP-Only) + cookie CSRF
       └─ Todas las peticiones: credentials: 'include' + X-CSRF-Token header
            └─ 401 → refreshAccessTokenOrReLogin → retry o /signin
```

Token de refresh: `service/refresh-token.ts`. Usa debouncing para que múltiples peticiones en 401 simultáneo solo disparen un refresh.

### WebApp pública (share link) — localStorage

```
/chat/<token> accedido
  └─ beforeRequestPublicWithCode extrae shareCode del pathname
       └─ Authorization: Bearer <access_token> (de localStorage)
          X-App-Code: <shareCode>
          X-App-Passport: <passport> (de localStorage, clave passport-<shareCode>)
            └─ 401 con web_app_access_denied → /webapp-signin?redirect_url=...
```

Helpers en `service/webapp-auth.ts`:
```ts
getWebAppAccessToken()              // localStorage: ACCESS_TOKEN_LOCAL_STORAGE_NAME
setWebAppAccessToken(token)
getWebAppPassport(shareCode)        // localStorage: passport-<shareCode>
setWebAppPassport(shareCode, passport)
webAppLoginStatus(shareCode)        // comprueba si el token es válido
webAppLogout(shareCode)             // limpia localStorage
```

---

## Manejo de errores — resumen

| Scenario | Comportamiento |
|---|---|
| Error HTTP (no 401, no 403+already_setup) | `toast.error(message)` de `base/ui/toast/` |
| 401 en consola | Refresh + retry, luego `/signin` si falla |
| 401 en webapp pública | `/webapp-signin?redirect_url=...` |
| 403 + `already_setup` | `/signin` |
| `not_setup` | `/install` |
| `init_validate_failed` | `/init` |
| Error de red / timeout | `ky` lanza, se propaga a TanStack Query (estado `isError`) |
| Error en streaming SSE | Callback `onError` pasado a `ssePost`/`sseGet` |
