import { Test, TestingModule } from '@nestjs/testing';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';

describe('RecipesController', () => {
  let controller: RecipesController;

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

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecipesController],
      providers: [
        {
          provide: RecipesService,
          useValue: recipesServiceMock,
        },
      ],
    }).compile();

    controller = module.get<RecipesController>(RecipesController);
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('getDailyRecipes debería usar lang en por defecto', async () => {
    recipesServiceMock.getDailyRecipes.mockResolvedValue(['daily']);

    const result = await controller.getDailyRecipes({});

    expect(recipesServiceMock.getDailyRecipes).toHaveBeenCalledWith('en');
    expect(result).toEqual(['daily']);
  });

  it('getDailyRecipes debería aceptar lang es', async () => {
    recipesServiceMock.getDailyRecipes.mockResolvedValue(['daily-es']);

    const result = await controller.getDailyRecipes({ lang: 'es' });

    expect(recipesServiceMock.getDailyRecipes).toHaveBeenCalledWith('es');
    expect(result).toEqual(['daily-es']);
  });

  it('getRecipeDetails debería llamar al service con id y lang en', async () => {
    recipesServiceMock.getRecipeDetails.mockResolvedValue({ id: 1 });

    const result = await controller.getRecipeDetails({ id: 1 }, {});

    expect(recipesServiceMock.getRecipeDetails).toHaveBeenCalledWith(1, 'en');
    expect(result).toEqual({ id: 1 });
  });

  it('getRecipeDetails debería aceptar lang es', async () => {
    recipesServiceMock.getRecipeDetails.mockResolvedValue({ id: 1 });

    await controller.getRecipeDetails({ id: 1 }, { lang: 'es' });

    expect(recipesServiceMock.getRecipeDetails).toHaveBeenCalledWith(1, 'es');
  });

  it('searchRecipes debería usar lang en por defecto', async () => {
    recipesServiceMock.searchRecipes.mockResolvedValue(['search']);

    const result = await controller.searchRecipes({ q: 'pasta' });

    expect(recipesServiceMock.searchRecipes).toHaveBeenCalledWith(
      'pasta',
      'en',
    );
    expect(result).toEqual(['search']);
  });

  it('searchRecipes debería aceptar lang es', async () => {
    recipesServiceMock.searchRecipes.mockResolvedValue(['search-es']);

    await controller.searchRecipes({ q: 'pastas', lang: 'es' });

    expect(recipesServiceMock.searchRecipes).toHaveBeenCalledWith(
      'pastas',
      'es',
    );
  });

  it('getSimilarRecipes debería llamar al service', async () => {
    recipesServiceMock.getSimilarRecipe.mockResolvedValue(['similar']);

    const result = await controller.getSimilarRecipes({ id: 10 }, {});

    expect(recipesServiceMock.getSimilarRecipe).toHaveBeenCalledWith(10, 'en');
    expect(result).toEqual(['similar']);
  });

  it('getSimilarRecipes debería aceptar lang es', async () => {
    recipesServiceMock.getSimilarRecipe.mockResolvedValue(['similar-es']);

    await controller.getSimilarRecipes({ id: 10 }, { lang: 'es' });

    expect(recipesServiceMock.getSimilarRecipe).toHaveBeenCalledWith(10, 'es');
  });

  it('getIngredients debería usar lang en por defecto', async () => {
    recipesServiceMock.getIngredientsForRecipes.mockResolvedValue(['ings']);

    const result = await controller.getIngredients({
      sourceIds: [1, 2],
    });

    expect(recipesServiceMock.getIngredientsForRecipes).toHaveBeenCalledWith(
      [1, 2],
      'en',
    );
    expect(result).toEqual(['ings']);
  });

  it('getIngredients debería aceptar lang es', async () => {
    recipesServiceMock.getIngredientsForRecipes.mockResolvedValue(['ings-es']);

    await controller.getIngredients({
      sourceIds: [1],
      lang: 'es',
    });

    expect(recipesServiceMock.getIngredientsForRecipes).toHaveBeenCalledWith(
      [1],
      'es',
    );
  });
});
