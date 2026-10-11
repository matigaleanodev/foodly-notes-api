const { readFileSync, writeFileSync } = require('node:fs');
const { STATUS_CODES } = require('node:http');

function buildCollection(document) {
  const item = [];
  for (const [path, operations] of Object.entries(document.paths)) {
    for (const [method, operation] of Object.entries(operations)) {
      if (
        !['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(
          method,
        )
      )
        continue;
      const parameters = [
        ...(operations.parameters ?? []),
        ...(operation.parameters ?? []),
      ];
      const query = [];
      const variable = [];
      for (const parameter of parameters) {
        const schema = parameter.schema ?? {};
        const value =
          parameter.example ??
          schema.example ??
          schema.default ??
          schema.enum?.[0];
        if (parameter.required && value === undefined) {
          throw new Error(
            `Missing explicit example: ${method} ${path} (${parameter.name}).`,
          );
        }
        const entry = {
          key: parameter.name,
          value: String(value ?? ''),
          description: parameter.description,
        };
        if (parameter.in === 'path') variable.push(entry);
        else if (parameter.in === 'query')
          query.push({ ...entry, disabled: value === undefined });
        else
          throw new Error(`Unsupported parameter location: ${parameter.in}.`);
      }
      const route = path.replace(/\{([^}]+)\}/g, ':$1');
      const search = new URLSearchParams(
        query.filter((q) => !q.disabled).map((q) => [q.key, q.value]),
      ).toString();
      const request = {
        method: method.toUpperCase(),
        header: [{ key: 'Accept', value: 'application/json' }],
        url: {
          raw: `{{baseUrl}}${route}${search ? `?${search}` : ''}`,
          host: ['{{baseUrl}}'],
          path: route.split('/').filter(Boolean),
          query,
          variable,
        },
      };
      if (operation.requestBody) {
        const content = operation.requestBody.content?.['application/json'];
        const example =
          content?.example ?? Object.values(content?.examples ?? {})[0]?.value;
        if (example === undefined)
          throw new Error(`Missing JSON body example: ${method} ${path}.`);
        request.header.push({ key: 'Content-Type', value: 'application/json' });
        request.body = {
          mode: 'raw',
          raw: JSON.stringify(example, null, 2),
          options: { raw: { language: 'json' } },
        };
      }
      const response = [];
      for (const [status, definition] of Object.entries(
        operation.responses ?? {},
      )) {
        if (!/^\d{3}$/.test(status)) continue;
        const content = definition.content?.['application/json'];
        const examples =
          content?.example !== undefined
            ? [content.example]
            : Object.values(content?.examples ?? {}).map((e) => e.value);
        for (const example of examples.filter((e) => e !== undefined)) {
          response.push({
            name: definition.description || status,
            originalRequest: request,
            status: STATUS_CODES[status] ?? status,
            code: Number(status),
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: JSON.stringify(example, null, 2),
          });
        }
      }
      item.push({
        name: operation.summary ?? `${method.toUpperCase()} ${path}`,
        request,
        response,
      });
    }
  }
  return {
    info: {
      name: document.info.title,
      version: document.info.version,
      schema:
        'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    variable: [
      { key: 'baseUrl', value: 'http://localhost:3000', type: 'string' },
    ],
    item,
  };
}

if (require.main === module) {
  const document = JSON.parse(readFileSync('openapi.json', 'utf8'));
  writeFileSync(
    'postman-collection.json',
    JSON.stringify(buildCollection(document), null, 2) + '\n',
  );
  console.log('Postman collection generated from explicit OpenAPI examples.');
}

module.exports = { buildCollection };
