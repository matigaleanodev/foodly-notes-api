import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { recipeSummaryExample } from '../../../swagger/examples/recipes/recipe-summary.example';

export class RecipeSummaryResponseDto {
  @ApiProperty({ example: recipeSummaryExample.sourceId })
  sourceId!: number;

  @ApiProperty({ example: recipeSummaryExample.title })
  title!: string;

  @ApiPropertyOptional({
    example: recipeSummaryExample.image,
    nullable: true,
  })
  image?: string | null;
}
