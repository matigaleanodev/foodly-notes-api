import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { recipeDetailResponseExample } from '../../../swagger/examples/recipes/recipe-detail-response.example';
import { RecipeIngredientDto } from './recipe-ingredient.dto';
import { RecipeInstructionDto } from './recipe-instruction.dto';

export class RecipeDetailResponseDto {
  @ApiProperty({ example: recipeDetailResponseExample.sourceId })
  sourceId!: number;

  @ApiProperty({ example: recipeDetailResponseExample.title })
  title!: string;

  @ApiProperty({ example: recipeDetailResponseExample.summary })
  summary!: string;

  @ApiProperty({
    type: [RecipeInstructionDto],
    example: recipeDetailResponseExample.instructions,
  })
  instructions!: RecipeInstructionDto[];

  @ApiProperty({
    type: [RecipeIngredientDto],
    example: recipeDetailResponseExample.ingredients,
  })
  ingredients!: RecipeIngredientDto[];

  @ApiPropertyOptional({ example: recipeDetailResponseExample.image })
  image?: string;

  @ApiProperty({ example: recipeDetailResponseExample.readyInMinutes })
  readyInMinutes!: number;

  @ApiProperty({ example: recipeDetailResponseExample.servings })
  servings!: number;

  @ApiProperty({ example: recipeDetailResponseExample.vegetarian })
  vegetarian!: boolean;

  @ApiProperty({ example: recipeDetailResponseExample.vegan })
  vegan!: boolean;

  @ApiProperty({ example: recipeDetailResponseExample.glutenFree })
  glutenFree!: boolean;

  @ApiProperty({ example: recipeDetailResponseExample.dairyFree })
  dairyFree!: boolean;

  @ApiPropertyOptional({ example: recipeDetailResponseExample.cookingMinutes })
  cookingMinutes?: number;

  @ApiPropertyOptional({
    example: recipeDetailResponseExample.preparationMinutes,
  })
  preparationMinutes?: number;

  @ApiProperty({ example: recipeDetailResponseExample.healthScore })
  healthScore!: number;

  @ApiProperty({ example: recipeDetailResponseExample.aggregateLikes })
  aggregateLikes!: number;

  @ApiPropertyOptional({ example: recipeDetailResponseExample.sourceName })
  sourceName?: string;

  @ApiPropertyOptional({ example: recipeDetailResponseExample.sourceUrl })
  sourceUrl?: string;

  @ApiProperty({
    enum: ['en', 'es'],
    example: recipeDetailResponseExample.lang,
  })
  lang!: 'en' | 'es';
}
