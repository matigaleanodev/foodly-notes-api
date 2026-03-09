import { ApiProperty } from '@nestjs/swagger';
import { recipeInstructionStepExample } from '../../../swagger/examples/recipes/recipe-instruction.example';

export class RecipeInstructionStepDto {
  @ApiProperty({ example: recipeInstructionStepExample.number })
  number!: number;

  @ApiProperty({ example: recipeInstructionStepExample.text })
  text!: string;
}
