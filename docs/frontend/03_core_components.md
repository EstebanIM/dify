# 03 — Componentes Core

**Todos los componentes viven en `web/app/components/`**. No existe un directorio `components/` en la raíz del proyecto (aunque Tailwind también escanea `./components/**` como salvaguarda). Esta es una decisión deliberada de la arquitectura.

---

## Design System — `app/components/base/`

Es el sistema de diseño propio de Dify, con más de 90 sub-carpetas. Funciona como la "capa de primitivas" sobre la que se construyen las features.

### Controles de formulario

| Componente | Path | Descripción |
|---|---|---|
| `Button` | `base/button/` | Botón principal. Variantes por CVA. Tiene `index.css`. |
| `Input` | `base/input/` | Input de texto base. |
| `Textarea` | `base/textarea/` | Textarea estándar. |
| `AutoHeightTextarea` | `base/auto-height-textarea/` | Textarea que crece con el contenido. |
| `Checkbox` | `base/checkbox/` | Checkbox con label. |
| `CheckboxList` | `base/checkbox-list/` | Lista de checkboxes. |
| `Radio` / `RadioCard` | `base/radio/` `base/radio-card/` | Radio button y variante en card. |
| `Switch` | `base/switch/` | Toggle on/off. |
| `Select` | `base/select/` | Select dropdown. |
| `SearchInput` | `base/search-input/` | Input con icono de búsqueda. |
| `TagInput` | `base/tag-input/` | Input de tags. |
| `BlockInput` | `base/block-input/` | Input de bloque. |
| `InputWithCopy` | `base/input-with-copy/` | Input con botón de copiar. |
| `DateAndTimePicker` | `base/date-and-time-picker/` | Selector de fecha y hora. |

### Overlays y superficies

| Componente | Path | Descripción |
|---|---|---|
| `Dialog` | `base/dialog/` | Diálogo modal accesible. |
| `Modal` | `base/modal/` | Modal genérico. Tiene `index.css`. |
| `Drawer` / `DrawerPlus` | `base/drawer/` `base/drawer-plus/` | Panel lateral deslizable. |
| `Popover` | `base/popover/` | Popover flotante. |
| `Dropdown` | `base/dropdown/` | Menú desplegable. |
| `Tooltip` | `base/tooltip/` | Tooltip con `@floating-ui`. |
| `PortalToFollowElem` | `base/portal-to-follow-elem/` | Portal que sigue un elemento (para overlays). |
| `Confirm` | `base/confirm/` | Diálogo de confirmación. |
| `InlineDeleteConfirm` | `base/inline-delete-confirm/` | Confirmación inline para borrado. |
| `FullscreenModal` | `base/fullscreen-modal/` | Modal a pantalla completa. |
| `ContentDialog` | `base/content-dialog/` | Diálogo con contenido estructurado. |
| `FloatRightContainer` | `base/float-right-container/` | Contenedor fijo a la derecha. |

### Data display

| Componente | Path | Descripción |
|---|---|---|
| `Badge` | `base/badge/` + `base/badge.tsx` | Badges de estado. Tiene `index.css`. |
| `Chip` | `base/chip/` | Chip/tag. |
| `Tag` / `TagManagement` | `base/tag/` `base/tag-management/` | Tags y su gestión. |
| `Divider` | `base/divider/` | Separador horizontal/vertical. |
| `Pagination` | `base/pagination/` | Paginación. |
| `Skeleton` | `base/skeleton/` | Placeholder de carga. |
| `ProgressBar` | `base/progress-bar/` | Barra de progreso. |
| `PremiumBadge` | `base/premium-badge/` | Badge de plan premium. Tiene `index.css`. |
| `SimplePieChart` | `base/simple-pie-chart/` | Gráfica de pie simple. |
| `CornerLabel` | `base/corner-label/` | Etiqueta en esquina. |

### Navegación y layout

| Componente | Path | Descripción |
|---|---|---|
| `TabHeader` | `base/tab-header/` | Cabecera de pestañas. |
| `TabSlider` / `TabSliderNew` / `TabSliderPlain` | `base/tab-slider*/` | Variantes de slider de tabs. |
| `SegmentedControl` | `base/segmented-control/` | Control segmentado (tipo "pills"). Tiene `index.css`. |
| `Sort` | `base/sort/` | Control de ordenamiento. |

