import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { similarRecipeExample } from '../../../swagger/examples/recipes/similar-recipe.example';

export class SimilarRecipeResponseDto {
  @ApiProperty({ example: similarRecipeExample.sourceId })
  sourceId!: number;

  @ApiProperty({ example: similarRecipeExample.title })
  title!: string;

  @ApiPropertyOptional({
    example: similarRecipeExample.image,
    nullable: true,
  })
  image?: string | null;
}
