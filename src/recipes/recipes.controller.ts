import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import type { Lang } from '../common/types/lang.type';
import {
  ApiDailyRecipes,
  ApiRecipeDetails,
  ApiRecipeIngredients,
  ApiRecipesController,
  ApiSearchRecipes,
  ApiSimilarRecipes,
  ApiStoredRecipes,
} from '../swagger/recipes.decorators';
import { IngredientsRequestDto } from './dto/requests/ingredients-request.dto';
import { LangQueryDto } from './dto/requests/lang-query.dto';
import { RecipeIdParamDto } from './dto/requests/recipe-id-param.dto';
import { SearchRecipesQueryDto } from './dto/requests/search-recipes-query.dto';
import { RecipeDetailResponseDto } from './dto/responses/recipe-detail-response.dto';
import { RecipeIngredientsResponseDto } from './dto/responses/recipe-ingredients-response.dto';
import { RecipeSummaryResponseDto } from './dto/responses/recipe-summary-response.dto';
import { SimilarRecipeResponseDto } from './dto/responses/similar-recipe-response.dto';

@ApiRecipesController()
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @ApiDailyRecipes()
  @Get('daily')
  getDailyRecipes(
    @Query() query: LangQueryDto,
  ): Promise<RecipeSummaryResponseDto[]> {
    const safeLang: Lang = query.lang === 'es' ? 'es' : 'en';
    return this.recipesService.getDailyRecipes(safeLang);
  }

  @ApiSearchRecipes()
  @Get('search')
  searchRecipes(
    @Query() query: SearchRecipesQueryDto,
  ): Promise<RecipeSummaryResponseDto[]> {
    const safeLang: Lang = query.lang === 'es' ? 'es' : 'en';
    return this.recipesService.searchRecipes(query.q, safeLang);
  }

  @ApiRecipeDetails()
  @Get(':id')
  getRecipeDetails(
    @Param() params: RecipeIdParamDto,
    @Query() query: LangQueryDto,
  ): Promise<RecipeDetailResponseDto> {
    const safeLang: Lang = query.lang === 'es' ? 'es' : 'en';
    return this.recipesService.getRecipeDetails(params.id, safeLang);
  }

  @ApiSimilarRecipes()
  @Get(':id/similar')
  getSimilarRecipes(
    @Param() params: RecipeIdParamDto,
  ): Promise<SimilarRecipeResponseDto[]> {
    return this.recipesService.getSimilarRecipe(params.id);
  }

  @ApiStoredRecipes()
  @Get()
  getAllRecipes(): Promise<RecipeSummaryResponseDto[]> {
    return this.recipesService.getAllRecipes();
  }

  @ApiRecipeIngredients()
  @Post('ingredients')
  getIngredients(
    @Body() body: IngredientsRequestDto,
  ): Promise<RecipeIngredientsResponseDto[]> {
    const safeLang: Lang = body.lang === 'es' ? 'es' : 'en';
    return this.recipesService.getIngredientsForRecipes(
      body.sourceIds,
      safeLang,
    );
  }
}
