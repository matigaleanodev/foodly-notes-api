import { ApiProperty } from '@nestjs/swagger';
import { ingredientsByRecipeExample } from '../../../swagger/examples/recipes/ingredients-response.example';
import { RecipeIngredientDto } from './recipe-ingredient.dto';

export class RecipeIngredientsResponseDto {
  @ApiProperty({ example: ingredientsByRecipeExample.sourceId })
  sourceId!: number;

  @ApiProperty({ example: ingredientsByRecipeExample.title })
  title!: string;

  @ApiProperty({
    type: [RecipeIngredientDto],
    example: ingredientsByRecipeExample.ingredients,
  })
  ingredients!: RecipeIngredientDto[];
}
