# Operación y Smoke Checks

## Estrategia por entorno

El backend mantiene un único camino de código y varía el comportamiento runtime mediante variables de entorno.

Separación recomendada por entorno:

- desarrollo local: MongoDB local o una base remota dedicada, `CORS_ORIGIN` explícito y credenciales de proveedores de bajo riesgo
- CI: configuración de prueba aislada, comandos de validación determinísticos y sin secretos de producción
- producción: MongoDB gestionado, credenciales productivas de proveedores, allowlist explícita de CORS y manejo de secretos específico del despliegue

El backend debería evitar forks por entorno dentro del código fuente. Los cambios entre entornos deben expresarse mediante configuración, no mediante módulos alternativos ni duplicación de features.

## Variables runtime requeridas

- `PORT`
- `MONGO_URI`
- `CORS_ORIGIN`
- `SPOONACULAR_API_KEY`
- `SPOONACULAR_BASE_URL`
- `AZURE_TRANSLATOR_KEY`
- `AZURE_TRANSLATOR_REGION`
- `AZURE_TRANSLATOR_ENDPOINT`

## Smoke checks mínimos

Estos checks buscan responder una pregunta operativa acotada: si la API desplegada todavía puede alcanzar sus dependencias críticas y devolver respuestas esperadas.

### Línea base de la API

- `GET /api/health` devuelve `200`
- `GET /openapi.json` devuelve `200`

### MongoDB

Objetivo:

- confirmar que la API puede leer estado persistido

Smoke check sugerido:

- llamar `GET /api/recipes` y verificar que la API responda sin errores de conexión

Señal esperada:

- sin fallos de conexión de Mongoose
- sin timeouts causados por falta de acceso a la base

### Spoonacular

Objetivo:

- confirmar conectividad con el proveedor y manejo controlado de errores

Smoke check sugerido:

- llamar `GET /api/recipes/search?q=pasta`

Señal esperada:

- `200` con resultados de recetas, o un contrato de error controlado del backend si el proveedor no está disponible

### Azure Translator

Objetivo:

- confirmar que el flujo de traducción sigue funcionando y que el fallback con caché sigue siendo seguro

Smoke checks sugeridos:

- llamar `GET /api/recipes/search?q=sopa&lang=es`
- llamar `GET /api/recipes/daily?lang=es`

Señal esperada:

- respuestas en español traducidas o servidas desde caché cuando la traducción funciona
- fallback seguro a contenido sin traducir si la traducción no está disponible temporalmente

## Comandos de validación

La validación a nivel de repositorio debe seguir usando:

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

Estos comandos validan calidad de código y estabilidad de contratos, pero no reemplazan los smoke checks runtime sobre infraestructura desplegada.
