import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { recipeSourceIdExample } from '../../../swagger/examples/recipes/recipe-ids.example';

export class RecipeIdParamDto {
  @ApiProperty({
    example: recipeSourceIdExample,
    description: 'Spoonacular recipe identifier.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;
}
