<p align="center">
  <img src="docs/assets/floodly_notes_icon_green.png" alt="Foodly Notes" width="200" />
</p>

# Foodly Notes API

🌐 Versión en español: [README.md](./README.md)

**Foodly Notes** is an application focused on searching, saving, and organizing cooking recipes, with support for **shopping lists**, **favorites**, and **automatic content translation**.

This repository contains the **backend API**, responsible for:

- Fetching recipes from external sources
- Persisting normalized data
- Translating content to Spanish on demand
- Exposing optimized endpoints for mobile consumption

The frontend and backend are part of the **same application**, designed with real product criteria and built with production in mind.

---

## 🧩 General Architecture

- **Frontend**: Ionic + Angular
- **Backend**: NestJS + MongoDB
- **External APIs**:
  - Spoonacular (recipes)
  - Azure Cognitive Translator (translations)
- **Documentation**: Swagger UI

---

## 📦 Main Technologies

![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?logo=swagger&logoColor=black)
![Spoonacular](https://img.shields.io/badge/Spoonacular-API-blue)
![Azure Translator](https://img.shields.io/badge/Azure-Cognitive%20Translator-0078D4)

---

## 🌍 Internationalization

- Base language: **English**
- Supported language: **Spanish**
- Translation:
  - Is performed **on-demand**
  - Is **persisted in the database**
  - Prevents repeated calls to external services

---

## 📦 Main Endpoints

> Full and up-to-date documentation is available in **Swagger**.

### 🔹 Daily Recipes

`GET /api/recipes/daily`

Returns a list of daily recipes including their ingredients.  
Results are **cached per day** to reduce external API calls.

Parameters:

- `lang` (optional): `en | es`

### 🔹 Recipe Details

`GET /api/recipes/:id`

Returns the full detail of a recipe:

- General information
- Structured instructions
- Ingredients
- Basic nutritional metadata

When requested in Spanish:

- The recipe is translated
- Stored in the database
- Reused in future requests

Parameters:

- `lang` (optional): `en | es`

### 🔹 Similar Recipes

`GET /api/recipes/:id/similar`

Returns recipes related to the given recipe.

### 🔹 Ingredients by Recipes

`POST /api/recipes/ingredients`

Designed for **shopping lists**.

Accepts multiple recipes and returns only:

- `sourceId`
- `title`
- `ingredients`

Supports automatic translation and persistence.

Body:

```json
{
  "sourceIds": [636598, 123456],
  "lang": "es"
}
```

---

## 🧑‍💻 Development

For local setup, environment variables, and development guidelines:

👉 [DEVELOPMENT.md](./DEVELOPMENT.md)

Swagger UI: `GET /docs`

OpenAPI JSON: `GET /openapi.json`
