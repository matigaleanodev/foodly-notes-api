# Seguridad y despliegue

## Runtime y migración

Usar Node 24 (mínimo 24.15.0; `.nvmrc` fija la versión local) y `npm ci`.
Nest runtime se actualizó a 12, Mongoose a 9 y los adaptadores a versiones compatibles.
La CLI queda en 11: no participa en runtime y su actualización requeriría cambiar TypeScript.

Antes de iniciar una API existente:

```bash
npm run db:indexes
npm run db:indexes -- --apply
```

El primer comando sólo revisa duplicados. El segundo crea índices únicos de recetas,
recetas diarias y traducciones, y TTL para traducciones (30 días) y contadores.
Si hay duplicados, se detiene sin eliminar registros; resolverlos antes de desplegar.
La imagen Docker y `npm run start:prod` ejecutan esta verificación al iniciar.
Las traducciones guardadas dentro de una receta no caducan con el caché de textos.

## HTTPS, proxy y headers

Producción requiere `CORS_ORIGIN` explícito y `TRUST_PROXY` con las direcciones o
subredes reales del proxy inmediato. Consultar `.env.security.example`.
El proxy debe sobrescribir los headers reenviados y el origen no debe quedar
accesible directamente por Internet. No configurar `true`, `*` ni cantidad de saltos.
`ENFORCE_HTTPS` es `true` por defecto en producción: rechaza con 400 peticiones
inseguras; la redirección HTTP a HTTPS corresponde al ingress. `/api/health` queda
exceptuado para el healthcheck interno y no consulta proveedores.

Helmet aplica CSP, protección contra framing, `nosniff`, política de referrer y
HSTS de un año en producción. Se deshabilitan `X-Powered-By` y ETag; las respuestas
dinámicas usan `Cache-Control: no-store`. Swagger y OpenAPI públicos quedan apagados
en producción; `SWAGGER_ENABLED=true` los habilita explícitamente.
Para local, HTTPS no es obligatorio y Swagger queda habilitado por defecto.

CORS admite únicamente los orígenes configurados, incluyendo los de Capacitor si
se utilizan. CORS no es autenticación ni protección contra clientes externos.
No hay usuarios ni recursos privados en esta API: las recetas son públicas.
MongoDB no ofrece RLS de PostgreSQL; una futura cuenta de usuario requerirá
autorización por propietario en cada consulta y credenciales con permisos mínimos.

## Abuso, bots y costos

Los contadores atómicos se guardan en MongoDB, funcionan entre procesos y sobreviven
a reinicios. Se devuelve 429 con `Retry-After` al superar límites por IP:

| Límite | Valor por defecto |
| --- | --- |
| Global, sumando rutas | 120/minuto |
| Cada ruta | 30/minuto |
| Búsqueda y similares | 20/minuto |
| Ingredientes | 10/minuto |

Son ventanas fijas: puede haber ráfagas al cambiar de minuto. Las IP compartidas
también comparten límite. `RATE_LIMIT_GLOBAL` y `RATE_LIMIT_PER_ROUTE` configuran los
límites generales; las rutas costosas tienen sus propios límites explícitos.
El servidor falla con 503 si no puede comprobar contadores, evitando gasto sin control.

Los proveedores usan un presupuesto diario UTC compartido: 100 solicitudes de
Spoonacular y 50.000 caracteres de Azure por defecto. Las solicitudes fallidas
también consumen presupuesto. El límite de Spoonacular cuenta solicitudes, no sus
puntos de facturación: ajustar según el plan y los endpoints usados.
`PROVIDER_MAX_CONCURRENCY=4` limita llamadas simultáneas por proceso.
Los presupuestos tienen variables independientes en `.env.security.example`.
Presupuesto agotado o capacidad ocupada produce 503 con `Retry-After`; las
traducciones mantienen el fallback al idioma original. El caché reduce llamadas
repetidas y las peticiones simultáneas idénticas se agrupan por proceso.
Los clientes no deben reintentar automáticamente al recibir 429/503.

Esto limita abuso y gasto, pero no demuestra que un cliente sea humano. Para bots
distribuidos y ataques que ni siquiera alcanzan el controlador, configurar límites
y detección en Cloudflare/ingress. No se instalaron reglas externas desde este repo.
En la auditoría el borde respondió 403/error 1010: la redirección y los headers
efectivos del dominio requieren verificación después del despliegue desde un cliente permitido.

## Contratos y contenido

- IDs: enteros positivos seguros; se rechazan booleanos, decimales y coerciones ambiguas.
- Ingredientes: entre 1 y 20 IDs únicos por petición. El front debe dividir listas mayores.
- Búsqueda: texto sin controles, recortado, entre 1 y 200 caracteres.
- Listado persistido: array paginado con `limit` (50 por defecto, máximo 100) y
  `after` (último `sourceId`). Orden ascendente, sin metadatos internos.
- JSON estricto, cuerpo máximo 16 KiB, URL máxima 4096 caracteres;
  campos no declarados se rechazan. Errores: 400, 413, 414 y 415 según el caso.
- Salidas explícitas sin `_id`/metadatos Mongoose; HTML con allowlist y URLs
  limitadas a HTTP(S) sin credenciales. Links externos usan `noopener noreferrer`.
- Proveedores: HTTPS, sin redirecciones, timeout de 5 segundos y respuesta de 1 MiB máximo.

## Validación y dependencias

```bash
npm test -- --runInBand
npm run test:e2e -- --runInBand
INTEGRATION_MONGO_URI=mongodb://127.0.0.1:27017/foodly_notes_test npm run test:integration
npm run build
npm run generate:postman
npm audit --omit=dev
```

Las pruebas de integración crean y eliminan únicamente sus colecciones temporales;
usar una base local o aislada, nunca producción. CI usa MongoDB 8 aislado sin secretos.
Las pruebas usan proveedores simulados y no consumen cuotas reales.
El smoke check sí consume proveedores: usar `SWAGGER_ENABLED=false npm run smoke`
contra un despliegue con documentación deshabilitada.

El escaneo de esta actualización dio cero vulnerabilidades de producción.
Quedan tres alertas altas de desarrollo en `@faker-js/faker` y sus dependientes
Postman: el conversor más reciente sigue usando APIs de Faker 5; forzar Faker 10
rompe esas APIs y `audit fix --force` propone un downgrade. Se mantienen fuera
de la imagen runtime; revisar cuando el proveedor publique una corrección compatible.
CI bloquea vulnerabilidades de producción y Dependabot propone actualizaciones.

Docker compila por etapas, instala sólo dependencias productivas, usa el usuario
`node` y no copia `.env`, tests ni herramientas de desarrollo al runtime.
