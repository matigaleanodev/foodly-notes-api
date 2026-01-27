export interface SpoonacularRandomResponse {
  recipes: SpoonacularRandomRecipe[];
}

export interface SpoonacularRandomRecipe {
  id: number;
  title: string;
  image: string;
}

export interface SpoonacularRecipeDetail {
  id: number;
  title: string;
  summary: string;
  instructions: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  extendedIngredients: SpoonacularIngredient[];
}

export interface SpoonacularIngredient {
  id: number;
  name: string;
  original: string;
  amount: number;
  unit: string;
  image: string;
}
