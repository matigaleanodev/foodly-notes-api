# Alcance del Backend y Dependencias Externas

## Límites funcionales

`foodly-notes-api` se mantiene intencionalmente limitado a la recuperación de recetas y al soporte de traducción.

El backend posee:

- obtención de recetas diarias
- búsqueda de recetas
- detalle de recetas
- recetas similares
- agregación de ingredientes para flujos de compras
- traducción de consultas y contenido cuando aporta al flujo de recetas
- persistencia y caché para reducir llamadas redundantes a proveedores externos
- shape de respuestas para el frontend

El backend no posee:

- sincronización de favoritos
- sincronización de la shopping list
- cuentas de usuario o autenticación
- comentarios, ratings o features sociales
- planificación de comidas
- recetas generadas por usuarios
- estado de aplicación cross-device

Esas responsabilidades siguen siendo del frontend o quedan fuera de alcance hasta que una decisión de arquitectura documentada cambie ese límite.

## Dependencias externas

La API depende actualmente de estos proveedores externos:

### Spoonacular

Propósito:

- búsqueda de recetas
- detalle de recetas
- recetas similares
- datos fuente para recetas diarias

Responsabilidad actual del backend:

- encapsulación de llamadas a través de `SpoonacularService`
- normalización de respuestas antes de exponer datos al cliente
- mapeo controlado de errores cuando falla el proveedor

### Azure Translator

Propósito:

- traducir contenido de recetas al español
- traducir consultas de búsqueda en español a inglés antes de consultar al proveedor
- traducir títulos cacheados de recetas diarias y similares cuando se piden en español

Responsabilidad actual del backend:

- encapsulación de llamadas a través de servicios de traducción
- persistencia de traducciones para evitar el uso repetido del proveedor
- fallback controlado cuando la traducción no está disponible

## Estrategia de persistencia y cache

La API usa persistencia respaldada por MongoDB para reducir trabajo externo repetido:

- las recetas diarias se cachean por fecha
- los detalles de recetas se persisten después del primer fetch al proveedor
- el contenido traducido de recetas se persiste por receta
- las consultas traducidas y los textos de resúmenes se persisten en una colección de caché de traducciones

La regla actual es simple: toda traducción producida por el backend debe quedar cacheada.

## Configuración por entorno

El runtime depende de estas variables:

- `MONGO_URI`
- `CORS_ORIGIN`
- `SPOONACULAR_API_KEY`
- `SPOONACULAR_BASE_URL`
- `AZURE_TRANSLATOR_KEY`
- `AZURE_TRANSLATOR_REGION`
- `AZURE_TRANSLATOR_ENDPOINT`

`CORS_ORIGIN` debería configurarse como una allowlist apropiada para clientes web y Capacitor.

Para ejemplos de setup y operación, ver [../DEVELOPMENT.es.md](../DEVELOPMENT.es.md).
