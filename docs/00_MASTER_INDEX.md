# Índice Maestro — Dify (Fork)

## 1. Visión General

Dify es una plataforma de desarrollo de aplicaciones LLM compuesta por un **backend Python/Flask** (API REST + workers Celery) que orquesta proveedores de modelos, pipelines RAG, workflows y almacenamiento vectorial sobre PostgreSQL/Redis, y un **frontend Next.js 14** (App Router, React, Tailwind v4) que expone la consola de administración, el editor de workflows y la webapp pública embebible. La comunicación entre capas ocurre principalmente vía REST/SSE; el estado del frontend se gestiona con React Context, Zustand, Jotai y nuqs según el alcance.

---

## 2. Mapa de Documentación

### Backend (`./backend/`)

| Archivo                                                                        | Qué contiene                                                                                                                                                    | Para qué sirve                                                                                         |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [01_backend_overview.md](./backend/01_backend_overview.md)                     | Stack Flask, estructura de directorios, flujo de arranque, dependencias externas (PG, Redis, vector store, storage) y variables de entorno críticas             | Punto de entrada para entender cómo se levanta el backend y qué infraestructura requiere               |
| [02_data_models_and_auth.md](./backend/02_data_models_and_auth.md)             | Modelos ORM principales (Account, Tenant, App, Dataset, Provider), flujo de autenticación, decoradores de autorización y cifrado de credenciales                | Referencia para trabajar con la base de datos, sesiones, roles y seguridad                             |
| [03_llm_and_workers.md](./backend/03_llm_and_workers.md)                       | Arquitectura de integración con LLMs, sistema de providers, pipeline RAG completo (extracción, indexación, retrieval, post-proceso) y catálogo de tareas Celery | Referencia para añadir modelos, modificar el pipeline de conocimiento o crear nuevas tareas asíncronas |
| [04_api_contracts.md](./backend/04_api_contracts.md)                           | Mapa completo de endpoints por Blueprint: Console API, Service API pública, Web App API, Files API y MCP API                                                    | Referencia rápida de qué endpoints existen, sus prefijos y estructura de rutas                         |
| [05_backend_modification_guide.md](./backend/05_backend_modification_guide.md) | Guías paso a paso: añadir un nuevo proveedor LLM y crear un nuevo endpoint en la API                                                                            | Manual de cambios: seguir estos pasos para extender el backend sin romper la arquitectura              |

### Frontend (`./frontend/`)

| Archivo                                                                           | Qué contiene                                                                                                                                            | Para qué sirve                                                                           |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [01_frontend_overview.md](./frontend/01_frontend_overview.md)                     | Stack Next.js/React, dependencias clave, configuración de Next.js, sistema de estilos (Tailwind v4, temas, CSS global) y árbol de providers raíz        | Punto de entrada para entender cómo está configurado el frontend y sus convenciones base |
| [02_state_and_routing.md](./frontend/02_state_and_routing.md)                     | Estrategias de estado (Context, Zustand, Jotai, nuqs), árbol de rutas por grupo de layout y flujo de navegación principal                               | Referencia para añadir páginas, entender dónde vive el estado y cómo fluye la navegación |
| [03_core_components.md](./frontend/03_core_components.md)                         | Design system (`base/`), layouts de cabecera y catálogo de componentes por feature (apps, workflow editor, datasets, plugins, explore)                  | Referencia para reutilizar componentes existentes antes de crear nuevos                  |
| [04_api_consumption.md](./frontend/04_api_consumption.md)                         | Capa de fetch, selección de base URL, interceptores, streaming SSE, subida de archivos, clientes ORPC tipados, hooks TanStack Query y manejo de errores | Referencia para conectar el frontend a cualquier endpoint del backend                    |
| [05_frontend_modification_guide.md](./frontend/05_frontend_modification_guide.md) | Guías paso a paso: modificar componentes del dashboard, añadir rutas, conectar nuevos endpoints y checklist de cambios                                  | Manual de cambios: seguir estos pasos para extender el frontend de forma consistente     |
| [06_styling_and_branding.md](./frontend/06_styling_and_branding.md)               | Sistema de estilos (Tailwind v4 CSS-first), capas de design tokens, temas light/dark, tipografías, iconos, logos y personalizaciones de branding del fork | Referencia única para cualquier cambio estético: colores, fuentes, iconos, logos o nombre de la plataforma |

