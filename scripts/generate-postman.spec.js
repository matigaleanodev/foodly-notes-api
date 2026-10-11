const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { buildCollection } = require('./generate-postman');

test('exports every API route with examples matching the OpenAPI contract', () => {
  const document = JSON.parse(readFileSync('openapi.json', 'utf8'));
  const collection = buildCollection(document);
  const expected = Object.entries(document.paths).flatMap(
    ([path, operations]) =>
      Object.keys(operations)
        .filter((method) => ['get', 'post'].includes(method))
        .map(
          (method) =>
            `${method.toUpperCase()} ${path.replace(/\{([^}]+)\}/g, ':$1')}`,
        ),
  );
  assert.equal(collection.info.version, document.info.version);
  assert.deepEqual(
    collection.item.map(
      ({ request }) => `${request.method} /${request.url.path.join('/')}`,
    ),
    expected,
  );
  const detail = collection.item.find(({ request }) =>
    request.url.raw.includes('/recipes/:id?'),
  );
  assert.equal(
    detail.request.url.variable.find((v) => v.key === 'id').value,
    '636598',
  );
  const search = collection.item.find(({ request }) =>
    request.url.raw.includes('/recipes/search?'),
  );
  assert.match(search.request.url.raw, /q=pasta/);
  const list = collection.item.find(
    ({ request }) => request.url.path.join('/') === 'api/recipes',
  );
  assert.equal(
    list.request.url.query.find((q) => q.key === 'after').disabled,
    true,
  );
  assert.match(list.request.url.raw, /limit=50/);
  const ingredients = collection.item.find(
    ({ request }) => request.method === 'POST',
  );
  assert.deepEqual(JSON.parse(ingredients.request.body.raw), {
    sourceIds: [636598, 123456],
    lang: 'es',
  });
  assert.ok(collection.item.some(({ response }) => response.length > 0));
  for (const { response } of collection.item)
    for (const example of response)
      assert.doesNotThrow(() => JSON.parse(example.body));
});

test('requires documented examples instead of evaluating schema templates', () => {
  const document = {
    info: { title: 'Test', version: '1' },
    paths: {
      '/test': {
        get: {
          parameters: [
            {
              name: 'q',
              in: 'query',
              required: true,
              schema: { type: 'string' },
            },
          ],
        },
      },
    },
  };
  assert.throws(() => buildCollection(document), /Missing explicit example/);
  document.paths['/test'] = {
    post: {
      requestBody: {
        content: { 'application/json': { schema: { type: 'object' } } },
      },
    },
  };
  assert.throws(() => buildCollection(document), /Missing JSON body example/);
});
