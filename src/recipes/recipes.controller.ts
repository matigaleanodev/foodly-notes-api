import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import type { Lang } from 'src/common/types/lang.type';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get('daily')
  getDailyRecipes(@Query('lang') lang?: Lang) {
    const safeLang: Lang = lang === 'es' ? 'es' : 'en';
    return this.recipesService.getDailyRecipes(safeLang);
  }

  @Get(':id')
  getRecipeDetails(
    @Param('id', ParseIntPipe) id: number,
    @Query('lang') lang?: Lang,
  ) {
    const safeLang: Lang = lang === 'es' ? 'es' : 'en';
    return this.recipesService.getRecipeDetails(id, safeLang);
  }

  @Get(':id/similar')
  getSimilarRecipes(@Param('id', ParseIntPipe) id: number) {
    return this.recipesService.getSimilarRecipe(id);
  }

  @Get()
  getAllRecipes() {
    return this.recipesService.getAllRecipes();
  }
}
