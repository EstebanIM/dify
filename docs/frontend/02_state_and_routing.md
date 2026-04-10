# 02 — Estado y Routing

## Estado global

Dify usa **cuatro mecanismos complementarios** elegidos según el scope del estado. No existe una única solución: cada uno tiene un rol definido.

---

### 1. React Context + `use-context-selector` — estado de app principal

Los providers viven en `web/context/` como pares: un archivo de tipos/contexto + un `-provider.tsx` cliente. Los consumidores usan `useContextSelector` para suscribirse solo a la slice que les importa y evitar re-renders innecesarios.

| Contexto | Archivo | Qué gestiona |
|---|---|---|
| `AppContext` | `context/app-context.ts` + `app-context-provider.tsx` | Usuario logado, workspace activo, roles (`isCurrentWorkspaceOwner/Manager/Editor/DatasetOperator`), versión de la app. Datos fetched con TanStack Query (ver §API). También inicia Zendesk y Amplitude. |
| `ProviderContext` | `context/provider-context.ts` + `provider-context-provider.tsx` | Proveedores de modelos, plan de billing, feature flags (`enableBilling`, `modelLoadBalancingEnabled`, `enableEducationPlan`, `webappCopyrightEnabled`, `licenseLimit`). |
| `ModalContext` | `context/modal-context.ts` + `modal-context-provider.tsx` | Switchboard centralizado de modales globales (account settings, API extension, moderation, pricing, model modal, etc.). Cada modal tiene un reducer `ModalState<T>` con callbacks opcionales `onSave`/`onCancel`. |
| `EventEmitterContext` | `context/event-emitter.ts` + `event-emitter-provider.tsx` | Bus pub/sub con `mitt` para eventos transversales. |
| `WorkspaceContext` | `context/workspace-context.ts` + `workspace-context-provider.tsx` | Cambio de workspace. |
| `AppListContext` | `context/app-list-context.ts` | Estado del listado de apps. |
| `DatasetDetailContext` | `context/dataset-detail.ts` | Estado de detalle de un dataset. |
| `DebugConfigurationContext` | `context/debug-configuration.ts` | Estado del panel de debug/configuración de prompts. |
| `I18nContext` | `context/i18n.ts` | Locale activo. |
| `AccessControlStore` | `context/access-control-store.ts` | Control de acceso. |

**QueryClient** se provee desde `context/query-client.tsx` con patrón singleton en el navegador (evita recreación en hot-reload). Monta TanStack Devtools en desarrollo.

---

### 2. Zustand — stores globales y scoped

#### Stores globales (`zustand create`)

| Store | Archivo | Qué gestiona |
|---|---|---|
| `useGlobalPublicStore` | `context/global-public-context.tsx` | `systemFeatures` (branding, SSO, email). Hidratado al montar con `consoleClient.systemFeatures()` (ORPC) + TanStack Query. |
| `useWebAppStore` | `context/web-app-context.tsx` | Shell de la webapp pública: `shareCode`, `appInfo`, `appParams`, `webAppAccessMode`, `embeddedUserId`, `embeddedConversationId`. Sincronizado con pathname/searchParams. |
| `useStore` | `app/components/app/store.ts` | Páginas de detalle de app: `appDetail`, sidebar expand state, modales de log (`showPromptLogModal`, `showAgentLogModal`, `showMessageLogModal`). |

#### Stores con scope por árbol (`createStore` + Context)

Para features con instancias múltiples (p.ej. varios editores de workflow abiertos), Dify usa `zustand/vanilla`'s `createStore` combinado con un React Context para inyectar el store solo al subárbol correspondiente:

**Workflow editor** — `app/components/workflow/store/workflow/index.ts`

El store se construye mergeando slices:
```
createWorkflowStore(inject?) =
  createChatVariableSlice +
  createEnvVariableSlice +
  createFormSlice +
  createHelpLineSlice +
  createHistorySlice       ← undo/redo con zundo
  createNodeSlice +
  createPanelSlice +
  createToolSlice +
  createVersionSlice +
  createWorkflowDraftSlice +
  createWorkflowSlice +
  createInspectVarsSlice +
  createLayoutSlice +
  inject?()                ← inyección de slices adicionales
```

`injectWorkflowStoreSliceFn` permite que el wrapper `workflow-app` y `rag-pipeline` añadan sus propios slices. Los componentes consumen con `useStore(selector)` que lee de `WorkflowContext`.

Otros stores scoped destacables:
- `app/components/workflow/note-node/note-editor/store.ts`
- `app/components/workflow/hooks-store/store.ts`
- `app/components/workflow/plugin-dependency/store.ts`
- `app/components/base/features/store.ts`
- `app/components/datasets/documents/create-from-pipeline/data-source/store/`

---

### 3. Jotai — estado atómico fino

`JotaiProvider` envuelve toda la app en `app/layout.tsx`. Se usa principalmente en `context/hooks` y átomos ad-hoc a lo largo del codebase para estado muy granular donde Zustand es excesivo.