### Editores ricos

| Componente | Path | Descripción |
|---|---|---|
| `PromptEditor` | `base/prompt-editor/` | Editor de prompts basado en **Lexical**. El componente central del configurador de apps. |
| `Markdown` / `MarkdownBlocks` / `MarkdownWithDirective` | `base/markdown*/` | Renderizado de Markdown en respuestas del asistente. |
| `Mermaid` | `base/mermaid/` | Renderizado de diagramas Mermaid. |
| `TextGeneration` | `base/text-generation/` | Componente de generación de texto. |

### Media y archivos

| Componente | Path | Descripción |
|---|---|---|
| `AudioBtn` / `NewAudioButton` | `base/audio-btn/` `base/new-audio-button/` | Reproductor de audio. |
| `AudioGallery` / `ImageGallery` / `VideoGallery` / `SvgGallery` | `base/*/gallery/` | Galerías de media. |
| `ImageUploader` / `FileUploader` | `base/image-uploader/` `base/file-uploader/` | Subida de archivos. |
| `VoiceInput` | `base/voice-input/` | Grabación de voz. |
| `FileIcon` / `FileThumb` | `base/file-icon/` `base/file-thumb/` | Iconos de tipo de archivo. |
| `QRCode` | `base/qrcode/` | Generación de QR. |

### Feedback

| Componente | Path | Descripción |
|---|---|---|
| `Alert` | `base/alert.tsx` | Banner de alerta. |
| `Loading` | `base/loading/` | Spinner de carga genérico. |
| `Spinner` | `base/spinner/` | Spinner pequeño. |
| `ErrorBoundary` | `base/error-boundary/` | Boundary de error React. |
| `Effect` | `base/effect/` | Efectos visuales (animaciones de entrada). |

### Chat

`base/chat/` — Primitivas de UI de chat usadas tanto en el debug del dashboard como en las webapps públicas (`(shareLayout)`). Incluye burbujas de mensaje, area de input, botones de feedback.

### Icons

`base/icons/` — Iconos auto-generados con `pnpm gen-icons` desde `@dify/iconify-collections`. ESLint autocorrige el output. No usar `@heroicons/react` o `@remixicon/react` directamente si existe un icono equivalente aquí.

### UI Layer (re-exports de `@base-ui/react`)

`base/ui/` — Capa de bajo nivel que re-exporta y adapta componentes de `@base-ui/react`:

```
base/ui/
├── alert-dialog/
├── context-menu/
├── dialog/
├── dropdown-menu/
├── number-field/
├── popover/
├── scroll-area/
├── select/
├── slider/
├── toast/          ← exporta la función global `toast()`
├── tooltip/
├── menu-shared.ts
└── placement.ts
```

La función `toast` de `base/ui/toast/` es usada por la capa de API (`service/fetch.ts`) para mostrar errores al usuario.

---

## Layouts — `app/components/header/`

El `Header` es el componente de navegación principal del dashboard autenticado.

```
Header/
├── index.tsx              ← Componente principal. Responsive (mobile vs desktop).
│                            Muestra: Logo, WorkplaceSelector, PlanBadge/LicenseNav,
│                            navegación principal (Explore, Apps, Datasets, Tools, Env, Plugins),
│                            AccountDropdown.
├── header-wrapper.tsx     ← Contenedor sticky
├── account-dropdown/      ← Menú de usuario
├── account-setting/       ← Modal completo de configuración de cuenta
│   └── model-provider-page/ ← Página de configuración de modelos de IA
├── app-nav/               ← Navegación dentro de un app
├── dataset-nav/
├── explore-nav/
├── env-nav/
├── plugins-nav/
├── tools-nav/
├── app-back/              ← Botón "volver" desde detalle de app
├── app-selector/          ← Selector de app en el header
├── github-star/           ← CTA de estrella en GitHub
├── plan-badge/            ← Badge del plan de billing
└── maintenance-notice.tsx
```

---

## Componentes de features

