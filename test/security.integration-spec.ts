import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { createConnection, type Connection, type Model } from 'mongoose';
import { randomUUID } from 'node:crypto';
import { Recipe, RecipeSchema } from '../src/recipes/schemas/recipe.schema';
import {
  DailyRecipe,
  DailyRecipeSchema,
} from '../src/recipes/schemas/daily-recipe.schema';
import { RecipesService } from '../src/recipes/recipes.service';
import { SpoonacularService } from '../src/recipes/spoonacular/spoonacular.service';
import { TranslationService } from '../src/recipes/translation/translation.service';
import {
  SecurityCounter,
  SecurityCounterSchema,
} from '../src/security/security-counter.schema';
import { ProviderAccessService } from '../src/security/provider-access.service';
import { MongoThrottleStorage } from '../src/security/mongo-throttle.storage';

describe('Mongo security integration', () => {
  let connection: Connection;
  let recipeModel: Model<Recipe>;
  let dailyModel: Model<DailyRecipe>;
  let counterModel: Model<SecurityCounter>;
  let service: RecipesService;
  const suffix = randomUUID().replaceAll('-', '');
  const collections: string[] = [];
  const provider = { getRecipeById: jest.fn(), getDailyRecipes: jest.fn() };

  beforeAll(async () => {
    if (!process.env.INTEGRATION_MONGO_URI)
      throw new Error(
        'INTEGRATION_MONGO_URI must point to a local or isolated test database.',
      );
    connection = await createConnection(process.env.INTEGRATION_MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    }).asPromise();
    recipeModel = connection.model(
      Recipe.name,
      RecipeSchema.clone(),
      `_test_recipes_${suffix}`,
    );
    dailyModel = connection.model(
      DailyRecipe.name,
      DailyRecipeSchema.clone(),
      `_test_daily_${suffix}`,
    );
    counterModel = connection.model(
      SecurityCounter.name,
      SecurityCounterSchema.clone(),
      `_test_counters_${suffix}`,
    );
    collections.push(
      recipeModel.collection.name,
      dailyModel.collection.name,
      counterModel.collection.name,
    );
    await Promise.all([
      recipeModel.init(),
      dailyModel.init(),
      counterModel.init(),
    ]);
    const module = await Test.createTestingModule({
      providers: [
        RecipesService,
        { provide: getModelToken(Recipe.name), useValue: recipeModel },
        { provide: getModelToken(DailyRecipe.name), useValue: dailyModel },
        { provide: SpoonacularService, useValue: provider },
        {
          provide: TranslationService,
          useValue: {
            translateTexts: () => Promise.resolve(['Sopa']),
            translateRecipeToSpanish: jest.fn(),
          },
        },
      ],
    }).compile();
    service = module.get(RecipesService);
  });

  afterAll(async () => {
    if (connection) {
      for (const name of collections)
        await connection
          .collection(name)
          .drop()
          .catch((error: { code?: number }) => {
            if (error.code !== 26) throw error;
          });
      await connection.close();
    }
  });

  it('deduplicates cache misses and prevents duplicate persisted recipes', async () => {
    provider.getRecipeById.mockResolvedValue({
      id: 42,
      title: 'Soup',
      summary: '<p>Soup</p>',
      analyzedInstructions: [],
      extendedIngredients: [],
    });
    const results = await Promise.all(
      Array.from({ length: 8 }, () => service.getRecipeDetails(42, 'en')),
    );
    expect(results.every((r) => r.sourceId === 42)).toBe(true);
    expect(provider.getRecipeById).toHaveBeenCalledTimes(1);
    expect(await recipeModel.countDocuments({ sourceId: 42 })).toBe(1);
    await expect(
      recipeModel.create({ sourceId: 42, base: {}, meta: {} }),
    ).rejects.toMatchObject({ code: 11000 });
  });

  it('shares the daily cache and returns stable Spanish JSON on cache hits', async () => {
    provider.getDailyRecipes.mockResolvedValue([
      { id: 42, title: 'Soup', image: 'soup.jpg' },
    ]);
    const expected = [{ sourceId: 42, title: 'Sopa', image: 'soup.jpg' }];
    expect(
      await Promise.all([
        service.getDailyRecipes('es'),
        service.getDailyRecipes('es'),
      ]),
    ).toEqual([expected, expected]);
    expect(await service.getDailyRecipes('es')).toEqual(expected);
    expect(provider.getDailyRecipes).toHaveBeenCalledTimes(1);
    expect(await dailyModel.countDocuments()).toBe(1);
  });

  it('shares atomic daily budgets across service instances', async () => {
    const previous = process.env.SPOONACULAR_DAILY_REQUEST_LIMIT;
    process.env.SPOONACULAR_DAILY_REQUEST_LIMIT = '3';
    const services = [
      new ProviderAccessService(counterModel),
      new ProviderAccessService(counterModel),
    ];
    if (previous === undefined)
      delete process.env.SPOONACULAR_DAILY_REQUEST_LIMIT;
    else process.env.SPOONACULAR_DAILY_REQUEST_LIMIT = previous;
    const work = jest.fn().mockResolvedValue('ok');
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, (_, i) =>
        services[i % 2].run('spoonacular', work),
      ),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(3);
    expect(work).toHaveBeenCalledTimes(3);
  });

  it('shares atomic rate counters across storage instances', async () => {
    const stores = [
      new MongoThrottleStorage(counterModel),
      new MongoThrottleStorage(counterModel),
    ];
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        stores[i % 2].increment('shared', 60000, 5),
      ),
    );
    expect(results.filter((r) => !r.isBlocked)).toHaveLength(5);
    expect(results.filter((r) => r.isBlocked)).toHaveLength(15);
    expect(Math.max(...results.map((r) => r.totalHits))).toBe(20);
  });
});
