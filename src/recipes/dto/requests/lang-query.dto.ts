import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { recipeLangExample } from '../../../swagger/examples/recipes/recipe-language.example';

export class LangQueryDto {
  @ApiPropertyOptional({
    enum: ['en', 'es'],
    example: recipeLangExample,
    description: 'Response language.',
  })
  @IsOptional()
  @IsIn(['en', 'es'])
  lang?: 'en' | 'es';
}
