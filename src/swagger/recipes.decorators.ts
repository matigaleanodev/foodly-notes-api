import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IngredientsRequestDto } from '../recipes/dto/requests/ingredients-request.dto';
import { RecipeDetailResponseDto } from '../recipes/dto/responses/recipe-detail-response.dto';
import { RecipeIngredientsResponseDto } from '../recipes/dto/responses/recipe-ingredients-response.dto';
import { RecipeSummaryResponseDto } from '../recipes/dto/responses/recipe-summary-response.dto';
import { SimilarRecipeResponseDto } from '../recipes/dto/responses/similar-recipe-response.dto';
import { dailyRecipesResponseExample } from './examples/recipes/recipe-summary.example';
import { ingredientsResponseExample } from './examples/recipes/ingredients-response.example';
import { recipeDetailResponseExample } from './examples/recipes/recipe-detail-response.example';
import { similarRecipesResponseExample } from './examples/recipes/similar-recipe.example';

export function ApiRecipesController() {
  return applyDecorators(ApiTags('Recipes'));
}

export function ApiDailyRecipes() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get daily recipes',
      description:
        'Returns daily recipes with ingredients and daily cache support.',
    }),
    ApiOkResponse({
      description: 'Daily recipes list.',
      type: RecipeSummaryResponseDto,
      isArray: true,
      example: dailyRecipesResponseExample,
    }),
  );
}

export function ApiSearchRecipes() {
  return applyDecorators(
    ApiOperation({
      summary: 'Search recipes',
      description: 'Searches recipes by text using Spoonacular.',
    }),
    ApiOkResponse({
      description: 'Recipes matching the provided query.',
      type: RecipeSummaryResponseDto,
      isArray: true,
      example: dailyRecipesResponseExample,
    }),
  );
}

export function ApiRecipeDetails() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get recipe details',
      description:
        'Returns full recipe details and reuses persisted translations when available.',
    }),
    ApiOkResponse({
      description: 'Recipe detail response.',
      type: RecipeDetailResponseDto,
      example: recipeDetailResponseExample,
    }),
  );
}

export function ApiSimilarRecipes() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get similar recipes',
      description: 'Returns recipes related to the provided recipe id.',
    }),
    ApiOkResponse({
      description: 'Similar recipes list.',
      type: SimilarRecipeResponseDto,
      isArray: true,
      example: similarRecipesResponseExample,
    }),
  );
}

export function ApiStoredRecipes() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get stored recipes',
      description: 'Returns recipes already persisted in the database.',
    }),
    ApiOkResponse({
      description: 'Stored recipes list.',
      type: RecipeSummaryResponseDto,
      isArray: true,
      example: dailyRecipesResponseExample,
    }),
  );
}

export function ApiRecipeIngredients() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get recipe ingredients',
      description: 'Returns grouped ingredients for the requested recipe ids.',
    }),
    ApiBody({
      type: IngredientsRequestDto,
      examples: {
        default: {
          value: IngredientsRequestDto.example,
        },
      },
    }),
    ApiOkResponse({
      description: 'Ingredients grouped by recipe.',
      type: RecipeIngredientsResponseDto,
      isArray: true,
      example: ingredientsResponseExample,
    }),
  );
}
