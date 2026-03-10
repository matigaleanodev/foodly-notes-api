# Development Guide

This document describes how to run and develop the Foodly Notes API locally.

## Requirements

- Node.js 22+
- MongoDB (local or remote)
- Spoonacular API key
- Azure Cognitive Translator credentials

## Environment Variables

Create a `.env` file or configure environment variables with the following values:

```env
PORT=3000

MONGO_URI=mongodb://localhost:27017/foodly-notes

# Web production origin: https://foodlynotes.app
# Capacitor Android origin: http://localhost
# Capacitor iOS origin: capacitor://localhost
# Use a comma-separated allowlist without trailing slashes.
CORS_ORIGIN=https://foodlynotes.app,http://localhost,capacitor://localhost

SPOONACULAR_API_KEY=your_spoonacular_key
SPOONACULAR_BASE_URL=https://api.spoonacular.com

AZURE_TRANSLATOR_KEY=your_azure_key
AZURE_TRANSLATOR_REGION=your_azure_region
AZURE_TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com
```

`AZURE_TRANSLATOR_ENDPOINT` should point to the service root. The API appends `/translate` internally.

For Foodly Notes production, prefer an explicit allowlist in `CORS_ORIGIN` instead of `*`. The current recommended value is `https://foodlynotes.app,http://localhost,capacitor://localhost`.

## Running the API

```bash
npm install
npm run start:dev
```

The API will be available at `http://localhost:3000`.

Swagger documentation will be available at `http://localhost:3000/docs`.

The OpenAPI JSON will be available at `http://localhost:3000/openapi.json`.

## Testing

```bash
npm run test
npm run test:e2e
npm run build
```

## Translation Strategy

- Recipes are fetched in English from Spoonacular.
- Spanish translations are generated on demand.
- Once translated, recipes are persisted.
- Future requests reuse stored translations.

This avoids unnecessary translation calls and improves performance.

## Notes

- Daily recipes are cached by date.
- Old daily records are intentionally kept for future cleanup strategies.
- Favorites and shopping lists are handled client-side and synchronized via IDs.

## Production Considerations

- The API stays stateless.
- Provider calls are minimized through persistence and daily caching.
- `CORS_ORIGIN` should be restricted per environment outside local development when open access is not required.
- The app is ready for containerization and cloud deployment.

For environment strategy and smoke checks, see [docs/operations.md](./docs/operations.md).
