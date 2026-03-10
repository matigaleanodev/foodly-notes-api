const { URL } = require('node:url');

const DEFAULT_API_BASE_URL = 'http://localhost:3000';

function buildUrl(baseUrl, path) {
  return new URL(path, `${baseUrl.replace(/\/+$/, '')}/`).toString();
}

async function requestJson(baseUrl, path) {
  const response = await fetch(buildUrl(baseUrl, path));
  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runSmokeChecks() {
  const baseUrl = process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL;

  console.log(`Running smoke checks against ${baseUrl}`);

  const health = await requestJson(baseUrl, '/api/health');
  assertCondition(health.status === 200, 'Health check failed.');
  assertCondition(health.body?.status === 'ok', 'Health payload is invalid.');
  console.log('OK  /api/health');

  const openApi = await requestJson(baseUrl, '/openapi.json');
  assertCondition(openApi.status === 200, 'OpenAPI endpoint failed.');
  console.log('OK  /openapi.json');

  const storedRecipes = await requestJson(baseUrl, '/api/recipes');
  assertCondition(storedRecipes.status === 200, 'Stored recipes smoke check failed.');
  console.log('OK  /api/recipes');

  const search = await requestJson(baseUrl, '/api/recipes/search?q=pasta');
  assertCondition(search.status === 200, 'Spoonacular smoke check failed.');
  assertCondition(Array.isArray(search.body), 'Search response must be an array.');
  console.log('OK  /api/recipes/search?q=pasta');

  const translatedSearch = await requestJson(
    baseUrl,
    '/api/recipes/search?q=sopa&lang=es',
  );
  assertCondition(
    translatedSearch.status === 200,
    'Translated search smoke check failed.',
  );
  assertCondition(
    Array.isArray(translatedSearch.body),
    'Translated search response must be an array.',
  );
  console.log('OK  /api/recipes/search?q=sopa&lang=es');

  const translatedDaily = await requestJson(baseUrl, '/api/recipes/daily?lang=es');
  assertCondition(
    translatedDaily.status === 200,
    'Translated daily smoke check failed.',
  );
  assertCondition(
    Array.isArray(translatedDaily.body),
    'Translated daily response must be an array.',
  );
  console.log('OK  /api/recipes/daily?lang=es');
}

runSmokeChecks()
  .then(() => {
    console.log('Smoke checks passed.');
  })
  .catch((error) => {
    console.error('Smoke checks failed.');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
