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
    ├── themes/            ← CSS de temas (light/dark) + tokens Tailwind
    ├── utils/             ← Helpers puros (client detection, gtag, setup status)
    ├── plugins/           ← Código de la feature de plugins
    ├── public/            ← Assets estáticos servidos directamente
    ├── next.config.ts     ← Configuración Next.js (TypeScript)
    ├── env.ts             ← Validación de env vars con @t3-oss/env-nextjs
    ├── proxy.ts           ← Middleware de Next.js (CSP, X-Frame-Options)
    ├── tailwind.config.ts ← Config Tailwind
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

### Tailwind v4 + variables CSS semánticas

`tailwind.config.ts` escanea `./app/**` y `./components/**`, y extiende Tailwind con:

- **Colores**: Paletas gray/primary/blue/green/yellow/purple más decenas de colores semánticos mapeados desde CSS variables (e.g. `bg-components-badge-status-light-success-halo`, `text-divider-deep`). Esto se define en `themes/tailwind-theme-var-define.ts`.
- **Breakpoints personalizados**: `mobile: 100px`, `tablet: 640px`, `pc: 769px`, `2k: 2560px`
- **Sombras semánticas**: `xs` … `3xl` más indicadores de estado.
- **Plugins**: `@tailwindcss/typography`, `@egoist/tailwindcss-icons` (colecciones `heroicons`, `ri`, `custom-public`).
- **`corePlugins.preflight: false`**: Deshabilitado; usan su propio preflight en `app/styles/preflight.css`.

### Sistema de temas (light/dark)

`next-themes` controla el tema mediante el atributo `data-theme` en `<html>`. Los archivos CSS en `themes/` definen las variables:

```
themes/
├── light.css          ← variables para tema claro (system)
├── dark.css           ← variables para tema oscuro (system)
├── manual-light.css   ← override manual claro
├── manual-dark.css    ← override manual oscuro
├── markdown-light.css ← tema específico para contenido markdown
└── markdown-dark.css
```

### CSS global (`app/styles/globals.css`)

Carga en orden:
1. `preflight.css` — reset personalizado
2. Archivos de tema (`light.css`, `dark.css`, `manual-*.css`)
3. `tailwindcss` con config apuntando a `tailwind.config.ts`
4. Utilidades `@utility` para la escala tipográfica del sistema (`system-xs-regular`, `system-2xs-regular`, etc.)
5. CSS por componente: `button/index.css`, `modal/index.css`, `badge/index.css`, etc.

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
