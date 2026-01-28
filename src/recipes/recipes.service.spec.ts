import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RecipesService } from './recipes.service';
import { DailyRecipe } from './schemas/daily-recipe.schema';
import { Recipe } from './schemas/recipe.schema';
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
});
