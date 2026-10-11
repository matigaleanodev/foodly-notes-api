import type { Lang } from '../common/types/lang.type';
import type { RecipeDocument } from './schemas/recipe.schema';
import { safeHttpUrl, safeImage, sanitizeSummary } from './recipe-content';
import type {
  SpoonacularRandomRecipe,
  SpoonacularRecipeDetail,
} from './spoonacular/spoonacular.types';

type RecipeTranslation = RecipeDocument['translations'][string];

export function mapDailyRecipeSummary(recipe: SpoonacularRandomRecipe) {
  return {
    sourceId: recipe.id,
    title: recipe.title,
    image: safeImage(recipe.image),
  };
}

export function mapSearchRecipeSummary(recipe: {
  id: number;
  title: string;
  image: string | null;
}) {
  return {
    sourceId: recipe.id,
    title: recipe.title,
    image: safeImage(recipe.image) ?? null,
  };
}

export function mapStoredRecipeSummary(recipe: RecipeDocument) {
  return {
    sourceId: recipe.sourceId,
    title: recipe.base.title,
    image: safeImage(recipe.meta?.image),
  };
}

export function mapRecipePersistence(
  sourceId: number,
  spoonacularRecipe: SpoonacularRecipeDetail,
) {
  return {
    sourceId,
    base: {
      title: spoonacularRecipe.title,
      summary: sanitizeSummary(spoonacularRecipe.summary),
      instructions: spoonacularRecipe.analyzedInstructions.map((block) => ({
        name: block.name ?? '',
        steps: block.steps.map((step) => ({
          number: step.number,
          text: step.step,
        })),
      })),
      ingredients: spoonacularRecipe.extendedIngredients.map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.name,
        original: ingredient.original,
        amount: ingredient.amount,
        unit: ingredient.unit,
        image: safeImage(ingredient.image),
      })),
    },
    meta: {
      image: safeImage(spoonacularRecipe.image),
      readyInMinutes: spoonacularRecipe.readyInMinutes,
      servings: spoonacularRecipe.servings,
      vegetarian: spoonacularRecipe.vegetarian,
      vegan: spoonacularRecipe.vegan,
      glutenFree: spoonacularRecipe.glutenFree,
      dairyFree: spoonacularRecipe.dairyFree,
      cookingMinutes: spoonacularRecipe.cookingMinutes,
      preparationMinutes: spoonacularRecipe.preparationMinutes,
      healthScore: spoonacularRecipe.healthScore,
      aggregateLikes: spoonacularRecipe.aggregateLikes,
      sourceName: spoonacularRecipe.sourceName,
      sourceUrl: safeHttpUrl(spoonacularRecipe.sourceUrl),
    },
  };
}

export function mapRecipeDetailResponse(recipe: RecipeDocument, lang: Lang) {
  if (lang === 'es' && recipe.translations?.es) {
    return buildRecipeDetailResponse(recipe, 'es', recipe.translations.es);
  }

  return buildRecipeDetailResponse(recipe, 'en');
}

export function mapRecipeIngredientsResponse(
  recipe: RecipeDocument,
  lang: Lang,
) {
  if (lang === 'es' && recipe.translations?.es) {
    return {
      sourceId: recipe.sourceId,
      title: recipe.translations.es.title,
      ingredients: mapIngredients(recipe.translations.es.ingredients),
    };
  }

  return {
    sourceId: recipe.sourceId,
    title: recipe.base.title,
    ingredients: mapIngredients(recipe.base.ingredients),
  };
}

function buildRecipeDetailResponse(
  recipe: RecipeDocument,
  lang: Lang,
  translation?: RecipeTranslation,
) {
  return {
    sourceId: recipe.sourceId,
    title: translation?.title ?? recipe.base.title,
    summary: sanitizeSummary(translation?.summary ?? recipe.base.summary),
    instructions: (translation?.instructions ?? recipe.base.instructions).map(
      (block) => ({
        name: block.name,
        steps: block.steps.map((step) => ({
          number: step.number,
          text: step.text,
        })),
      }),
    ),
    ingredients: mapIngredients(
      translation?.ingredients ?? recipe.base.ingredients,
    ),
    image: safeImage(recipe.meta.image),
    readyInMinutes: recipe.meta.readyInMinutes,
    servings: recipe.meta.servings,
    vegetarian: recipe.meta.vegetarian,
    vegan: recipe.meta.vegan,
    glutenFree: recipe.meta.glutenFree,
    dairyFree: recipe.meta.dairyFree,
    cookingMinutes: recipe.meta.cookingMinutes,
    preparationMinutes: recipe.meta.preparationMinutes,
    healthScore: recipe.meta.healthScore,
    aggregateLikes: recipe.meta.aggregateLikes,
    sourceName: recipe.meta.sourceName,
    sourceUrl: safeHttpUrl(recipe.meta.sourceUrl),
    lang,
  };
}

function mapIngredients(ingredients: RecipeDocument['base']['ingredients']) {
  return ingredients.map((ingredient) => ({
    id: ingredient.id,
    name: ingredient.name,
    original: ingredient.original,
    amount: ingredient.amount,
    unit: ingredient.unit,
    image: safeImage(ingredient.image) ?? '',
  }));
}
