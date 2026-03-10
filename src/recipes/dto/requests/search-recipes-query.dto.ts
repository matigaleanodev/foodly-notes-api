import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';
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
}