---

### 4. `nuqs` — estado en URL

`NuqsAdapter` en el root layout vincula ciertos valores a query params de la URL. Por ejemplo, `oauth_new_user` en `app/components/app-initializer.tsx`. Útil para estado que debe sobrevivir un refresh o ser compartible por link.

---

## Árbol de rutas

### Convenciones usadas

- **Grupos de rutas** (carpetas con paréntesis): agrupan rutas para compartir layout sin afectar la URL.
- **Segmentos dinámicos**: `[appId]`, `[datasetId]`, `[token]`, etc.
- Cada ruta es un `page.tsx`; los layouts son `layout.tsx`.

---

### Rutas públicas / auth (sin grupo de layout compartido)

```
/signin                          → signin/page.tsx
/signin/check-code               → signin/check-code/page.tsx
/signin/invite-settings          → signin/invite-settings/page.tsx
/signup                          → signup/page.tsx
/signup/check-code
/signup/set-password
/forgot-password
/reset-password
/reset-password/check-code
/reset-password/set-password
/activate
/install                         ← Setup inicial del workspace
/init
/oauth-callback
/education-apply
/account                         → (commonLayout)/page.tsx — Configuración de cuenta
/account/oauth/authorize
```

---

### `(commonLayout)` — Dashboard autenticado (consola)

**Layout**: `app/(commonLayout)/layout.tsx`

Monta en cascada:
```
AppInitializer
  └─ AppContextProvider
       └─ EventEmitterContextProvider
            └─ ProviderContextProvider
                 └─ ModalContextProvider
                      ├─ Header
                      ├─ RoleRouteGuard
                      │    └─ {children}
                      ├─ InSiteMessageNotification
                      ├─ PartnerStack
                      ├─ ReadmePanel
                      ├─ GotoAnything   ← command palette (cmdk)
                      └─ Splash
```

**`AppInitializer`** (`app/components/app-initializer.tsx`) actúa como gate de arranque:
1. Verifica el estado de setup (`fetchSetupStatusWithCache`).
2. Si no está instalado → redirige a `/install`.
3. Si no está autenticado → redirige a `/signin`.
4. Maneja el parámetro `oauth_new_user` (event Amplitude).
5. Gestiona redirects post-login.

#### Árbol de rutas del dashboard

```
/apps                                   ← Landing post-login (redirect de /)
│
├── /app/(appDetailLayout)/[appId]/
│   ├── overview                        ← Métricas y estado del app
│   ├── configuration                   ← Configuración de prompts/app
│   ├── workflow                        ← Editor de workflow (ReactFlow)
│   ├── annotations
│   ├── develop                         ← Docs de API/SDK
│   └── logs
│
├── /datasets                           ← Listado de Knowledge Bases
├── /datasets/create
├── /datasets/create-from-pipeline
├── /datasets/connect
├── /datasets/(datasetDetailLayout)/[datasetId]/
│   ├── documents
│   ├── documents/create
│   ├── documents/create-from-pipeline
│   ├── documents/[documentId]
│   ├── documents/[documentId]/settings
│   ├── hitTesting
│   ├── pipeline
│   ├── api
│   └── settings
│
├── /explore/apps                       ← Marketplace de templates
├── /explore/installed/[appId]
│
├── /tools                              ← Proveedores de herramientas
└── /plugins                            ← Gestión de plugins
```

---

### `(shareLayout)` — Webapp pública (embeddable)

**Layout**: `app/(shareLayout)/layout.tsx`

Shell mínimo deliberado: solo `WebAppStoreProvider` + `Splash`. Diseñado para embebido en iframes. `proxy.ts` **omite `X-Frame-Options: DENY`** en estas rutas.

```
/chat/[token]             ← App de chat compartida (share-code URL)
/chatbot/[token]          ← Embed estilo chatbot
/completion/[token]       ← App de text completion
/workflow/[token]         ← App workflow compartida
/webapp-signin            ← Login SSO de WebApp
/webapp-signin/check-code
/webapp-reset-password
/webapp-reset-password/check-code
/webapp-reset-password/set-password
```

---

### `(humanInputLayout)` — Human-in-the-loop

```
/form/[token]             ← Formulario para respuesta humana en workflows pausados
```

---

## Flujo de navegación principal

```
Usuario accede a /
  └─ next.config.ts redirect → /apps
       └─ AppInitializer verifica setup + auth
            ├─ No instalado → /install
            ├─ No autenticado → /signin
            └─ Autenticado → renderiza /apps (listado de apps del workspace)
```

Para rutas de webapp pública (`/chat/[token]`, etc.):
```
Usuario accede a /chat/<token>
  └─ (shareLayout) layout monta WebAppStoreProvider
       └─ WebAppStore carga appInfo + params desde /api (PUBLIC_API_PREFIX)
            ├─ Sin acceso → /webapp-signin?redirect_url=...
            └─ Con acceso → renderiza la interfaz de chat/workflow
```
