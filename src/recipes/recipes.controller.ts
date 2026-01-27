import { Controller, Get, Query } from '@nestjs/common';
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
}
