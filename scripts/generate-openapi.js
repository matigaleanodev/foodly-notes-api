require('ts-node/register');
require('tsconfig-paths/register');

const { writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { Module } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { HealthController } = require('../src/health/health.controller');
const { RecipesController } = require('../src/recipes/recipes.controller');
const { RecipesService } = require('../src/recipes/recipes.service');
const { buildSwaggerDocument } = require('../src/swagger/swagger.config');

const recipesServiceStub = {
  getDailyRecipes: async () => [],
  searchRecipes: async () => [],
  getRecipeDetails: async () => ({}),
  getSimilarRecipe: async () => [],
  getAllRecipes: async () => [],
  getIngredientsForRecipes: async () => [],
};

class OpenApiModule {}

Module({
  controllers: [HealthController, RecipesController],
  providers: [
    {
      provide: RecipesService,
      useValue: recipesServiceStub,
    },
  ],
})(OpenApiModule);

async function generateOpenApi() {
  const app = await NestFactory.create(OpenApiModule, { logger: false });

  app.setGlobalPrefix('api');

  const document = buildSwaggerDocument(app);
  const outputPath = join(process.cwd(), 'openapi.json');

  writeFileSync(outputPath, JSON.stringify(document, null, 2));

  await app.close();
}

generateOpenApi().catch((error) => {
  console.error(error);
  process.exit(1);
});
