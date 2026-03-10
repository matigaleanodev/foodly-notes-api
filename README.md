<p align="center">
  <img src="docs/assets/floodly_notes_icon_green.png" alt="Foodly Notes" width="200" />
</p>

# Foodly Notes – API

🌐 English version: [README.en.md](./README.en.md)

**Foodly Notes** es una aplicación orientada a la búsqueda, guardado y organización de recetas de cocina, con soporte para **listas de compras**, **favoritos** y **traducción automática** de contenido.

Este repositorio contiene la **API backend**, responsable de:

- Obtener recetas desde fuentes externas
- Persistir información normalizada
- Traducir contenido al español bajo demanda
- Exponer endpoints optimizados para consumo mobile

El frontend y el backend forman parte de una **misma aplicación**, diseñada con criterios de producto real y pensada para producción.

---

## 🧩 Arquitectura general

- **Frontend**: Ionic + Angular
- **Backend**: NestJS + MongoDB
- **APIs externas**:
  - Spoonacular (recetas)
  - Azure Cognitive Translator (traducciones)
- **Documentación**: Swagger UI

---

## 🛠️ Stack tecnológico

![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?logo=swagger&logoColor=black)
![Spoonacular](https://img.shields.io/badge/Spoonacular-API-blue)
![Azure Translator](https://img.shields.io/badge/Azure-Cognitive%20Translator-0078D4)

---

## 🌍 Internacionalización

- Idioma base: **inglés**
- Idioma soportado: **español**
- La traducción:
  - Se realiza **on-demand**
  - Se **persiste en base de datos**
  - Evita llamadas repetidas a servicios externos

---

## 🎯 Límites funcionales

Esta API se mantiene enfocada en un alcance acotado:

- Búsqueda, detalle, recetas diarias, similares e ingredientes agregados
- Traducción de contenido y consultas cuando aporta valor al flujo
- Cache y persistencia para reducir llamadas redundantes a Spoonacular y Azure
- Encapsulamiento total de proveedores externos detrás del backend

Queda fuera de alcance por ahora:

- Favoritos, shopping list e historial sincronizados en backend
- Perfiles, autenticación de usuario o estado cross-device
- Comentarios, ratings, recetas propias o features sociales
- Planificación de comidas u otros módulos de producto no ligados al retrieval de recetas

---

## 📦 Endpoints principales

> La documentación completa y actualizada está disponible en **Swagger**.

### 🔹 Recetas del día

`GET /api/recipes/daily`

Devuelve un listado de recetas diarias con sus ingredientes.  
El resultado se **cachea por día** para reducir llamadas externas.

Parámetros:

- `lang` (opcional): `en | es`

### 🔹 Detalle de receta

`GET /api/recipes/:id`

Devuelve el detalle completo de una receta:

- Información general
- Instrucciones estructuradas
- Ingredientes
- Metadatos nutricionales básicos

Si se solicita en español:

- La receta se traduce
- Se guarda en base de datos
- Se reutiliza en futuras consultas

Parámetros:

- `lang` (opcional): `en | es`

### 🔹 Recetas similares

`GET /api/recipes/:id/similar`

Devuelve recetas relacionadas a una receta dada.

Parámetros:

- `lang` (opcional): `en | es`

### 🔹 Ingredientes por recetas

`POST /api/recipes/ingredients`

Pensado para **listas de compras**.

Recibe múltiples recetas y devuelve únicamente:

- `sourceId`
- `title`
- `ingredients`

Soporta traducción y persistencia automática.

Body:

```json
{
  "sourceIds": [636598, 123456],
  "lang": "es"
}
```

---

## 🧑‍💻 Desarrollo

Para instrucciones de configuración y desarrollo, consulta:

👉 [DEVELOPMENT.md](./DEVELOPMENT.md)

Para límites funcionales y dependencias externas, consulta:

👉 [docs/backend-scope.es.md](./docs/backend-scope.es.md)

Swagger UI: `GET /docs`

OpenAPI JSON: `GET /openapi.json`
