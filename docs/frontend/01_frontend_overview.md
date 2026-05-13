# 01 — Frontend Overview

## Ubicación y Stack

El frontend reside en **`web/`** (raíz del repositorio). Es una aplicación **TypeScript + Next.js 15 App Router** con React 19, empaquetada con pnpm y publicada como imagen standalone Docker (`output: 'standalone'`).

```
dify/
└── web/                   ← todo el frontend vive aquí
    ├── app/               ← App Router: páginas, layouts y la mayoría de componentes
    ├── context/           ← Providers de React Context y stores Zustand globales
    ├── service/           ← Capa de API: fetch wrappers, ORPC clients, hooks TanStack Query
    ├── hooks/             ← Hooks reutilizables a nivel de app
    ├── models/            ← Tipos TypeScript que espejean recursos del backend
    ├── types/             ← Tipos transversales (app, feature, workflow, pipeline)
    ├── contract/          ← Contratos ORPC (consoleRouterContract, marketplaceRouterContract)
    ├── config/            ← Constantes de compilación derivadas de env vars
    ├── i18n/              ← Archivos de traducción por locale (en-US, zh-Hans, ja-JP…)
    ├── themes/            ← gradientes y máscaras propias del proyecto (manual-light/dark) + markdown.css
    ├── utils/             ← Helpers puros (client detection, gtag, setup status)
    ├── plugins/           ← Código de la feature de plugins
    ├── public/            ← Assets estáticos servidos directamente
    ├── next.config.ts     ← Configuración Next.js (TypeScript)
    ├── env.ts             ← Validación de env vars con @t3-oss/env-nextjs
    ├── proxy.ts           ← Middleware de Next.js (CSP, X-Frame-Options)
    ├── app/styles/tailwind-core.css ← entrada Tailwind v4 CSS-first (no hay tailwind.config.*)
    └── package.json
```

---

## Dependencias clave

### Framework y React
| Paquete | Rol |
|---|---|
| `next` / `react` / `react-dom` | Framework base (Next.js 15, React 19) |
| `@next/mdx` | Páginas MDX |
| `next-themes` | Cambio de tema (light/dark via `data-theme`) |

### Estado
| Paquete | Rol |
|---|---|
| `zustand` | Store global y stores con scope por árbol de componentes |
| `jotai` | Átomos de estado fino; `JotaiProvider` envuelve toda la app |
| `use-context-selector` | Consumo selectivo de React Context para evitar re-renders |
| `immer` | Actualizaciones inmutables dentro de stores/reducers |
| `zundo` | Middleware undo/redo para el workflow editor |
| `nuqs` | Estado de URL vinculado a estado React (`NuqsAdapter`) |

### Fetching de datos
| Paquete | Rol |
|---|---|
| `@tanstack/react-query` | Capa principal de datos asíncrona |
| `ky` | Cliente HTTP subyacente (wrappea `fetch`) |
| `@orpc/*` | Clientes tipados sobre OpenAPI (`consoleClient`, `marketplaceClient`) |

### UI y diseño
| Paquete | Rol |
|---|---|
| `@base-ui/react`, `@headlessui/react` | Primitivas sin estilos |
| `@floating-ui/react` | Posicionamiento de overlays |
| `reactflow` | Canvas del workflow editor |
| `lexical` + `@lexical/*` | Editor de texto enriquecido (prompt editor) |
| `@monaco-editor/react` | Editor de código |
| `cmdk` | Command palette (`GotoAnything`) |
| `echarts` / `echarts-for-react` | Gráficas |
| `class-variance-authority`, `clsx`, `tailwind-merge` | Composición de clases CSS |

### Formularios y validación
| Paquete | Rol |
|---|---|
| `@tanstack/react-form` | Formularios reactivos |
| `zod` | Validación de esquemas |

### i18n
| Paquete | Rol |
|---|---|
| `i18next` + `react-i18next` | Motor de internacionalización |
| `i18next-resources-to-backend` | Carga lazy de traducciones |

### Observabilidad
| Paquete | Rol |
|---|---|
| `@sentry/react` | Captura de errores |
| `@amplitude/analytics-browser` | Analytics de comportamiento |

---

## Configuración de Next.js (`next.config.ts`)

```ts
// Puntos relevantes del archivo web/next.config.ts
{
  basePath: env.NEXT_PUBLIC_BASE_PATH,          // configurable (ej. "/dify")
  output: 'standalone',                          // imagen Docker autocontenida
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  compiler: { removeConsole: { exclude: ['warn', 'error'] } },  // en producción
  transpilePackages: ['@t3-oss/env-core', 'echarts', 'zrender'],
  experimental: { turbopackFileSystemCacheForDev: false },
  // Redirección raíz: / → /apps
}
```

**Router**: App Router (Next.js 13+). Se evidencia por la carpeta `app/` con `layout.tsx`/`page.tsx`, grupos de rutas con paréntesis, directivas `'use client'`, y uso de `next/server` en `proxy.ts`.

