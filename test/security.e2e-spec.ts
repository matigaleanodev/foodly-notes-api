import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { configureApplication } from '../src/config/application.config';
import { HealthController } from '../src/health/health.controller';
import { RecipesController } from '../src/recipes/recipes.controller';
import { RecipesService } from '../src/recipes/recipes.service';
import { SecurityCounter } from '../src/security/security-counter.schema';
import { SecurityModule } from '../src/security/security.module';

describe('HTTP security', () => {
  let app: NestExpressApplication;
  const counts = new Map<string, number>();
  const recipes = {
    getAllRecipes: jest.fn().mockResolvedValue([]),
    getIngredientsForRecipes: jest.fn().mockResolvedValue([]),
  };
  const previousRouteLimit = process.env.RATE_LIMIT_PER_ROUTE;
  const previousGlobalLimit = process.env.RATE_LIMIT_GLOBAL;

  async function createApp(env: NodeJS.ProcessEnv = {}) {
    const module = await Test.createTestingModule({
      imports: [SecurityModule],
      controllers: [HealthController, RecipesController],
      providers: [{ provide: RecipesService, useValue: recipes }],
    })
      .overrideProvider(getModelToken(SecurityCounter.name))
      .useValue({
        findOneAndUpdate: ({ _id }: { _id: string }) => ({
          exec: () => {
            const count = (counts.get(_id) ?? 0) + 1;
            counts.set(_id, count);
            return Promise.resolve({ count });
          },
        }),
      })
      .compile();
    app = module.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
    configureApplication(app, {
      NODE_ENV: 'test',
      CORS_ORIGIN: 'https://foodlynotes.app',
      SWAGGER_ENABLED: 'false',
      ...env,
    });
    await app.init();
    return app.getHttpServer() as Parameters<typeof request>[0];
  }

  beforeEach(() => {
    counts.clear();
    jest.clearAllMocks();
    process.env.RATE_LIMIT_PER_ROUTE = '2';
    process.env.RATE_LIMIT_GLOBAL = '3';
  });
  afterEach(async () => {
    await app?.close();
  });
  afterAll(() => {
    if (previousRouteLimit === undefined)
      delete process.env.RATE_LIMIT_PER_ROUTE;
    else process.env.RATE_LIMIT_PER_ROUTE = previousRouteLimit;
    if (previousGlobalLimit === undefined) delete process.env.RATE_LIMIT_GLOBAL;
    else process.env.RATE_LIMIT_GLOBAL = previousGlobalLimit;
  });

  it('sets headers and keeps production docs disabled', async () => {
    const server = await createApp({
      NODE_ENV: 'production',
      ENFORCE_HTTPS: 'false',
    });
    const response = await request(server).get('/api/health').expect(200);
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['content-security-policy']).toContain(
      "frame-ancestors 'self'",
    );
    expect(response.headers['strict-transport-security']).toContain(
      'max-age=31536000',
    );
    await request(server).get('/docs').expect(404);
    await request(server).get('/openapi.json').expect(404);
  });

  it('limits each route and exposes retry information', async () => {
    const server = await createApp();
    await request(server).get('/api/recipes').expect(200);
    await request(server).get('/api/recipes').expect(200);
    const response = await request(server).get('/api/recipes').expect(429);
    expect(Number(response.headers['retry-after'])).toBeGreaterThan(0);
    expect(recipes.getAllRecipes).toHaveBeenCalledTimes(2);
    await request(server).get('/api/health').expect(200);
  });

  it('shares the global limit across routes', async () => {
    const server = await createApp();
    await request(server).get('/api/recipes').expect(200);
    await request(server)
      .post('/api/recipes/ingredients')
      .send({ sourceIds: [1] })
      .expect(201);
    await request(server).get('/api/recipes/not-a-number').expect(400);
    const response = await request(server)
      .post('/api/recipes/ingredients')
      .send({ sourceIds: [1] })
      .expect(429);
    expect(Number(response.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('does not trust forwarded IP headers from arbitrary clients', async () => {
    const server = await createApp();
    await request(server)
      .get('/api/recipes')
      .set('X-Forwarded-For', '198.51.100.1')
      .expect(200);
    await request(server)
      .get('/api/recipes')
      .set('X-Forwarded-For', '198.51.100.2')
      .expect(200);
    await request(server)
      .get('/api/recipes')
      .set('X-Forwarded-For', '198.51.100.3')
      .expect(429);
  });

  it('rejects non-JSON requests, oversized bodies and malformed JSON', async () => {
    const server = await createApp();
    await request(server)
      .post('/api/recipes/ingredients')
      .type('form')
      .send('sourceIds=1')
      .expect(415);
    await request(server)
      .post('/api/recipes/ingredients')
      .send({ sourceIds: [1], extra: 'a'.repeat(20000) })
      .expect(413);
    await request(server)
      .post('/api/recipes/ingredients')
      .type('json')
      .send('{')
      .expect(400);
    expect(recipes.getIngredientsForRecipes).not.toHaveBeenCalled();
  });

  it('requires HTTPS and accepts metadata only from a trusted proxy', async () => {
    const server = await createApp({
      NODE_ENV: 'production',
      TRUST_PROXY: 'loopback',
    });
    await request(server).get('/api/recipes').expect(400);
    await request(server)
      .get('/api/recipes')
      .set('X-Forwarded-Proto', 'https')
      .expect(200);
    await request(server).get('/api/health').expect(200);
  });

  it('rejects spoofed HTTPS metadata from untrusted addresses', async () => {
    const server = await createApp({
      NODE_ENV: 'production',
      TRUST_PROXY: '192.0.2.10',
    });
    await request(server)
      .get('/api/recipes')
      .set('X-Forwarded-Proto', 'https')
      .expect(400);
  });

  it('keeps Capacitor-compatible CORS without authorizing unknown origins', async () => {
    const server = await createApp({
      CORS_ORIGIN:
        'https://foodlynotes.app,http://localhost,capacitor://localhost',
    });
    const allowed = await request(server)
      .get('/api/health')
      .set('Origin', 'http://localhost')
      .expect(200);
    expect(allowed.headers['access-control-allow-origin']).toBe(
      'http://localhost',
    );
    const blocked = await request(server)
      .get('/api/health')
      .set('Origin', 'https://untrusted.example')
      .expect(200);
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });
});
