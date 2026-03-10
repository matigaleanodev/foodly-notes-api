# Backend Scope and External Dependencies

## Functional Boundaries

`foodly-notes-api` is intentionally limited to recipe retrieval and translation support.

The backend owns:

- daily recipes retrieval
- recipe search
- recipe details
- similar recipes
- aggregated ingredients for shopping flows
- query and content translation when required by the recipe flow
- persistence and caching used to reduce redundant external provider calls
- response shaping for the frontend

The backend does not own:

- favorites synchronization
- shopping-list synchronization
- user accounts or authentication
- comments, ratings, or social features
- meal planning
- user-generated recipes
- cross-device application state

Those concerns remain frontend-owned or explicitly out of scope until a documented architecture decision changes that boundary.

## External Dependencies

The API currently depends on these external providers:

### Spoonacular

Purpose:

- recipe search
- recipe details
- similar recipes
- daily recipe source data

Current backend responsibility:

- call encapsulation through `SpoonacularService`
- response normalization before exposing data to the client
- controlled error mapping when the provider fails

### Azure Translator

Purpose:

- translate recipe content to Spanish
- translate Spanish search queries to English before provider lookup
- translate cached daily and similar recipe titles when requested in Spanish

Current backend responsibility:

- call encapsulation through translation services
- translation persistence to avoid repeated provider usage
- fallback behavior when translation is unavailable

## Persistence and Caching Strategy

The API uses MongoDB-backed persistence to reduce repeated external work:

- daily recipes are cached by date
- recipe details are persisted after the first provider fetch
- translated recipe content is persisted per recipe
- translated query and summary text is persisted in a translation cache collection

The current rule is simple: every translation produced by the backend should be cached.

## Environment Configuration

Runtime behavior depends on these variables:

- `MONGO_URI`
- `CORS_ORIGIN`
- `SPOONACULAR_API_KEY`
- `SPOONACULAR_BASE_URL`
- `AZURE_TRANSLATOR_KEY`
- `AZURE_TRANSLATOR_REGION`
- `AZURE_TRANSLATOR_ENDPOINT`

`CORS_ORIGIN` should be configured as an allowlist appropriate for web and Capacitor clients.

For setup and operational examples, see [../DEVELOPMENT.md](../DEVELOPMENT.md).