**MDX** habilitado mediante `withMDX(nextConfig)`.

---

## Sistema de estilos

> **Referencia detallada**: ver [06_styling_and_branding.md](./06_styling_and_branding.md) para paleta de colores, design tokens, tipografías, iconos, logos y personalizaciones de branding.

### Tailwind v4 CSS-first

El proyecto usa **Tailwind CSS v4** en modo *CSS-first*: **no existe `tailwind.config.ts` ni `tailwind.config.js`**. Toda la configuración (capas, tokens, breakpoints, plugins, animaciones, gradientes) se declara en CSS desde [`web/app/styles/tailwind-core.css`](../../web/app/styles/tailwind-core.css) mediante `@layer`, `@import`, `@theme` y `@plugin`.

Plugins JS de Tailwind cargados:
- [`web/app/styles/plugins/icons.ts`](../../web/app/styles/plugins/icons.ts)
- [`web/app/styles/plugins/typography.ts`](../../web/app/styles/plugins/typography.ts)

Breakpoints personalizados: `mobile: 100px`, `tablet: 640px`, `pc: 769px`, `2k: 2560px`.

### Capas de design tokens

Tres capas de variables CSS, de menos a más específica:

1. **Paleta base** — [`packages/dify-ui/src/styles/styles.css`](../../packages/dify-ui/src/styles/styles.css) define las escalas crudas (`gray 25-900`, `primary 25-900`, `blue`, `green`, `yellow`, `purple`, `indigo`), sombras y tamaños tipográficos.
2. **Tokens semánticos generados** — [`packages/dify-ui/src/themes/theme.css`](../../packages/dify-ui/src/themes/theme.css) registra cada token como `@theme inline` (genera la utility Tailwind asociada, p. ej. `bg-components-button-primary-bg`). Los valores reales viven en [`light.css`](../../packages/dify-ui/src/themes/light.css) y [`dark.css`](../../packages/dify-ui/src/themes/dark.css) del mismo paquete, scopeados por `html[data-theme="light|dark"]`.
3. **Gradientes y máscaras del proyecto** — [`web/themes/manual-light.css`](../../web/themes/manual-light.css) y [`manual-dark.css`](../../web/themes/manual-dark.css).

> Los archivos `theme.css`, `light.css` y `dark.css` del paquete `dify-ui` están marcados como **generados**: editarlos a mano se pierde en la próxima regeneración. Para ajustes permanentes, modificar la fuente de los tokens o usar los archivos `manual-*` como capa de overrides.

### Sistema light/dark

`next-themes` aplica `data-theme="light|dark"` al elemento `<html>` (configurado en `web/app/layout.tsx` con `defaultTheme="system"`, `enableSystem`). El hook [`web/hooks/use-theme.ts`](../../web/hooks/use-theme.ts) envuelve `useTheme` para resolver siempre a `'light'` o `'dark'` (sin estado intermedio `'system'`).

### Estructura real de `web/themes/`

```
themes/
├── manual-light.css   ← gradientes y máscaras propias del proyecto (light)
├── manual-dark.css    ← gradientes y máscaras propias del proyecto (dark)
└── markdown.css       ← estilos para contenido markdown renderizado
```

### Orden de carga CSS desde `tailwind-core.css`

1. `@layer theme, base, components, utilities` — declaración de capas.
2. `tailwindcss/theme.css` y `tailwindcss/utilities.css` (importados selectivamente; el preflight oficial se omite).
3. [`web/app/styles/preflight.css`](../../web/app/styles/preflight.css) — baseline propio.
4. `@langgenius/dify-ui/styles.css` — design system (paleta base + tokens semánticos).
5. Temas manuales del proyecto (`web/themes/manual-{light,dark}.css`).
6. CSS por componente bajo `web/app/components/base/*/index.css`.

### Inyección de env en runtime

Para que una sola imagen Docker funcione con diferentes configuraciones, el server layout escribe los valores de `NEXT_PUBLIC_*` como atributos `data-*` en `<body>`. El cliente los lee con `getRuntimeEnvFromBody(key)`. Esto evita rebuilds por cambio de configuración.

---

## Árbol de providers raíz (`app/layout.tsx`)

```
<html data-* atributos con env vars>
  <body>
    <JotaiProvider>
      <ThemeProvider attribute="data-theme" defaultTheme="system">
        <NuqsAdapter>
          <TanstackQueryInitializer>
            <I18nServerProvider>
              <ToastHost />
              <PartnerStackCookieRecorder />
              <GlobalPublicStoreProvider>   ← systemFeatures + setup status
                <TooltipProvider>
                  {children}               ← grupos de rutas
                </TooltipProvider>
              </GlobalPublicStoreProvider>
            </I18nServerProvider>
          </TanstackQueryInitializer>
        </NuqsAdapter>
      </ThemeProvider>
    </JotaiProvider>
    <RoutePrefixHandle />
    <AgentationLoader />
  </body>
</html>
```
