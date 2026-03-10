# Guía de Desarrollo

Este documento describe cómo ejecutar y desarrollar Foodly Notes API en local.

## Requisitos

- Node.js 22+
- MongoDB (local o remoto)
- API key de Spoonacular
- Credenciales de Azure Cognitive Translator

## Variables de entorno

Creá un archivo `.env` o configurá las variables de entorno con estos valores:

```env
PORT=3000

MONGO_URI=mongodb://localhost:27017/foodly-notes

# Origen web de producción: https://foodlynotes.app
# Origen de Capacitor Android: http://localhost
# Origen de Capacitor iOS: capacitor://localhost
# Usá una allowlist separada por comas y sin trailing slash.
CORS_ORIGIN=https://foodlynotes.app,http://localhost,capacitor://localhost

SPOONACULAR_API_KEY=your_spoonacular_key
SPOONACULAR_BASE_URL=https://api.spoonacular.com

AZURE_TRANSLATOR_KEY=your_azure_key
AZURE_TRANSLATOR_REGION=your_azure_region
AZURE_TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com
```

`AZURE_TRANSLATOR_ENDPOINT` debe apuntar a la raíz del servicio. La API agrega `/translate` internamente.

Para producción de Foodly Notes conviene usar una allowlist explícita en `CORS_ORIGIN` en lugar de `*`. El valor recomendado hoy es `https://foodlynotes.app,http://localhost,capacitor://localhost`.

## Ejecución local

```bash
npm install
npm run start:dev
```

La API queda disponible en `http://localhost:3000`.

Swagger queda disponible en `http://localhost:3000/docs`.

El OpenAPI JSON queda disponible en `http://localhost:3000/openapi.json`.

## Validación

```bash
npm run test
npm run test:e2e
npm run build
```

## Estrategia de traducción

- Las recetas se obtienen en inglés desde Spoonacular.
- Las traducciones al español se generan on-demand.
- Una vez traducidas, se persisten.
- Las siguientes consultas reutilizan esas traducciones.

Esto evita llamadas innecesarias al traductor y mejora el rendimiento.

## Notas

- Las recetas diarias se cachean por fecha.
- Los registros diarios viejos se conservan hasta definir una estrategia de limpieza.
- Favoritos y listas de compras siguen siendo responsabilidad del cliente.

## Consideraciones de producción

- La API se mantiene stateless.
- Las llamadas a proveedores externos se reducen con persistencia y cache diario.
- `CORS_ORIGIN` debería restringirse por entorno fuera del desarrollo local cuando no haga falta acceso abierto.
- La app está lista para containerización y despliegue en cloud.

Para la estrategia por entorno y los smoke checks, ver [docs/operations.es.md](./docs/operations.es.md).
