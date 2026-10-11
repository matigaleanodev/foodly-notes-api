import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { recipeLangExample } from '../../../swagger/examples/recipes/recipe-language.example';
import { recipeSearchQueryExample } from '../../../swagger/examples/recipes/search-recipes.example';

function normalizeSearchQuery(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeLangValue(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class SearchRecipesQueryDto {
  @ApiProperty({
    example: recipeSearchQueryExample,
    description: 'Search text used to query recipes.',
    maxLength: 200,
  })
  @Transform(({ value }: { value: unknown }) => normalizeSearchQuery(value))
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Matches(/^[^\p{Cc}]*$/u, {
    message: 'q must not contain control characters',
  })
  q!: string;

  @ApiPropertyOptional({
    enum: ['en', 'es'],
    example: recipeLangExample,
    description:
      'Search query language. Spanish queries are translated to English before provider lookup.',
  })
  @Transform(({ value }: { value: unknown }) => normalizeLangValue(value))
  @IsOptional()
  @IsIn(['en', 'es'])
  lang?: 'en' | 'es';
}
