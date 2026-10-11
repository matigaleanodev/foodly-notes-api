import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { numericInput } from '../../../common/validation/numeric-input';

export class StoredRecipesQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 50 })
  @Transform(({ value }: { value: unknown }) => numericInput(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;

  @ApiPropertyOptional({
    description: 'Return source IDs greater than this cursor.',
    minimum: 1,
    maximum: Number.MAX_SAFE_INTEGER,
  })
  @Transform(({ value }: { value: unknown }) => numericInput(value))
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  after?: number;
}
