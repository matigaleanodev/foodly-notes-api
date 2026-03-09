import { recipeIngredientExample } from './recipe-ingredient.example';
import { recipeInstructionBlockExample } from './recipe-instruction.example';

export const recipeDetailResponseExample = {
  sourceId: 636598,
  title: 'Butternut Squash Souffle',
  summary: '<p>Recipe summary</p>',
  instructions: [recipeInstructionBlockExample],
  ingredients: [recipeIngredientExample],
  image: 'https://img.spoonacular.com/recipes/636598-556x370.jpg',
  readyInMinutes: 45,
  servings: 4,
  vegetarian: true,
  vegan: false,
  glutenFree: true,
  dairyFree: false,
  cookingMinutes: 30,
  preparationMinutes: 15,
  healthScore: 72,
  aggregateLikes: 154,
  sourceName: 'Spoonacular',
  sourceUrl: 'https://spoonacular.com/butternut-squash-souffle-636598',
  lang: 'en' as const,
};
