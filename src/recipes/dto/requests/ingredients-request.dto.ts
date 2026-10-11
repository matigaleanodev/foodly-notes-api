import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { numericInput } from '../../../common/validation/numeric-input';
import {
  ingredientsRequestExample,
  ingredientsSourceIdsExample,
} from '../../../swagger/examples/recipes/ingredients-request.example';
import { recipeLangExample } from '../../../swagger/examples/recipes/recipe-language.example';

function normalizeLangValue(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class IngredientsRequestDto {
  @ApiProperty({
    type: [Number],
    example: ingredientsSourceIdsExample,
    description: 'Recipe source identifiers.',
    maxItems: 20,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ArrayUnique()
  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value) ? value.map(numericInput) : value,
  )
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(Number.MAX_SAFE_INTEGER, { each: true })
  sourceIds!: number[];

  @ApiPropertyOptional({
    enum: ['en', 'es'],
    example: recipeLangExample,
    description: 'Response language.',
  })
  @Transform(({ value }: { value: unknown }) => normalizeLangValue(value))
  @IsOptional()
  @IsIn(['en', 'es'])
  lang?: 'en' | 'es';

  static readonly example = ingredientsRequestExample;
}
