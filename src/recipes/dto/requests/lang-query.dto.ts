import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';
import { recipeLangExample } from '../../../swagger/examples/recipes/recipe-language.example';

function normalizeLangValue(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class LangQueryDto {
  @ApiPropertyOptional({
    enum: ['en', 'es'],
    example: recipeLangExample,
    description: 'Response language.',
  })
  @Transform(({ value }: { value: unknown }) => normalizeLangValue(value))
  @IsOptional()
  @IsIn(['en', 'es'])
  lang?: 'en' | 'es';
}
