import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';
import { recipeLangExample } from '../../../swagger/examples/recipes/recipe-language.example';

export class LangQueryDto {
  @ApiPropertyOptional({
    enum: ['en', 'es'],
    example: recipeLangExample,
    description: 'Response language.',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsOptional()
  @IsIn(['en', 'es'])
  lang?: 'en' | 'es';
}
