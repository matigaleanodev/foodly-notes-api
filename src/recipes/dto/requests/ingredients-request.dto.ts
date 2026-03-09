import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';
import {
  ingredientsRequestExample,
  ingredientsSourceIdsExample,
} from '../../../swagger/examples/recipes/ingredients-request.example';
import { recipeLangExample } from '../../../swagger/examples/recipes/recipe-language.example';

export class IngredientsRequestDto {
  @ApiProperty({
    type: [Number],
    example: ingredientsSourceIdsExample,
    description: 'Recipe source identifiers.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  sourceIds!: number[];

  @ApiPropertyOptional({
    enum: ['en', 'es'],
    example: recipeLangExample,
    description: 'Response language.',
  })
  @IsOptional()
  @IsIn(['en', 'es'])
  lang?: 'en' | 'es';

  static readonly example = ingredientsRequestExample;
}
