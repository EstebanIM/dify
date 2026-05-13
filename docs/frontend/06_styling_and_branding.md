# 06 — Sistema de Estilos y Branding

Mapa de referencia para entender **dónde** y **cómo** se definen los aspectos
visuales de la app web del fork de Dify: paleta de colores, temas light/dark,
tipografías, iconos, logos y las personalizaciones de branding que ya extienden
el upstream.

Este documento reemplaza y profundiza la sección "Sistema de estilos" de
[01_frontend_overview.md](./01_frontend_overview.md), que quedó desactualizada
tras la migración a Tailwind v4 CSS-first.

---

## 1. Stack: Tailwind CSS v4 (CSS-first)

No existe `tailwind.config.ts` ni `tailwind.config.js`. Toda la configuración
se declara directamente en CSS desde un único archivo raíz:

- **Entrada principal**: [`web/app/styles/tailwind-core.css`](../../web/app/styles/tailwind-core.css)
  - Define el orden de capas: `@layer theme, base, components, utilities`.
  - Importa selectivamente `tailwindcss/theme.css` y `tailwindcss/utilities.css`
    (omite el preflight oficial; el proyecto ship un baseline propio).
  - Importa el design system `@langgenius/dify-ui/styles.css`.
  - Importa los temas manuales del proyecto (`web/themes/manual-{light,dark}.css`).
  - Registra plugins JS de Tailwind (`plugins/icons.ts`, `plugins/typography.ts`).
  - Declara tokens exclusivos del proyecto: breakpoints adicionales,
    animaciones y mapeo de gradientes a utilidades `bg-*`.

### Archivos auxiliares en `web/app/styles/`

| Archivo                                                                                   | Rol                                                |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------- |
| [`preflight.css`](../../web/app/styles/preflight.css)                                     | Baseline propio en lugar del preflight de Tailwind |
| [`globals.css`](../../web/app/styles/globals.css)                                         | Estilos globales de la app                         |
| [`markdown.css`](../../web/app/styles/markdown.css)                                       | Estilos para contenido markdown renderizado        |
| [`monaco-sticky-fix.css`](../../web/app/styles/monaco-sticky-fix.css)                     | Parche visual para el editor Monaco                |
| [`plugins/icons.ts`](../../web/app/styles/plugins/icons.ts)                               | Plugin Tailwind que registra utilities de iconos   |
| [`plugins/typography.ts`](../../web/app/styles/plugins/typography.ts)                     | Plugin Tailwind para escala tipográfica            |

### Breakpoints y animaciones declarados en `tailwind-core.css`

```css
@theme {
  --breakpoint-mobile: 100px;
  --breakpoint-tablet: 640px;
  --breakpoint-pc:     769px;
  --breakpoint-2k:     2560px;

  --animate-spin-slow: spin 2s linear infinite;
}
```

---

## 2. Paleta de colores y design tokens

El sistema está organizado en **tres capas**, de menor a mayor especificidad.

### Capa A — Paleta base (paquete interno `dify-ui`)

| Archivo                                                                                                   | Contenido                                                                                       |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [`packages/dify-ui/src/styles/styles.css`](../../packages/dify-ui/src/styles/styles.css)                  | Escala cruda: `gray 25–900`, `primary 25–900`, `blue`, `green`, `yellow`, `purple`, `indigo`. Sombras `--shadow-*`. Tamaño extra `--text-2xs`. |
| [`packages/dify-ui/src/styles/components.css`](../../packages/dify-ui/src/styles/components.css)          | Clases componibles compartidas entre apps del monorepo                                          |
| [`packages/dify-ui/src/styles/utilities.css`](../../packages/dify-ui/src/styles/utilities.css)            | Utilities compartidas                                                                           |

### Capa B — Tokens semánticos generados

