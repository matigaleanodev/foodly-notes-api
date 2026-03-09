import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { recipeSearchQueryExample } from '../../../swagger/examples/recipes/search-recipes.example';

export class SearchRecipesQueryDto {
  @ApiProperty({
    example: recipeSearchQueryExample,
    description: 'Search text used to query recipes.',
  })
  @IsString()
  @MinLength(1)
  q!: string;
}