---

## 3. Matriz de Modificaciones (Action Router)

| Qué quiero hacer                                            | Dónde buscar                                                                                                                                          |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Añadir un nuevo proveedor de LLM                            | [backend/05](./backend/05_backend_modification_guide.md) §A → [backend/03](./backend/03_llm_and_workers.md) §2                                        |
| Modificar el pipeline RAG (indexación, retrieval, chunking) | [backend/03](./backend/03_llm_and_workers.md) §3                                                                                                      |
| Crear un nuevo endpoint en la API                           | [backend/05](./backend/05_backend_modification_guide.md) §B → [backend/04](./backend/04_api_contracts.md) para elegir Blueprint                       |
| Entender/modificar autenticación o roles                    | [backend/02](./backend/02_data_models_and_auth.md) §4                                                                                                 |
| Añadir o cambiar un modelo de base de datos                 | [backend/02](./backend/02_data_models_and_auth.md) §2–§6                                                                                              |
| Crear una tarea asíncrona (Celery)                          | [backend/03](./backend/03_llm_and_workers.md) §4                                                                                                      |
| Modificar variables de entorno / infraestructura            | [backend/01](./backend/01_backend_overview.md) §5–§7                                                                                                  |
| Modificar un componente existente del dashboard             | [frontend/05](./frontend/05_frontend_modification_guide.md) §A → [frontend/03](./frontend/03_core_components.md)                                      |
| Añadir una nueva página o ruta en la consola                | [frontend/05](./frontend/05_frontend_modification_guide.md) §B → [frontend/02](./frontend/02_state_and_routing.md)                                    |
| Conectar un nuevo endpoint del backend a la UI              | [frontend/05](./frontend/05_frontend_modification_guide.md) §C → [frontend/04](./frontend/04_api_consumption.md)                                      |
| Añadir un componente al design system                       | [frontend/03](./frontend/03_core_components.md) §Design System                                                                                        |
| Cambiar estilos globales o el sistema de temas              | [frontend/06](./frontend/06_styling_and_branding.md)                                                                                                  |
| Cambiar la paleta de colores / colores semánticos           | [frontend/06](./frontend/06_styling_and_branding.md) §2 — capas A/B/C                                                                                 |
| Cambiar la tipografía o añadir una fuente                   | [frontend/06](./frontend/06_styling_and_branding.md) §3                                                                                               |
| Añadir, regenerar o reemplazar iconos                       | [frontend/06](./frontend/06_styling_and_branding.md) §4                                                                                               |
| Cambiar logos por defecto o el componente que los renderiza | [frontend/06](./frontend/06_styling_and_branding.md) §5                                                                                               |
| Configurar nombre de plataforma, logo custom o "Powered by" | [frontend/06](./frontend/06_styling_and_branding.md) §6                                                                                               |
| Gestionar estado global o por feature                       | [frontend/02](./frontend/02_state_and_routing.md) §Estado global                                                                                      |
| Añadir soporte i18n a un componente                         | [frontend/05](./frontend/05_frontend_modification_guide.md) §A.4                                                                                      |
| Modificar la webapp pública embebible (shareLayout)         | [frontend/02](./frontend/02_state_and_routing.md) §shareLayout → [frontend/05](./frontend/05_frontend_modification_guide.md) §B.5                     |
| Entender el flujo completo de una petición end-to-end       | [frontend/04](./frontend/04_api_consumption.md) + [backend/04](./backend/04_api_contracts.md) + [backend/02](./backend/02_data_models_and_auth.md) §4 |
