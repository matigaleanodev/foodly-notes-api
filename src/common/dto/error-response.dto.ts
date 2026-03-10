import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    example: 502,
    description: 'HTTP status code.',
  })
  statusCode!: number;

  @ApiProperty({
    example: 'Recipe provider unavailable.',
    description: 'Human-readable error message.',
  })
  message!: string;

  @ApiProperty({
    example: 'Bad Gateway',
    description: 'HTTP error label.',
  })
  error!: string;
}
