import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthResponseDto } from '../common/dto/health-response.dto';

@ApiTags('Health')
@Controller()
export class HealthController {
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns a simple status response for operational checks.',
  })
  @ApiOkResponse({
    description: 'Service is healthy.',
    type: HealthResponseDto,
    example: { status: 'ok' },
  })
  @Get('health')
  health(): HealthResponseDto {
    return { status: 'ok' };
  }
}
