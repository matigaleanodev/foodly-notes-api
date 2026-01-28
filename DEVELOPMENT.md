# Development Guide

This document describes how to run and develop the Foodly Notes API locally.

---

## 🔧 Requirements

- Node.js 22+
- MongoDB (local or remote)
- Spoonacular API key
- Azure Cognitive Translator credentials

---

## 🔐 Environment Variables

Create a `.env` file or configure environment variables with the following values:

```env
PORT=3000

MONGODB_URI=mongodb://localhost:27017/foodly-notes

SPOONACULAR_API_KEY=your_spoonacular_key

AZURE_TRANSLATOR_KEY=your_azure_key
AZURE_TRANSLATOR_REGION=your_azure_region
AZURE_TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com
```

---

## ▶️ Running the API

```bash
npm install
npm run start:dev
```

The API will be available at:

```
http://localhost:3000
```

Swagger documentation:

```
http://localhost:3000/api
```

---

## 🧪 Testing

```bash
npm run test
```

All services, controllers, and integrations are covered with unit tests.

---

## 🌍 Translations Strategy

- Recipes are fetched in English from Spoonacular
- Spanish translations are generated on demand
- Once translated, recipes are persisted
- Future requests reuse stored translations

This avoids unnecessary translation calls and improves performance.

---

## 📌 Notes

- Daily recipes are cached by date
- Old daily records are intentionally kept for future cleanup strategies
- Favorites and shopping lists are handled client-side and synchronized via IDs

---

## 🚀 Production Considerations

- Stateless API
- Cache-friendly design
- External API usage minimized
- Ready for containerization and cloud deployment
