import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { resolveCorsOrigins } from './cors.config';
import { setupSwagger } from '../swagger/swagger.config';
import { ApiExceptionFilter } from '../security/api-exception.filter';

export function configureApplication(
  app: NestExpressApplication,
  env: NodeJS.ProcessEnv = process.env,
) {
  const production = env.NODE_ENV === 'production';
  const enforceHttps = booleanSetting(env.ENFORCE_HTTPS, production);
  const swaggerEnabled = booleanSetting(env.SWAGGER_ENABLED, !production);
  const trustProxy = env.TRUST_PROXY?.trim();
  if (enforceHttps && !trustProxy)
    throw new Error('TRUST_PROXY is required when ENFORCE_HTTPS is enabled.');
  if (trustProxy) {
    if (/^(true|false|\d+|\*)$/i.test(trustProxy))
      throw new Error(
        'TRUST_PROXY must list trusted proxy addresses or subnets, not a boolean or hop count.',
      );
    app.set(
      'trust proxy',
      trustProxy.split(',').map((value) => value.trim()),
    );
  }

  app.set('etag', false);
  app.use(
    helmet({
      strictTransportSecurity: production
        ? { maxAge: 31536000, includeSubDomains: false }
        : false,
      contentSecurityPolicy: {
        directives: { upgradeInsecureRequests: production ? [] : null },
      },
    }),
  );
  app.enableCors({
    origin: resolveCorsOrigins(env.CORS_ORIGIN, production),
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    exposedHeaders: [
      'Retry-After',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
    maxAge: 600,
  });
  app.use(
    (
      request: import('express').Request,
      response: import('express').Response,
      next: import('express').NextFunction,
    ) => {
      response.setHeader('Cache-Control', 'no-store');
      if (request.originalUrl.length > 4096) {
        response
          .status(414)
          .json({ statusCode: 414, message: 'Request URL too long.' });
        return;
      }
      // The unauthenticated liveness probe is safe over the container loopback connection.
      if (enforceHttps && request.path !== '/api/health' && !request.secure) {
        response
          .status(400)
          .json({ statusCode: 400, message: 'HTTPS is required.' });
        return;
      }
      if (
        ['POST', 'PUT', 'PATCH'].includes(request.method) &&
        !request.is('application/json')
      ) {
        response.status(415).json({
          statusCode: 415,
          message: 'Content-Type must be application/json.',
        });
        return;
      }
      next();
    },
  );
  app.useBodyParser('json', { limit: '16kb', strict: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter(app.getHttpAdapter()));
  if (swaggerEnabled) setupSwagger(app);
}

function booleanSetting(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error('Boolean settings must be true or false.');
}
