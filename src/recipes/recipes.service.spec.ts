import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RecipesService } from './recipes.service';
import { DailyRecipe } from './schemas/daily-recipe.schema';
import { Recipe } from './schemas/recipe.schema';
import { TranslationEntry } from './schemas/translation-entry.schema';
import { SpoonacularService } from './spoonacular/spoonacular.service';
import { TranslationService } from './translation/translation.service';

describe('RecipesService', () => {
  let service: RecipesService;

  const dailyRecipeModelMock = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const recipeModelMock = {
    findOne: jest.fn(),
    create: jest.fn(),
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

  it('getDailyRecipes debería devolver cache si existe', async () => {
    dailyRecipeModelMock.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        recipes: ['cached'],
      }),
    });

    const result = await service.getDailyRecipes('en');

    expect(result).toEqual(['cached']);
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

    dailyRecipeModelMock.create.mockResolvedValue(undefined);

    const result = await service.getDailyRecipes('en');

    expect(dailyRecipeModelMock.create).toHaveBeenCalled();
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
          ingredients: ['base-ingredients'],
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
      ingredients: ['base-ingredients'],
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
});
