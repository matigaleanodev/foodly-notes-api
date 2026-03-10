import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { HealthController } from '../src/health/health.controller';
import { RecipesController } from '../src/recipes/recipes.controller';
import { RecipesService } from '../src/recipes/recipes.service';

describe('Recipes (e2e)', () => {
  let app: INestApplication;

  const recipesServiceMock = {
    getDailyRecipes: jest.fn(),
    searchRecipes: jest.fn(),
    getRecipeDetails: jest.fn(),
    getSimilarRecipe: jest.fn(),
    getAllRecipes: jest.fn(),
    getIngredientsForRecipes: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HealthController, RecipesController],
      providers: [
        {
          provide: RecipesService,
          useValue: recipesServiceMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/health devuelve ok', () => {
    const httpServer = app.getHttpServer() as unknown as Parameters<
      typeof request
    >[0];

    return request(httpServer)
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('GET /api/recipes/search normaliza lang y delega al service', async () => {
    recipesServiceMock.searchRecipes.mockResolvedValue([
      { sourceId: 1, title: 'Pasta', image: 'pasta.jpg' },
    ]);
    const httpServer = app.getHttpServer() as unknown as Parameters<
      typeof request
    >[0];

    await request(httpServer)
      .get('/api/recipes/search?q=sopa&lang=ES')
      .expect(200)
      .expect([{ sourceId: 1, title: 'Pasta', image: 'pasta.jpg' }]);

    expect(recipesServiceMock.searchRecipes).toHaveBeenCalledWith('sopa', 'es');
  });

  it('GET /api/recipes/search rechaza query vacia', async () => {
    const httpServer = app.getHttpServer() as unknown as Parameters<
      typeof request
    >[0];

    await request(httpServer).get('/api/recipes/search?q=   ').expect(400);
    expect(recipesServiceMock.searchRecipes).not.toHaveBeenCalled();
  });

  it('GET /api/recipes/10/similar propaga lang al service', async () => {
    recipesServiceMock.getSimilarRecipe.mockResolvedValue([
      { sourceId: 2, title: 'Receta similar', image: 'img.jpg' },
    ]);
    const httpServer = app.getHttpServer() as unknown as Parameters<
      typeof request
    >[0];

    await request(httpServer)
      .get('/api/recipes/10/similar?lang=es')
      .expect(200)
      .expect([{ sourceId: 2, title: 'Receta similar', image: 'img.jpg' }]);

    expect(recipesServiceMock.getSimilarRecipe).toHaveBeenCalledWith(10, 'es');
  });

  it('POST /api/recipes/ingredients valida ids duplicados', async () => {
    const httpServer = app.getHttpServer() as unknown as Parameters<
      typeof request
    >[0];

    await request(httpServer)
      .post('/api/recipes/ingredients')
      .send({ sourceIds: [1, 1], lang: 'es' })
      .expect(400);

    expect(recipesServiceMock.getIngredientsForRecipes).not.toHaveBeenCalled();
  });
});
