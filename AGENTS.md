# foodly-notes-api

## Contexto de trabajo

Si existe un workspace con AGENTS.md en los directorios padre, leerlo explícitamente antes de editar y seguir sus referencias. Una raíz Git anidada puede impedir la herencia automática. Fuera de ese entorno, este archivo y el README deben ser suficientes para trabajar.

## Código y contratos

- NestJS, TypeScript y MongoDB/Mongoose; módulos en src/ y pruebas en test/.
- API de recetas: daily, búsqueda, detalle, similares, listado e ingredientes por lote.
- Spoonacular y Azure Translator permanecen encapsulados en servicios del backend.
- Conservar cachés, cuotas y persistencia que evitan llamadas redundantes.
- Favoritos, listas de compras y traducción de interfaz pertenecen al cliente.
- Preservar validación DTO, errores, estados HTTP y compatibilidad con foodly-notes-front.
- La implementación Lambda compatible se mantiene en foodly-notes-api-cloud.

## Desarrollo y verificación

- Instalar con npm ci; iniciar con npm run start:dev.
- Compilar con npm run build; probar con npm test.
- Usar npm run test:e2e o npm run test:integration cuando el cambio lo requiera.
- Regenerar contratos con npm run generate:openapi; mantener Swagger alineado con DTOs.
- npm run lint aplica correcciones; revisar su diff antes de conservarlo.

## Restricciones

- No convertir respuestas de recetas en envelopes ni exponer documentos Mongo.
- Las pruebas de proveedores usan dobles; las llamadas reales requieren alcance explícito.
- No ejecutar scripts que apliquen índices ni tareas de producción al verificar documentación.
- Consultar README y DEVELOPMENT para configuración y comandos adicionales.
