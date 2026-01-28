import { Test, TestingModule } from '@nestjs/testing';
import { RecipesService } from './recipes.service';
import { getModelToken } from '@nestjs/mongoose';
import { DailyRecipe } from './schemas/daily-recipe.schema';
import { Recipe } from './schemas/recipe.schema';
import { SpoonacularService } from './spoonacular/spoonacular.service';
import { TranslationService } from './translation/translation.service';

describe('RecipesService', () => {
  let service: RecipesService;

  const dailyRecipeModel = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const recipeModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
  };

  const spoonacularService = {
    getDailyRecipes: jest.fn(),
    getRecipeById: jest.fn(),
    getSimilarRecipes: jest.fn(),
    searchRecipes: jest.fn(),
  };

  const translationService = {
    translateRecipeToSpanish: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipesService,
        {
          provide: getModelToken(DailyRecipe.name),
          useValue: dailyRecipeModel,
        },
        {
          provide: getModelToken(Recipe.name),
          useValue: recipeModel,
        },
        {
          provide: SpoonacularService,
          useValue: spoonacularService,
        },
        {
          provide: TranslationService,
          useValue: translationService,
        },
      ],
    }).compile();

    service = module.get(RecipesService);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('getDailyRecipes debería devolver cache si existe', async () => {
    dailyRecipeModel.findOne.mockResolvedValue({
      recipes: [{ sourceId: 1, title: 'Cached', image: 'img' }],
    });

    const result = await service.getDailyRecipes('en');

    expect(dailyRecipeModel.findOne).toHaveBeenCalled();
    expect(spoonacularService.getDailyRecipes).not.toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  it('getDailyRecipes debería crear daily si no hay cache', async () => {
    dailyRecipeModel.findOne.mockResolvedValue(null);

    spoonacularService.getDailyRecipes.mockResolvedValue([
      {
        id: 1,
        title: 'Recipe',
        image: 'img',
        ingredients: [],
      },
    ]);

    const result = await service.getDailyRecipes('en');

    expect(spoonacularService.getDailyRecipes).toHaveBeenCalled();
    expect(dailyRecipeModel.create).toHaveBeenCalled();
    expect(result[0].sourceId).toBe(1);
  });

  it('getRecipeDetails debería devolver receta en inglés', async () => {
    const recipeDoc: any = {
      sourceId: 1,
      base: {
        title: 'Title',
        summary: 'Summary',
        instructions: [],
        ingredients: [],
      },
      meta: {},
    };

    recipeModel.findOne.mockResolvedValue(recipeDoc);

    const result = await service.getRecipeDetails(1, 'en');

    expect(result.lang).toBe('en');
    expect(result.title).toBe('Title');
  });

  it('getRecipeDetails debería traducir y guardar si lang es es', async () => {
    interface RecipeDocWithSave {
      sourceId: number;
      base: {
        title: string;
        summary: string;
        instructions: any[];
        ingredients: any[];
      };
      meta: object;
      translations: object;
      save: jest.Mock;
    }

    const recipeDoc: RecipeDocWithSave = {
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
    };

    recipeModel.findOne.mockResolvedValue(recipeDoc);

    translationService.translateRecipeToSpanish.mockResolvedValue({
      title: 'Título',
      summary: 'Resumen',
      instructions: [],
      ingredients: [],
    });

    const result = await service.getRecipeDetails(1, 'es');

    expect(translationService.translateRecipeToSpanish).toHaveBeenCalled();
    expect(recipeDoc.save).toHaveBeenCalled();
    expect(result.title).toBe('Título');
  });

  it('getIngredientsForRecipes debería devolver ingredientes en español', async () => {
    const recipeDoc: any = {
      sourceId: 1,
      base: { title: 'Title', ingredients: [] },
      translations: {
        es: {
          title: 'Título',
          ingredients: ['ing'],
        },
      },
    };

    recipeModel.findOne.mockResolvedValue(recipeDoc);

    const result = await service.getIngredientsForRecipes([1], 'es');

    expect(result[0].title).toBe('Título');
  });
});
