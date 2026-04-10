Dify es una plataforma de desarrollo de aplicaciones de LLM de código abierto. Su interfaz intuitiva combina flujo de trabajo de IA, pipeline RAG, capacidades de agente, gestión de modelos, características de observabilidad y más, lo que le permite pasar rápidamente de un prototipo a producción. Aquí hay una lista de las características principales:

**1. Flujo de trabajo**:
Construye y prueba potentes flujos de trabajo de IA en un lienzo visual, aprovechando todas las siguientes características y más.

**2. Soporte de modelos completo**:
Integración perfecta con cientos de LLMs propietarios / de código abierto de docenas de proveedores de inferencia y soluciones auto-alojadas, que cubren GPT, Mistral, Llama3 y cualquier modelo compatible con la API de OpenAI. Se puede encontrar una lista completa de proveedores de modelos admitidos.

**3. IDE de prompt**:
Interfaz intuitiva para crear prompts, comparar el rendimiento del modelo y agregar características adicionales como texto a voz a una aplicación basada en chat.

**4. Pipeline RAG**:
Amplias capacidades de RAG que cubren todo, desde la ingestión de documentos hasta la recuperación, con soporte listo para usar para la extracción de texto de PDF, PPT y otros formatos de documento comunes.

**5. Capacidades de agente**:
Puedes definir agentes basados en LLM Function Calling o ReAct, y agregar herramientas preconstruidas o personalizadas para el agente. Dify proporciona más de 50 herramientas integradas para agentes de IA, como Búsqueda de Google, DALL·E, Difusión Estable y WolframAlpha.

**6. LLMOps**:
Supervisa y analiza registros de aplicaciones y rendimiento a lo largo del tiempo. Podrías mejorar continuamente prompts, conjuntos de datos y modelos basados en datos de producción y anotaciones.

**7. Backend como servicio**:
Todas las ofertas de Dify vienen con APIs correspondientes, por lo que podrías integrar Dify sin esfuerzo en tu propia lógica empresarial.

## Usando Dify

- **Nube </br>**
  Hospedamos un servicio [Dify Cloud](https://dify.ai) para que cualquiera lo pruebe sin configuración. Proporciona todas las capacidades de la versión autoimplementada e incluye 200 llamadas gratuitas a GPT-4 en el plan sandbox.

- **Auto-alojamiento de Dify Community Edition</br>**
  Pon rápidamente Dify en funcionamiento en tu entorno con esta [guía de inicio rápido](#quick-start).
  Usa nuestra [documentación](https://docs.dify.ai) para más referencias e instrucciones más detalladas.

- **Dify para Empresas / Organizaciones</br>**
  Proporcionamos características adicionales centradas en la empresa.

  > Para startups y pequeñas empresas que utilizan AWS, echa un vistazo e impleméntalo en tu propio VPC de AWS con un clic. Es una AMI asequible que ofrece la opción de crear aplicaciones con logotipo y marca personalizados.

## Inicio Rápido

> Antes de instalar Dify, asegúrate de que tu máquina cumpla con los siguientes requisitos mínimos del sistema:
>
> - CPU >= 2 núcleos
> - RAM >= 4GB

```bash
cd docker
cp .env.example .env
docker compose up -d
```

Después de ejecutarlo, puedes acceder al panel de control de Dify en tu navegador en [http://localhost/install](http://localhost/install) y comenzar el proceso de inicialización.

## Próximos pasos

Si necesita personalizar la configuración, consulte los comentarios en nuestro archivo [.env.example](../../docker/.env.example) y actualice los valores correspondientes en su archivo `.env`. Además, es posible que deba realizar ajustes en el propio archivo `docker-compose.yaml`, como cambiar las versiones de las imágenes, las asignaciones de puertos o los montajes de volúmenes, según su entorno de implementación y requisitos específicos. Después de realizar cualquier cambio, vuelva a ejecutar `docker-compose up -d`. Puede encontrar la lista completa de variables de entorno disponibles

## Licencia

Este repositorio está disponible bajo la [Licencia de Código Abierto de Dify](../../LICENSE), que es esencialmente Apache 2.0 con algunas restricciones adicionales.
