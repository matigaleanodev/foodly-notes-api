import { ApiProperty } from '@nestjs/swagger';
import { recipeIngredientExample } from '../../../swagger/examples/recipes/recipe-ingredient.example';

export class RecipeIngredientDto {
  @ApiProperty({ example: recipeIngredientExample.id })
  id!: number;

  @ApiProperty({ example: recipeIngredientExample.name })
  name!: string;

  @ApiProperty({ example: recipeIngredientExample.original })
  original!: string;

  @ApiProperty({ example: recipeIngredientExample.amount })
  amount!: number;

  @ApiProperty({ example: recipeIngredientExample.unit })
  unit!: string;

  @ApiProperty({ example: recipeIngredientExample.image })
  image!: string;
}