| Archivo                                                                                            | Rol                                                                                                                        |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [`packages/dify-ui/src/themes/theme.css`](../../packages/dify-ui/src/themes/theme.css)             | **Generado**. Registra cada token semántico como `@theme inline`. Patrón: `--color-components-{componente}-{estado}`.       |
| [`packages/dify-ui/src/themes/light.css`](../../packages/dify-ui/src/themes/light.css)             | **Generado**. Valores reales (hex/rgb) bajo `html[data-theme="light"]`. Ej.: `--color-components-button-primary-bg: #155aef`. |
| [`packages/dify-ui/src/themes/dark.css`](../../packages/dify-ui/src/themes/dark.css)               | **Generado**. Valores bajo `html[data-theme="dark"]`.                                                                       |

> **Aviso**: los tres archivos llevan el comentario `Generated. Do not edit by
> hand`. Indica que existe un pipeline (presumiblemente desde una fuente JSON o
> Figma tokens) que reescribe estos archivos. Cambios manuales sobreviven solo
> hasta la próxima regeneración. Si se necesitan ajustes permanentes, lo
> correcto es modificar la fuente de los tokens o, como atajo, añadir overrides
> en una capa posterior (manual o CSS local).

#### Cómo se traducen a utilities Tailwind

`theme.css` usa `@theme inline` para que cada CSS var se exponga como utility:

| CSS var                                  | Utility Tailwind generada       |
| ---------------------------------------- | ------------------------------- |
| `--color-components-button-primary-bg`   | `bg-components-button-primary-bg` |
| `--color-components-input-text-filled`   | `text-components-input-text-filled` |
| `--color-components-input-border-active` | `border-components-input-border-active` |

### Capa C — Gradientes y máscaras del proyecto

Variables específicas de features (chatbot, workflow, toasts, dataset UI,
marketplace, billing, etc.) definidas con valores literales por tema:

- [`web/themes/manual-light.css`](../../web/themes/manual-light.css)
- [`web/themes/manual-dark.css`](../../web/themes/manual-dark.css)

En `tailwind-core.css` se mapean al namespace `--background-image-*` con
`@theme inline` para producir utilities como `bg-chatbot-bg`,
`bg-workflow-process-bg`, etc.

### Cambio de tema light/dark

| Pieza                                                                                | Función                                                                                |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `next-themes` (ver providers en [`web/app/layout.tsx`](../../web/app/layout.tsx))    | `attribute="data-theme"`, `defaultTheme="system"`, `enableSystem`. Alterna `<html data-theme>`. |
| [`web/hooks/use-theme.ts`](../../web/hooks/use-theme.ts)                             | Wrapper que resuelve siempre a `'light'` o `'dark'` (sin estado intermedio `'system'`). |

---

## 3. Tipografías

- **No** se usa `next/font/google` ni `next/font/local`. No hay carga
  declarativa de fuentes Web en `web/app/layout.tsx`.
- La familia tipográfica y la escala viven en el plugin
  [`web/app/styles/plugins/typography.ts`](../../web/app/styles/plugins/typography.ts)
  y en el paquete `@langgenius/dify-ui`.
- `web/app/styles/tailwind-core.css` (líneas 102-105) aplica `font-mono` a
  bloques con clase `code-*` vía `@layer components`.

---

## 4. Iconos

Coexisten dos vías.

### a) Sistema propio de iconos generados

- Directorio: [`web/app/components/base/icons/`](../../web/app/components/base/icons/)
  con categorías: `avatar`, `billing`, `common`, `education`, `files`,
  `knowledge`, `llm`, `model`, `other`, `plugins`, `thought`, `tracing`.
- Cada icono se compone de `<name>.json` (datos serializados) y `<name>.tsx`
  (componente React).
- Generador: [`web/scripts/gen-icons.mjs`](../../web/scripts/gen-icons.mjs).
  - Consume SVGs desde `packages/iconify-collections/assets`.
  - Normaliza `fill`/`stroke` a `currentColor`.
  - Renombra a camelCase/PascalCase.
  - Emite componentes y un `index.ts` agregador por categoría.
- Comando: `pnpm gen-icons`.

### b) Librerías externas

