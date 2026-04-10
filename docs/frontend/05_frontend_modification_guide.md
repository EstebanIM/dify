# 05 — Guía de Modificación del Frontend

Esta guía cubre los tres escenarios más comunes al trabajar en el frontend de Dify:

1. Modificar un componente existente del Dashboard
2. Agregar una nueva ruta/página
3. Conectar un nuevo endpoint del backend a un componente UI

---

## A. Cómo modificar un componente del Dashboard

### 1. Localizar el componente

El dashboard autenticado vive bajo `(commonLayout)`. Los componentes de features están en `web/app/components/`. La estructura refleja la URL:

- Página de detalle de un app → `app/components/app/`
- Listado de apps → `app/components/apps/`
- Conocimiento/datasets → `app/components/datasets/`
- Workflow editor → `app/components/workflow/`
- Header/nav → `app/components/header/`
- Primitivas UI → `app/components/base/`

Si no estás seguro de la ubicación, busca por texto visible en la UI:
```bash
grep -r "Texto visible" web/app/components/ --include="*.tsx" -l
```

### 2. Entender el contexto del componente

Antes de editar, identifica de qué datos depende el componente:

```tsx
// Patrón típico de un componente de dashboard
'use client'

import { useContextSelector } from 'use-context-selector'
import { AppContext } from '@/context/app-context'
import { useMyFeatureData } from '@/service/use-my-feature'

const MyComponent = () => {
  // Estado de contexto — solo se re-renderiza si cambia userProfile
  const userProfile = useContextSelector(AppContext, v => v.userProfile)

  // Datos del servidor via TanStack Query
  const { data, isLoading, isError } = useMyFeatureData()

  // Estado de Zustand (si el componente está dentro del app-detail scope)
  const appDetail = useStore(s => s.appDetail)

  if (isLoading) return <Loading />
  if (isError) return <div>Error...</div>

  return <div>{/* UI */}</div>
}
```

### 3. Modificar estilos

**Usar clases de Tailwind directamente**. Las variables semánticas de color están disponibles como clases Tailwind:

```tsx
// Correcto — colores semánticos del sistema de diseño
<div className="bg-background-body text-text-primary border border-divider-regular">

// Para variantes complejas de un mismo componente, usar CVA
import { cva } from 'class-variance-authority'
const styles = cva('base-classes', {
  variants: { variant: { primary: 'bg-primary-600', secondary: 'bg-gray-100' } }
})
```

**No crear CSS nuevo** a menos que sea imprescindible. Si un componente necesita CSS, añadirlo en `app/components/base/<componente>/index.css` e importarlo en `app/styles/globals.css`.

### 4. Modificar contenido i18n

Los textos visibles al usuario **no se escriben inline**. Se usan claves de traducción:

```tsx
import { useTranslation } from 'react-i18next'

const MyComponent = () => {
  const { t } = useTranslation()
  return <span>{t('myFeature.myKey')}</span>
}
```

Los archivos de traducción están en `web/i18n/<locale>/`. Para agregar una clave nueva:
1. Añadirla en `web/i18n/en-US/my-feature.ts` (inglés primero).
2. Añadir la traducción en los otros locales (`zh-Hans`, `ja-JP`, `fr-FR`, etc.).
3. Verificar cobertura: `pnpm check-i18n`.

### 5. Modificar el estado de un componente

**Estado local de un componente**: `useState` estándar de React.

**Estado compartido entre componentes hermanos**: elevar al ancestro común o al Context/Zustand más cercano.

**Agregar al ModalContext (para un modal global nuevo)**:
```tsx
// 1. En context/modal-context.ts, añadir al estado:
type ModalState = {
  // ... existentes
  showMyNewModal: boolean
  setShowMyNewModal: (show: boolean) => void
}

// 2. En context/modal-context-provider.tsx, implementar el estado y función
// 3. Consumir desde cualquier componente:
const setShowMyNewModal = useContextSelector(ModalContext, v => v.setShowMyNewModal)
```

---

## B. Cómo agregar una nueva ruta/página

### 1. Decidir en qué grupo de rutas va

| Tipo de página | Grupo de rutas | Path base |
|---|---|---|
| Página de dashboard (autenticada) | `(commonLayout)` | Protegida por auth + roles |
| Webapp pública (embeddable) | `(shareLayout)` | Accesible sin login del dashboard |
| Página de auth (login, signup) | Raíz o con su propio layout | Sin providers del dashboard |
| Human-in-the-loop | `(humanInputLayout)` | — |

