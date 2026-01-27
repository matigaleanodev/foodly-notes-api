import { Module } from '@nestjs/common';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Recipe, RecipeSchema } from './schemas/recipe.schema';
import { DailyRecipe, DailyRecipeSchema } from './schemas/daily-recipe.schema';

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
  ],
  controllers: [RecipesController],
  providers: [RecipesService],
})
export class RecipesModule {}
