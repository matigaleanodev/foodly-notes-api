import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { APP_VERSION } from '../config/app-metadata';

export function buildSwaggerDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Foodly Notes API')
    .setDescription(
      'Backend API for recipe search, translation support, and ingredient aggregation.',
    )
    .setVersion(APP_VERSION)
    .build();

  return SwaggerModule.createDocument(app, config);
}

export function setupSwagger(app: INestApplication): OpenAPIObject {
  const document = buildSwaggerDocument(app);
  const httpAdapter = app.getHttpAdapter();

  httpAdapter.get('/openapi.json', (_request: Request, response: Response) => {
    response.json(document);
  });

  SwaggerModule.setup('docs', app, document, {
    useGlobalPrefix: false,
    jsonDocumentUrl: '/openapi.json',
  });

  return document;
}