### 2. Crear la página en el grupo correcto

Ejemplo: nueva página del dashboard en `/tools/new-feature`:

```
web/app/(commonLayout)/tools/new-feature/
└── page.tsx
```

```tsx
// web/app/(commonLayout)/tools/new-feature/page.tsx
import type { FC } from 'react'
import MyNewFeaturePage from '@/app/components/tools/new-feature'

// Para páginas del dashboard: NO usar 'use client' aquí.
// El page.tsx es un Server Component que renderiza el client component raíz.
const Page: FC = () => {
  return <MyNewFeaturePage />
}

export default Page
```

Crear el componente en `app/components/`:
```
web/app/components/tools/new-feature/
└── index.tsx   ← aquí va la lógica y UI
```

```tsx
// web/app/components/tools/new-feature/index.tsx
'use client'

const NewFeaturePage = () => {
  return (
    <div className="flex flex-col items-start p-6">
      {/* UI */}
    </div>
  )
}

export default NewFeaturePage
```

### 3. Agregar la ruta al navegador (si aplica)

Si la nueva página necesita aparecer en el sidebar o en el header del app-detail, editar:

**Para navegación del app-detail** (`[appId]/nueva-seccion`):
- `web/app/components/app-sidebar/` — añadir el item al sidebar
- `web/app/(commonLayout)/app/(appDetailLayout)/[appId]/nueva-seccion/page.tsx`

**Para navegación principal del header**:
- `web/app/components/header/` — editar el nav correspondiente (`app-nav/`, `dataset-nav/`, etc.)

### 4. Proteger la ruta con roles (si aplica)

El `RoleRouteGuard` en `(commonLayout)/layout.tsx` usa `isCurrentWorkspaceOwner`, `isCurrentWorkspaceManager`, etc. del `AppContext`. Para restringir acceso:

```tsx
// En el componente de la página:
const isOwner = useContextSelector(AppContext, v => v.isCurrentWorkspaceOwner)

if (!isOwner) return <div>No tienes acceso</div>
```

### 5. Páginas de webapp pública (shareLayout)

Para una nueva app pública en `/my-app/[token]`:

```
web/app/(shareLayout)/my-app/[token]/
└── page.tsx
```

El `[token]` es el share code. `WebAppStoreProvider` en el layout ya gestiona la autenticación y carga de `appInfo`. La página puede leer el store:

```tsx
'use client'
import { useWebAppStore } from '@/context/web-app-context'

const MyAppPage = () => {
  const appInfo = useWebAppStore(s => s.appInfo)
  // ...
}
```

---

## C. Conectar un nuevo endpoint del backend a un componente UI

### Paso 1: Crear el helper de servicio

En `web/service/` añadir la llamada HTTP en el archivo de servicio correspondiente (o crear uno nuevo si es un módulo nuevo):

```ts
// web/service/my-feature.ts
import { get, post, put, del } from './base'
import type { MyResource, CreateMyResourceParams } from '@/models/my-feature'

export const getMyResources = (params: { page: number; limit: number }) =>
  get<{ data: MyResource[]; total: number }>('/my-resources', params)

export const createMyResource = (params: CreateMyResourceParams) =>
  post<MyResource>('/my-resources', { body: params })

export const updateMyResource = (id: string, params: Partial<CreateMyResourceParams>) =>
  put<MyResource>(`/my-resources/${id}`, { body: params })

export const deleteMyResource = (id: string) =>
  del<void>(`/my-resources/${id}`)
```

Las rutas son relativas al `API_PREFIX` (`/console/api`). No incluir el prefijo en la ruta.

### Paso 2: Crear los tipos

```ts
// web/models/my-feature.ts
export type MyResource = {
  id: string
  name: string
  created_at: number
  // ... campos del backend
}

export type CreateMyResourceParams = {
  name: string
  // ...
}
```

### Paso 3: Crear los hooks de TanStack Query

