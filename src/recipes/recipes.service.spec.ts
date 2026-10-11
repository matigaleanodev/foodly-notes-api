import { Test, TestingModule } from '@nestjs/testing';
import { model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { RecipesService } from './recipes.service';
import { DailyRecipe, DailyRecipeSchema } from './schemas/daily-recipe.schema';
import { Recipe } from './schemas/recipe.schema';
import { TranslationEntry } from './schemas/translation-entry.schema';
import { SpoonacularService } from './spoonacular/spoonacular.service';
import { TranslationService } from './translation/translation.service';

describe('RecipesService', () => {
  let service: RecipesService;

  const dailyRecipeModelMock = {
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  const recipeModelMock = {
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    find: jest.fn(),
  };

  const spoonacularServiceMock = {
    getDailyRecipes: jest.fn(),
    getRecipeById: jest.fn(),
    getSimilarRecipes: jest.fn(),
    searchRecipes: jest.fn(),
  };

  const translationServiceMock = {
    translateRecipeToSpanish: jest.fn(),
    translateSearchQueryToEnglish: jest.fn(),
    translateTexts: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipesService,
        {
          provide: getModelToken(DailyRecipe.name),
          useValue: dailyRecipeModelMock,
        },
        {
          provide: getModelToken(Recipe.name),
          useValue: recipeModelMock,
        },
        {
          provide: getModelToken(TranslationEntry.name),
          useValue: {},
        },
        {
          provide: SpoonacularService,
          useValue: spoonacularServiceMock,
        },
        {
          provide: TranslationService,
          useValue: translationServiceMock,
        },
      ],
    }).compile();

    service = module.get<RecipesService>(RecipesService);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('serializes cached Spanish daily recipes without Mongoose internals', async () => {
    const Daily = model('ServiceDailyRegression', DailyRecipeSchema);
    const doc = new Daily({
      date: '2026-10-11',
      recipes: [{ sourceId: 42, title: 'Soup', image: 'soup.jpg' }],
    });
    dailyRecipeModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(doc),
    });
    translationServiceMock.translateTexts.mockResolvedValue(['Sopa']);
    const result = await service.getDailyRecipes('es');
    expect(result).toEqual([
      { sourceId: 42, title: 'Sopa', image: 'soup.jpg' },
    ]);
    expect(JSON.stringify(result)).not.toMatch(/_id|\$__|_doc/);
  });

  it('getDailyRecipes debería devolver cache si existe', async () => {
    dailyRecipeModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        recipes: [{ sourceId: 1, title: 'cached', image: 'img' }],
      }),
    });

    const result = await service.getDailyRecipes('en');

    expect(result).toEqual([{ sourceId: 1, title: 'cached', image: 'img' }]);
  });

  it('getDailyRecipes debería crear daily si no hay cache', async () => {
    dailyRecipeModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    spoonacularServiceMock.getDailyRecipes.mockResolvedValue([
      {
        id: 1,
        title: 'Recipe',
        image: 'img',
        ingredients: [],
      },
    ]);

    dailyRecipeModelMock.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        recipes: [{ sourceId: 1, title: 'Recipe', image: 'img' }],
      }),
    });

    const result = await service.getDailyRecipes('en');

    expect(dailyRecipeModelMock.findOneAndUpdate).toHaveBeenCalledWith(
      { date: new Date().toISOString().slice(0, 10) },
      {
        $setOnInsert: {
          date: new Date().toISOString().slice(0, 10),
          recipes: [{ sourceId: 1, title: 'Recipe', image: 'img' }],
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
    expect(result.length).toBe(1);
  });

  it('getDailyRecipes debería traducir titulos al español usando cache de traducciones', async () => {
    dailyRecipeModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        recipes: [
          {
            sourceId: 1,
            title: 'Chicken Soup',
            image: 'img',
          },
        ],
      }),
    });
    translationServiceMock.translateTexts = jest
      .fn()
      .mockResolvedValue(['Sopa de pollo']);

    const result = await service.getDailyRecipes('es');

    expect(translationServiceMock.translateTexts).toHaveBeenCalledWith(
      ['Chicken Soup'],
      'es',
    );
    expect(result).toEqual([
      {
        sourceId: 1,
        title: 'Sopa de pollo',
        image: 'img',
      },
    ]);
  });

  it('getDailyRecipes debería volver a ingles si falla la traducción de títulos', async () => {
    dailyRecipeModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        recipes: [
          {
            sourceId: 1,
            title: 'Chicken Soup',
            image: 'img',
          },
        ],
      }),
    });
    translationServiceMock.translateTexts.mockRejectedValue(
      new Error('azure down'),
    );

    const result = await service.getDailyRecipes('es');

    expect(result).toEqual([
      {
        sourceId: 1,
        title: 'Chicken Soup',
        image: 'img',
      },
    ]);
  });

  it('getRecipeDetails debería devolver receta en inglés', async () => {
    recipeModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        sourceId: 1,
        base: {
          title: 'Title',
          summary: 'Summary',
          instructions: [],
          ingredients: [],
        },
        meta: {},
      }),
    });

    const result = await service.getRecipeDetails(1, 'en');

    expect(result.title).toBe('Title');
    expect(
      translationServiceMock.translateRecipeToSpanish,
    ).not.toHaveBeenCalled();
  });

  it('getRecipeDetails debería traducir y guardar si lang es es', async () => {
    const saveMock = jest.fn();

    recipeModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        sourceId: 1,
        base: {
          title: 'Title',
          summary: 'Summary',
          instructions: [],
          ingredients: [],
        },
        meta: {},
        translations: {},
        save: saveMock,
      }),
    });

    translationServiceMock.translateRecipeToSpanish.mockResolvedValue({
      title: 'Título',
      summary: 'Resumen',
      instructions: [],
      ingredients: [],
      translatedAt: new Date(),
    });

    const result = await service.getRecipeDetails(1, 'es');

    expect(saveMock).toHaveBeenCalled();
    expect(result.title).toBe('Título');
  });

  it('getRecipeDetails debería volver a ingles si falla la traducción', async () => {
    recipeModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        sourceId: 1,
        base: {
          title: 'Title',
          summary: 'Summary',
          instructions: [],
          ingredients: [],
        },
        meta: {},
        translations: {},
        save: jest.fn(),
      }),
    });

    translationServiceMock.translateRecipeToSpanish.mockRejectedValue(
      new Error('azure down'),
    );

    const result = await service.getRecipeDetails(1, 'es');

    expect(result.title).toBe('Title');
    expect(result.lang).toBe('en');
  });

  it('getIngredientsForRecipes debería devolver ingredientes en español', async () => {
    const saveMock = jest.fn();

    recipeModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        sourceId: 1,
        base: {
          title: 'Title',
          ingredients: [],
        },
        translations: {},
        save: saveMock,
      }),
    });

    translationServiceMock.translateRecipeToSpanish.mockResolvedValue({
      title: 'Título',
      ingredients: ['ingredientes'],
      instructions: [],
      summary: '',
      translatedAt: new Date(),
    });

    const result = await service.getIngredientsForRecipes([1], 'es');

    expect(result[0].title).toBe('Título');
  });

  it('getIngredientsForRecipes debería volver a ingles si falla la traducción', async () => {
    recipeModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        sourceId: 1,
        base: {
          title: 'Title',
          ingredients: [{ id: 1, name: 'salt', image: '' }],
        },
        translations: {},
        save: jest.fn(),
      }),
    });

    translationServiceMock.translateRecipeToSpanish.mockRejectedValue(
      new Error('azure down'),
    );

    const result = await service.getIngredientsForRecipes([1], 'es');

    expect(result[0]).toEqual({
      sourceId: 1,
      title: 'Title',
      ingredients: [{ id: 1, name: 'salt', image: '' }],
    });
  });

  it('searchRecipes debería usar la query original en inglés', async () => {
    spoonacularServiceMock.searchRecipes.mockResolvedValue([
      { id: 1, title: 'Pasta', image: 'pasta.jpg' },
    ]);

    const result = await service.searchRecipes('pasta', 'en');

    expect(
      translationServiceMock.translateSearchQueryToEnglish,
    ).not.toHaveBeenCalled();
    expect(spoonacularServiceMock.searchRecipes).toHaveBeenCalledWith('pasta');
    expect(result[0]).toEqual({
      sourceId: 1,
      title: 'Pasta',
      image: 'pasta.jpg',
    });
  });

  it('searchRecipes debería traducir la query en español antes de buscar', async () => {
    translationServiceMock.translateSearchQueryToEnglish.mockResolvedValue(
      'chicken soup',
    );
    spoonacularServiceMock.searchRecipes.mockResolvedValue([
      { id: 2, title: 'Chicken Soup', image: 'soup.jpg' },
    ]);

    await service.searchRecipes('sopa de pollo', 'es');

    expect(
      translationServiceMock.translateSearchQueryToEnglish,
    ).toHaveBeenCalledWith('sopa de pollo');
    expect(spoonacularServiceMock.searchRecipes).toHaveBeenCalledWith(
      'chicken soup',
    );
  });

  it('searchRecipes debería volver a la query original si falla la traducción', async () => {
    translationServiceMock.translateSearchQueryToEnglish.mockRejectedValue(
      new Error('azure down'),
    );
    spoonacularServiceMock.searchRecipes.mockResolvedValue([]);

    await service.searchRecipes('sopa de pollo', 'es');

    expect(spoonacularServiceMock.searchRecipes).toHaveBeenCalledWith(
      'sopa de pollo',
    );
  });

  it('getSimilarRecipe debería devolver títulos originales en inglés', async () => {
    spoonacularServiceMock.getSimilarRecipes.mockResolvedValue([
      { sourceId: 3, title: 'Similar recipe', image: 'img.jpg' },
    ]);

    const result = await service.getSimilarRecipe(1, 'en');

    expect(translationServiceMock.translateTexts).not.toHaveBeenCalled();
    expect(result).toEqual([
      { sourceId: 3, title: 'Similar recipe', image: 'img.jpg' },
    ]);
  });

  it('getSimilarRecipe debería traducir títulos al español con cache', async () => {
    spoonacularServiceMock.getSimilarRecipes.mockResolvedValue([
      { sourceId: 3, title: 'Similar recipe', image: 'img.jpg' },
    ]);
    translationServiceMock.translateTexts.mockResolvedValue(['Receta similar']);

    const result = await service.getSimilarRecipe(1, 'es');

    expect(translationServiceMock.translateTexts).toHaveBeenCalledWith(
      ['Similar recipe'],
      'es',
    );
    expect(result).toEqual([
      { sourceId: 3, title: 'Receta similar', image: 'img.jpg' },
    ]);
  });

  it('getSimilarRecipe debería volver a ingles si falla la traducción de títulos', async () => {
    spoonacularServiceMock.getSimilarRecipes.mockResolvedValue([
      { sourceId: 3, title: 'Similar recipe', image: 'img.jpg' },
    ]);
    translationServiceMock.translateTexts.mockRejectedValue(
      new Error('azure down'),
    );

    const result = await service.getSimilarRecipe(1, 'es');

    expect(result).toEqual([
      { sourceId: 3, title: 'Similar recipe', image: 'img.jpg' },
    ]);
  });

  it('getAllRecipes debería devolver recetas persistidas resumidas', async () => {
    const query = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        {
          sourceId: 7,
          base: { title: 'Stored title' },
          meta: { image: 'stored.jpg' },
        },
      ]),
    };
    recipeModelMock.find.mockReturnValue(query);

    const result = await service.getAllRecipes({ limit: 20, after: 6 });
    expect(recipeModelMock.find).toHaveBeenCalledWith({ sourceId: { $gt: 6 } });
    expect(query.limit).toHaveBeenCalledWith(20);
    expect(query.select).toHaveBeenCalledWith(
      'sourceId base.title meta.image -_id',
    );

    expect(result).toEqual([
      {
        sourceId: 7,
        title: 'Stored title',
        image: 'stored.jpg',
      },
    ]);
  });
});
