import { Module } from '@nestjs/common';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Recipe, RecipeSchema } from './schemas/recipe.schema';
import { DailyRecipe, DailyRecipeSchema } from './schemas/daily-recipe.schema';
import { SpoonacularService } from './spoonacular/spoonacular.service';
import { HttpModule } from '@nestjs/axios';
import { TranslationService } from './translation/translation.service';
import { AzureTranslationService } from './translation/azure-translation.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: DailyRecipe.name,
        schema: DailyRecipeSchema,
      },
      {
        name: Recipe.name,
        schema: RecipeSchema,
      },
    ]),
    HttpModule,
  ],
  controllers: [RecipesController],
  providers: [
    RecipesService,
    SpoonacularService,
    TranslationService,
    AzureTranslationService,
  ],
})
export class RecipesModule {}
