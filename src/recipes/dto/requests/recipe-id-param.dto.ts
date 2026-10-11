import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { numericInput } from '../../../common/validation/numeric-input';
import { recipeSourceIdExample } from '../../../swagger/examples/recipes/recipe-ids.example';

export class RecipeIdParamDto {
  @ApiProperty({
    example: recipeSourceIdExample,
    description: 'Spoonacular recipe identifier.',
  })
  @Transform(({ value }: { value: unknown }) => numericInput(value))
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  id!: number;
}
