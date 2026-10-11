import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  HttpException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response } from 'express';
import { RetryableServiceException } from './provider-access.service';

@Catch()
export class ApiExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (
      typeof exception === 'object' &&
      exception !== null &&
      'type' in exception
    ) {
      if (exception.type === 'entity.too.large')
        exception = new PayloadTooLargeException('Request body too large.');
      else if (
        [
          'entity.parse.failed',
          'request.aborted',
          'request.size.invalid',
        ].includes(String(exception.type))
      )
        exception = new BadRequestException('Invalid JSON request body.');
    }
    const response = host.switchToHttp().getResponse<Response>();
    if (exception instanceof RetryableServiceException)
      response.setHeader('Retry-After', exception.retryAfter);
    if (
      exception instanceof HttpException &&
      exception.getStatus() === 429 &&
      !response.hasHeader('Retry-After')
    ) {
      response.setHeader(
        'Retry-After',
        response.getHeader('Retry-After-global') ?? 60,
      );
    }
    if (
      exception instanceof HttpException &&
      exception.getStatus() === 503 &&
      !response.hasHeader('Retry-After')
    )
      response.setHeader('Retry-After', 5);
    super.catch(exception, host);
  }
}