```ts
// web/service/use-my-feature.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createMyResource, deleteMyResource, getMyResources, updateMyResource } from './my-feature'

// Query key factory para invalidación consistente
const myResourceKeys = {
  all: ['my-resources'] as const,
  list: (params: { page: number; limit: number }) =>
    [...myResourceKeys.all, 'list', params] as const,
  detail: (id: string) => [...myResourceKeys.all, 'detail', id] as const,
}

export const useMyResources = (params: { page: number; limit: number }) => {
  return useQuery({
    queryKey: myResourceKeys.list(params),
    queryFn: () => getMyResources(params),
  })
}

export const useCreateMyResource = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createMyResource,
    onSuccess: () => {
      // Invalida el listado para que se re-fetche
      queryClient.invalidateQueries({ queryKey: myResourceKeys.all })
    },
  })
}

export const useUpdateMyResource = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: Parameters<typeof updateMyResource>[1] }) =>
      updateMyResource(id, params),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: myResourceKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: myResourceKeys.all })
    },
  })
}

export const useDeleteMyResource = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteMyResource,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myResourceKeys.all }),
  })
}
```

### Paso 4: Usar los hooks en el componente UI

```tsx
// web/app/components/my-feature/list.tsx
'use client'

import { useState } from 'react'
import { useMyResources, useCreateMyResource, useDeleteMyResource } from '@/service/use-my-feature'
import Button from '@/app/components/base/button'
import Loading from '@/app/components/base/loading'
import Confirm from '@/app/components/base/confirm'
import { useTranslation } from 'react-i18next'

const MyResourceList = () => {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data, isLoading } = useMyResources({ page, limit: 10 })
  const { mutate: createResource, isPending: isCreating } = useCreateMyResource()
  const { mutate: deleteResource } = useDeleteMyResource()

  if (isLoading) return <Loading />

  return (
    <div>
      <Button
        variant="primary"
        loading={isCreating}
        onClick={() => createResource({ name: 'New Resource' })}
      >
        {t('myFeature.createNew')}
      </Button>

      {data?.data.map(resource => (
        <div key={resource.id} className="flex items-center justify-between p-3 border border-divider-regular rounded-lg">
          <span className="text-text-primary system-sm-regular">{resource.name}</span>
          <Button
            variant="ghost"
            size="small"
            onClick={() => setDeletingId(resource.id)}
          >
            {t('common.delete')}
          </Button>
        </div>
      ))}

      {deletingId && (
        <Confirm
          title={t('myFeature.deleteConfirm.title')}
          content={t('myFeature.deleteConfirm.message')}
          onConfirm={() => {
            deleteResource(deletingId)
            setDeletingId(null)
          }}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  )
}

export default MyResourceList
```

### Paso 5 (opcional): Endpoint de la webapp pública

Si el endpoint es de la webapp pública (prefijo `/api`), usar los helpers `*Public`:

```ts
// service/my-public-feature.ts
import { getPublic, postPublic } from './base'

export const getPublicData = (shareCode: string) =>
  getPublic<MyData>(`/my-resource`, { share_code: shareCode }, { isPublicAPI: true })
```

La autenticación (token en localStorage + share code en header) se maneja automáticamente por el interceptor `beforeRequestPublicWithCode` de `service/fetch.ts`.

---

## Checklist rápido al hacer cambios en el frontend

```
□ ¿Los textos usan claves i18n? (useTranslation + archivos en i18n/)
□ ¿Los colores usan variables semánticas de Tailwind? (text-text-primary, bg-background-body...)
□ ¿Los consumidores de Context usan useContextSelector? (no useContext directamente)
□ ¿Los hooks de datos están en service/use-*.ts? (TanStack Query, no fetch directo en componentes)
□ ¿Los tipos están en models/ o types/? (no inline en el componente)
□ ¿La página nueva está en el grupo de rutas correcto? ((commonLayout) vs (shareLayout))
□ ¿Se ejecutaron las pruebas? (pnpm test)
□ ¿Se revisó i18n? (pnpm check-i18n)
```

---

## Comandos de desarrollo

```bash
cd web

# Instalar dependencias
pnpm install

# Desarrollo con Turbopack
pnpm dev

# Build de producción
pnpm build

# Lint
pnpm lint

# Tests (Vitest)
pnpm test

# Verificar cobertura i18n
pnpm check-i18n

# Generar iconos
pnpm gen-icons

# Storybook (explorador de componentes)
pnpm storybook
```

## Variables de entorno necesarias

Crear `web/.env.local`:

```env
NEXT_PUBLIC_API_PREFIX=http://localhost:5001/console/api
NEXT_PUBLIC_PUBLIC_API_PREFIX=http://localhost:5001/api
NEXT_PUBLIC_EDITION=SELF_HOSTED
# NEXT_PUBLIC_BASE_PATH=/dify  # solo si se sirve bajo un sub-path
```