| Paquete                | Uso típico                                                                  |
| ---------------------- | --------------------------------------------------------------------------- |
| `@remixicon/react`     | Importaciones masivas en la UI (`RiDeleteBinLine`, `RiCloseLine`, etc.)     |
| `@heroicons/react`     | Listado en `package.json`; usado de forma puntual                           |

---

## 5. Logos y branding visual

### Activos estáticos

Ubicación: [`web/public/logo/`](../../web/public/logo/).

| Archivo                                | Uso                                    |
| -------------------------------------- | -------------------------------------- |
| `logo.svg`                             | Logo principal SVG (tema claro)        |
| `logo-monochrome-white.svg`            | Variante monocromática para tema oscuro |
| `logo-site.png` / `logo-site-dark.png` | Logo de marca para portadas y emails   |
| `logo-embedded-chat-header*.png`       | Variantes para chat embebido (@2x, @3x) |

### Componentes de logo

| Componente                                                                                                             | Rol                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [`dify-logo.tsx`](../../web/app/components/base/logo/dify-logo.tsx)                                                    | Componente central. Variantes `default` / `monochromeWhite`, tamaños `large` / `medium` / `small`. Selecciona variante por `useTheme()`. Aplica logo custom si existe. |
| [`logo-site.tsx`](../../web/app/components/base/logo/logo-site.tsx)                                                    | Logo para landings / pantallas auth                                                                                 |
| [`logo-embedded-chat-avatar.tsx`](../../web/app/components/base/logo/logo-embedded-chat-avatar.tsx)                    | Avatar en el chat embebido                                                                                          |
| [`logo-embedded-chat-header.tsx`](../../web/app/components/base/logo/logo-embedded-chat-header.tsx)                    | Cabecera del chat embebido                                                                                          |

---

## 6. Personalizaciones del fork (branding configurable)

Este fork extiende el upstream para que cada workspace pueda personalizar
nombre, logo y la presencia de la marca Dify sin tocar código.

### 6.1 Nombre de plataforma (`appName`)

| Pieza                                                                                                                                              | Función                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| [`web/hooks/use-platform-name.ts`](../../web/hooks/use-platform-name.ts)                                                                           | Hook lector con precedencia: enterprise `branding.application_title` → `workspace.custom_config.replace_webapp_name` → fallback `'Dify'`.     |
| `web/app/components/provider/platform-name-sync.tsx`                                                                                               | Sincroniza el nombre con i18n: inyecta `{{appName}}` en las traducciones mediante post-processor.                                              |
| [`web/app/components/custom/custom-web-app-brand/index.tsx`](../../web/app/components/custom/custom-web-app-brand/index.tsx)                       | UI de configuración (campo texto, máx. 60 caracteres).                                                                                         |

### 6.2 Reemplazo de logo (`CAN_REPLACE_LOGO`)

| Pieza                                                                                                                                            | Función                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| [`api/configs/enterprise/__init__.py`](../../api/configs/enterprise/__init__.py)                                                                 | Define `CAN_REPLACE_LOGO: bool` (default `False`).                            |
| [`api/controllers/console/version.py`](../../api/controllers/console/version.py)                                                                 | Expone la flag al frontend en la response `features`.                          |
| [`api/controllers/console/workspace/workspace.py`](../../api/controllers/console/workspace/workspace.py)                                         | Endpoint de subida: `/workspaces/custom-config/webapp-logo/upload`.            |
| [`api/controllers/files/image_preview.py`](../../api/controllers/files/image_preview.py)                                                         | Sirve el logo subido en `/workspaces/<workspace_id>/webapp-logo`.              |
| [`web/app/components/base/logo/dify-logo.tsx`](../../web/app/components/base/logo/dify-logo.tsx) (líneas 43–57)                                  | Render condicional: usa `branding.workspace_logo` / `replace_webapp_logo` si existe, sino el logo por defecto. |

> En este despliegue la variable de entorno `CAN_REPLACE_LOGO=true` está
> habilitada (ver [`docker/.env.example`](../../docker/.env.example)).

### 6.3 Ocultar "Powered by Dify"

