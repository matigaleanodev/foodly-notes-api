import {
  mapDailyRecipeSummary,
  mapRecipeDetailResponse,
  mapRecipeIngredientsResponse,
  mapRecipePersistence,
  mapSearchRecipeSummary,
  mapStoredRecipeSummary,
} from './recipes.mapper';
import type { RecipeDocument } from './schemas/recipe.schema';
import type { SpoonacularRecipeDetail } from './spoonacular/spoonacular.types';

describe('recipes mapper', () => {
  const recipeDocument = {
    sourceId: 42,
    base: {
      title: 'Base title',
      summary: 'Base summary',
      instructions: [{ name: '', steps: [{ number: 1, text: 'Base step' }] }],
      ingredients: [
        {
          id: 1,
          name: 'Salt',
          original: '1 tsp salt',
          amount: 1,
          unit: 'tsp',
          image: 'salt.png',
        },
      ],
    },
    meta: {
      image: 'image.jpg',
      readyInMinutes: 30,
      servings: 2,
      vegetarian: true,
      vegan: false,
      glutenFree: true,
      dairyFree: true,
      cookingMinutes: 20,
      preparationMinutes: 10,
      healthScore: 80,
      aggregateLikes: 10,
      sourceName: 'Foodly',
      sourceUrl: 'https://example.com',
    },
    translations: {
      es: {
        title: 'Titulo',
        summary: 'Resumen',
        instructions: [{ name: '', steps: [{ number: 1, text: 'Paso' }] }],
        ingredients: [
          {
            id: 1,
            name: 'Sal',
            original: '1 cdita sal',
            amount: 1,
            unit: 'tsp',
            image: 'salt.png',
          },
        ],
        translatedAt: new Date(),
      },
    },
  } as unknown as RecipeDocument;

  it('maps daily recipe summaries', () => {
    expect(
      mapDailyRecipeSummary({
        id: 1,
        title: 'Daily',
        image: 'daily.jpg',
      }),
    ).toEqual({
      sourceId: 1,
      title: 'Daily',
      image: 'daily.jpg',
    });
  });

  it('maps search recipe summaries', () => {
    expect(
      mapSearchRecipeSummary({
        id: 2,
        title: 'Search',
        image: null,
      }),
    ).toEqual({
      sourceId: 2,
      title: 'Search',
      image: null,
    });
  });

  it('maps stored recipe summaries', () => {
    expect(mapStoredRecipeSummary(recipeDocument)).toEqual({
      sourceId: 42,
      title: 'Base title',
      image: 'image.jpg',
    });
  });

  it('maps provider recipe details for persistence', () => {
    const spoonacularRecipe = {
      id: 42,
      title: 'Base title',
      summary: 'Base summary',
      instructions: '',
      image: 'image.jpg',
      readyInMinutes: 30,
      servings: 2,
      vegetarian: true,
      vegan: false,
      glutenFree: true,
      dairyFree: true,
      sourceName: 'Foodly',
      sourceUrl: 'https://example.com',
      cookingMinutes: 20,
      preparationMinutes: 10,
      healthScore: 80,
      aggregateLikes: 10,
      extendedIngredients: recipeDocument.base.ingredients,
      analyzedInstructions: recipeDocument.base.instructions.map((block) => ({
        name: block.name,
        steps: block.steps.map((step) => ({
          number: step.number,
          step: step.text,
        })),
      })),
    } as SpoonacularRecipeDetail;

    expect(mapRecipePersistence(42, spoonacularRecipe)).toMatchObject({
      sourceId: 42,
      base: {
        title: 'Base title',
      },
      meta: {
        image: 'image.jpg',
      },
    });
  });

  it('maps translated recipe detail responses when available', () => {
    const result = mapRecipeDetailResponse(recipeDocument, 'es');

    expect(result.title).toBe('Titulo');
    expect(result.lang).toBe('es');
  });

  it('falls back to base recipe detail responses', () => {
    const result = mapRecipeDetailResponse(recipeDocument, 'en');

    expect(result.title).toBe('Base title');
    expect(result.lang).toBe('en');
  });

  it('maps translated ingredient responses when available', () => {
    expect(mapRecipeIngredientsResponse(recipeDocument, 'es')).toEqual({
      sourceId: 42,
      title: 'Titulo',
      ingredients: recipeDocument.translations.es.ingredients,
    });
  });
});
