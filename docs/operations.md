# Operations and Smoke Checks

## Environment Strategy

The backend keeps a single code path and varies runtime behavior through environment variables.

Recommended environment split:

- local development: local MongoDB or a dedicated remote database, explicit `CORS_ORIGIN`, provider keys with low-risk credentials
- CI: isolated test configuration, deterministic validation commands, no production secrets
- production: managed MongoDB, production provider credentials, explicit CORS allowlist, and deployment-specific secret management

The backend should avoid environment-specific forks in source code. Environment changes should be expressed through configuration, not through alternate modules or feature duplication.

## Required Runtime Variables

- `PORT`
- `MONGO_URI`
- `CORS_ORIGIN`
- `SPOONACULAR_API_KEY`
- `SPOONACULAR_BASE_URL`
- `AZURE_TRANSLATOR_KEY`
- `AZURE_TRANSLATOR_REGION`
- `AZURE_TRANSLATOR_ENDPOINT`

## Minimum Smoke Checks

These checks are meant to answer a narrow operational question: can the deployed API still reach its critical dependencies and return expected responses?

### API baseline

- `GET /api/health` returns `200`
- `GET /openapi.json` returns `200`

### MongoDB

Goal:

- confirm the API can read persisted state

Suggested smoke check:

- call `GET /api/recipes` and verify the API responds without connection errors

Expected signal:

- no Mongoose connection failure
- no timeout caused by unavailable database access

### Spoonacular

Goal:

- confirm provider connectivity and controlled error handling

Suggested smoke check:

- call `GET /api/recipes/search?q=pasta`

Expected signal:

- `200` with recipe results, or a controlled backend error contract if the provider is unavailable

### Azure Translator

Goal:

- confirm translation flow still works and cache fallback remains safe

Suggested smoke checks:

- call `GET /api/recipes/search?q=sopa&lang=es`
- call `GET /api/recipes/daily?lang=es`

Expected signal:

- translated or cached Spanish-facing responses when translation succeeds
- safe fallback to non-translated content if translation is temporarily unavailable

## Validation Commands

Repository-level validation should keep using:

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

These commands validate code quality and contract stability, but they do not replace runtime smoke checks against deployed infrastructure.

## Smoke Script

The repository includes a runnable smoke command:

```bash
API_BASE_URL=https://api.foodlynotes.app npm run smoke
```

Default base URL:

- `http://localhost:3000`

Checks covered by the script:

- `GET /api/health`
- `GET /openapi.json`
- `GET /api/recipes`
- `GET /api/recipes/search?q=pasta`
- `GET /api/recipes/search?q=sopa&lang=es`
- `GET /api/recipes/daily?lang=es`
