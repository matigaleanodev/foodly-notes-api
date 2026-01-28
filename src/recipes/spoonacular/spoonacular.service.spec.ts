import { Test, TestingModule } from '@nestjs/testing';
import { SpoonacularService } from './spoonacular.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';

describe('SpoonacularService', () => {
  let service: SpoonacularService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpoonacularService,
        {
          provide: HttpService,
          useValue: {
            axiosRef: {
              get: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('fake-api-key'),
          },
        },
      ],
    }).compile();

    service = module.get<SpoonacularService>(SpoonacularService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería devolver recetas diarias con imagen e ingredientes', async () => {
    jest.spyOn(httpService.axiosRef, 'get').mockResolvedValueOnce({
      data: {
        results: [
          {
            id: 1,
            title: 'Recipe 1',
            imageType: 'jpg',
            extendedIngredients: [
              {
                id: 10,
                name: 'Salt',
                original: 'Salt',
                amount: 1,
                unit: 'tsp',
                image: 'salt.jpg',
              },
            ],
          },
        ],
      },
    });

    const result = await service.getDailyRecipes(1);

    expect(result).toEqual([
      {
        id: 1,
        title: 'Recipe 1',
        image: 'https://img.spoonacular.com/recipes/1-556x370.jpg',
        ingredients: [
          {
            id: 10,
            name: 'Salt',
            original: 'Salt',
            amount: 1,
            unit: 'tsp',
            image: 'salt.jpg',
          },
        ],
      },
    ]);
  });

  it('debería devolver recetas similares con imagen armada', async () => {
    jest.spyOn(httpService.axiosRef, 'get').mockResolvedValueOnce({
      data: [
        {
          id: 2,
          title: 'Similar recipe',
          imageType: 'png',
        },
      ],
    });

    const result = await service.getSimilarRecipes(1);

    expect(result).toEqual([
      {
        id: 2,
        title: 'Similar recipe',
        image: 'https://img.spoonacular.com/recipes/2-556x370.png',
      },
    ]);
  });

  it('debería buscar recetas y devolver ingredientes vacíos si no existen', async () => {
    jest.spyOn(httpService.axiosRef, 'get').mockResolvedValueOnce({
      data: {
        results: [
          {
            id: 3,
            title: 'Search recipe',
            imageType: 'jpg',
          },
        ],
      },
    });

    const result = await service.searchRecipes('pasta');

    expect(result).toEqual([
      {
        id: 3,
        title: 'Search recipe',
        image: 'https://img.spoonacular.com/recipes/3-556x370.jpg',
        extendedIngredients: [],
      },
    ]);
  });

  it('debería lanzar NotFoundException si la receta no existe', async () => {
    jest.spyOn(httpService.axiosRef, 'get').mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 404 },
    });

    await expect(service.getRecipeById(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
