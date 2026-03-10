import { ApiProperty } from '@nestjs/swagger';
import {
  recipeInstructionBlockExample,
  recipeInstructionStepExample,
} from '../../../swagger/examples/recipes/recipe-instruction.example';
import { RecipeInstructionStepDto } from './recipe-instruction-step.dto';

export class RecipeInstructionDto {
  @ApiProperty({ example: recipeInstructionBlockExample.name })
  name!: string;

  @ApiProperty({
    type: [RecipeInstructionStepDto],
    example: [recipeInstructionStepExample],
  })
  steps!: RecipeInstructionStepDto[];
}