| Pieza                                                                                                                                                                          | Función                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `Tenant.custom_config_dict['remove_webapp_brand']`                                                                                                                             | Flag persistida en la BD.                                                |
| [`web/app/components/custom/custom-web-app-brand/components/powered-by-brand.tsx`](../../web/app/components/custom/custom-web-app-brand/components/powered-by-brand.tsx)       | Devuelve `null` cuando la flag está activa, ocultando el "Powered by".    |

### 6.4 Modelo de datos del branding

`Tenant.custom_config` (JSON en la BD):

```json
{
  "remove_webapp_brand":  true,
  "replace_webapp_logo":  "workspaces/<id>/webapp-logo",
  "replace_webapp_name":  "Mi Plataforma"
}
```

---

## 7. Resumen rápido — Action Router de estilos

| Quiero cambiar...                            | Dónde editar                                                                                                                                                                |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color primario / acentos / fondos semánticos | [`packages/dify-ui/src/themes/light.css`](../../packages/dify-ui/src/themes/light.css) y [`dark.css`](../../packages/dify-ui/src/themes/dark.css) **(generados, ver §2.B)** |
| Escala base de colores (gray, blue, etc.)    | [`packages/dify-ui/src/styles/styles.css`](../../packages/dify-ui/src/styles/styles.css)                                                                                    |
| Gradientes y máscaras de features            | [`web/themes/manual-light.css`](../../web/themes/manual-light.css) y [`manual-dark.css`](../../web/themes/manual-dark.css)                                                  |
| Breakpoints, animaciones, gradient utils     | [`web/app/styles/tailwind-core.css`](../../web/app/styles/tailwind-core.css)                                                                                                |
| Tipografía global                            | [`web/app/styles/plugins/typography.ts`](../../web/app/styles/plugins/typography.ts) (o sumar `next/font` en `web/app/layout.tsx`)                                          |
| Añadir / regenerar iconos                    | [`web/scripts/gen-icons.mjs`](../../web/scripts/gen-icons.mjs) + assets en `packages/iconify-collections/assets`                                                            |
| Logos por defecto                            | [`web/public/logo/`](../../web/public/logo/)                                                                                                                                |
| Comportamiento del componente logo           | [`web/app/components/base/logo/dify-logo.tsx`](../../web/app/components/base/logo/dify-logo.tsx)                                                                            |
| Nombre de plataforma en runtime              | UI: [`custom-web-app-brand/index.tsx`](../../web/app/components/custom/custom-web-app-brand/index.tsx). Persiste en `Tenant.custom_config.replace_webapp_name`.             |
| Subir logo custom                            | UI: "custom web app brand" + endpoint en [`workspace.py`](../../api/controllers/console/workspace/workspace.py)                                                              |
| Ocultar "Powered by"                         | Flag `remove_webapp_brand` en `Tenant.custom_config`                                                                                                                         |

---

## 8. Verificación

1. Inspeccionar el DOM en el navegador: el atributo `data-theme` debe estar en
   `<html>`; al cambiar tema deben mutar las CSS vars `--color-components-*`.
2. Confirmar las importaciones citadas en
   [`web/app/styles/tailwind-core.css`](../../web/app/styles/tailwind-core.css).
3. En DevTools, localizar el componente `DifyLogo` y verificar la rama "logo
   custom" vs "logo por defecto" según el valor de `branding.workspace_logo` o
   `custom_config.replace_webapp_logo`.

## 9. Próximos pasos sugeridos

- Si en el futuro se quiere fijar un color primario propio para todo el fork
  sin que el pipeline de tokens lo sobrescriba, considerar una **capa de
  overrides** en `web/themes/manual-light.css` y `manual-dark.css` (esta capa
  no se regenera).
- Si se necesita una tipografía corporativa, añadir `next/font/local` en
  `web/app/layout.tsx` y publicar la variable CSS al `body`.
- Si las personalizaciones de branding aumentan, considerar un archivo
  `docs/frontend/07_branding_extensions.md` con casos de uso (white-label,
  multi-tenant, etc.) para evitar saturar este overview.
