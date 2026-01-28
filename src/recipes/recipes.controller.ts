import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { RecipesService } from './recipes.service';
import type { Lang } from 'src/common/types/lang.type';
import {
  ApiTags,
  ApiQuery,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import {
  DAILY_RECIPES_RESPONSE_EXAMPLE,
  RECIPE_DETAIL_RESPONSE_EXAMPLE,
  SIMILAR_RECIPES_RESPONSE_EXAMPLE,
  INGREDIENTS_RESPONSE_EXAMPLE,
  INGREDIENTS_SCHEMA,
} from './recipes.swagger';

@ApiTags('recipes')
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @ApiOperation({
    summary: 'Obtener recetas del día',
    description:
      'Devuelve las recetas diarias con ingredientes. Cacheado por día.',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'es'],
    description: 'Idioma de respuesta',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de recetas diarias',
    schema: { example: DAILY_RECIPES_RESPONSE_EXAMPLE },
  })
  @Get('daily')
  getDailyRecipes(@Query('lang') lang?: Lang) {
    const safeLang: Lang = lang === 'es' ? 'es' : 'en';
    return this.recipesService.getDailyRecipes(safeLang);
  }

  @ApiOperation({
    summary: 'Obtener detalle de una receta',
    description:
      'Devuelve el detalle completo de una receta. Traduce y guarda si el idioma es español.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de receta de Spoonacular',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'es'],
    description: 'Idioma de respuesta',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle de la receta',
    schema: { example: RECIPE_DETAIL_RESPONSE_EXAMPLE },
  })
  @Get(':id')
  getRecipeDetails(
    @Param('id', ParseIntPipe) id: number,
    @Query('lang') lang?: Lang,
  ) {
    const safeLang: Lang = lang === 'es' ? 'es' : 'en';
    return this.recipesService.getRecipeDetails(id, safeLang);
  }

  @ApiOperation({
    summary: 'Obtener recetas similares',
    description: 'Devuelve recetas relacionadas según Spoonacular',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de receta de Spoonacular',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de recetas similares',
    schema: { example: SIMILAR_RECIPES_RESPONSE_EXAMPLE },
  })
  @Get(':id/similar')
  getSimilarRecipes(@Param('id', ParseIntPipe) id: number) {
    return this.recipesService.getSimilarRecipe(id);
  }

  @ApiOperation({
    summary: 'Obtener todas las recetas almacenadas',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de recetas en base de datos',
  })
  @Get()
  getAllRecipes() {
    return this.recipesService.getAllRecipes();
  }

  @ApiOperation({
    summary: 'Obtener ingredientes para recetas',
    description:
      'Devuelve los ingredientes agrupados por receta. Traduce y persiste si corresponde.',
  })
  @ApiBody({
    schema: INGREDIENTS_SCHEMA,
  })
  @ApiResponse({
    status: 200,
    description: 'Ingredientes por receta',
    schema: { example: INGREDIENTS_RESPONSE_EXAMPLE },
  })
  @Post('ingredients')
  getIngredients(
    @Body()
    body: {
      sourceIds: number[];
      lang?: Lang;
    },
  ) {
    const safeLang: Lang = body.lang === 'es' ? 'es' : 'en';
    return this.recipesService.getIngredientsForRecipes(
      body.sourceIds,
      safeLang,
    );
  }
}
