import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { recipeLangExample } from '../../../swagger/examples/recipes/recipe-language.example';
import { recipeSearchQueryExample } from '../../../swagger/examples/recipes/search-recipes.example';

export class SearchRecipesQueryDto {
  @ApiProperty({
    example: recipeSearchQueryExample,
    description: 'Search text used to query recipes.',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  q!: string;

  @ApiPropertyOptional({
    enum: ['en', 'es'],
    example: recipeLangExample,
    description:
      'Search query language. Spanish queries are translated to English before provider lookup.',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsOptional()
  @IsIn(['en', 'es'])
  lang?: 'en' | 'es';
}