### Apps — `app/components/app/`
Componentes del detalle de un app individual:
- `configuration/` — Configurador de prompts (usa `PromptEditor`)
- `workflow-log/`, `log/`, `log-annotation/`, `annotation/` — Logs y anotaciones
- `overview/` — Dashboard de métricas del app
- `create-app-modal/`, `create-app-dialog/`, `create-from-dsl-modal/`, `duplicate-modal/`, `switch-app-modal/`
- `app-publisher/` — Publicación/despublicación del app
- `app-access-control/` — Control de acceso al app
- `text-generate/` — Generación de texto para testing
- `store.ts` — Zustand store para esta sección

### Sidebar del app — `app/components/app-sidebar/`
El rail izquierdo cuando se está dentro de un app concreto.

### Workflow editor — `app/components/workflow/`
El componente más complejo de la aplicación. Basado en **ReactFlow**.

Estructura clave:
```
workflow/
├── store/workflow/         ← Zustand store con slices (ver 02_state_and_routing.md)
├── nodes/                  ← Un subdirectorio por tipo de nodo
│   ├── llm/               ← Nodo LLM (el más rico: prompt editor, model selector, etc.)
│   ├── code/
│   ├── tool/
│   ├── knowledge-retrieval/
│   ├── if-else/
│   ├── http-request/
│   ├── start/
│   ├── end/
│   └── ...más tipos de nodos
├── note-node/             ← Nodo de anotación (con editor Lexical propio)
├── panel*/                ← Paneles laterales del editor
├── hooks-store/           ← Store de hooks del workflow
├── datasets-detail-store/ ← Store del panel de datasets
├── plugin-dependency/     ← Store de dependencias de plugins
└── hooks*.ts              ← Hooks de interacción con ReactFlow
```

### Datasets — `app/components/datasets/`
```
datasets/
├── list/                  ← Listado de knowledge bases
├── create/                ← Wizard de creación
├── create-from-pipeline/  ← Creación desde pipeline
│   └── data-source/store/ ← Store multi-slice para esta feature
├── documents/             ← Gestión de documentos dentro de un dataset
├── hit-testing/           ← Testing de recuperación
├── settings/              ← Configuración del dataset
├── api/                   ← Documentación del API del dataset
├── external-api/          ← APIs de conocimiento externo
├── metadata/              ← Editor de metadatos
└── preview/               ← Preview de chunks
```

### Explore — `app/components/explore/`
Marketplace de templates de apps.

### Plugins — `app/components/plugins/`
Marketplace y gestión de plugins. Incluye `readme-panel/` para mostrar la documentación de un plugin.

### Tools — `app/components/tools/`
Gestión de proveedores de herramientas (Tool Providers).

### Share (webapp pública) — `app/components/share/`
Shells de UI para las rutas `(shareLayout)`: la interfaz de chat, workflow y completion que el usuario final ve cuando accede a una app compartida.

### Billing — `app/components/billing/`
Componentes de suscripción y plan. Incluye `partner-stack/` para la integración de referidos PartnerStack.

### GotoAnything — `app/components/goto-anything/`
Command palette global basada en `cmdk`. Se abre con un shortcut de teclado desde cualquier parte del dashboard.

### AppInitializer — `app/components/app-initializer.tsx`
Gate de arranque del dashboard (ver `02_state_and_routing.md` para el flujo detallado).

### Splash — `app/components/splash.tsx`
Pantalla de carga mientras se inicializa la aplicación.

---

## Patrones de composición

### CVA (class-variance-authority)
Los componentes de `base/` usan CVA para definir variantes de estilo de forma type-safe:
```tsx
const buttonVariants = cva('base-classes', {
  variants: {
    variant: { primary: '...', secondary: '...' },
    size: { sm: '...', md: '...' },
  },
})
```

### Compound components
Muchos componentes usan el patrón compound para composición flexible:
```tsx
<Modal>
  <Modal.Header>Título</Modal.Header>
  <Modal.Body>Contenido</Modal.Body>
  <Modal.Footer>Acciones</Modal.Footer>
</Modal>
```

### `use-context-selector` en componentes consumer
Nunca usar `useContext(AppContext)` directamente. Usar:
```tsx
const userProfile = useContextSelector(AppContext, v => v.userProfile)
```
Esto evita que el componente se re-renderice cuando cambian otras partes del contexto.
