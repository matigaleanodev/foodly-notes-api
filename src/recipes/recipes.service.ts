import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lang } from 'src/common/types/lang.type';
import {
  DailyRecipe,
  DailyRecipeDocument,
} from './schemas/daily-recipe.schema';
import { SpoonacularService } from './spoonacular/spoonacular.service';
import { Recipe, RecipeDocument } from './schemas/recipe.schema';
import { TranslationService } from './translation/translation.service';

@Injectable()
export class RecipesService {
  constructor(
    @InjectModel(DailyRecipe.name)
    private readonly dailyRecipeModel: Model<DailyRecipeDocument>,
    @InjectModel(Recipe.name)
    private readonly recipeModel: Model<RecipeDocument>,
    private readonly spoonacularService: SpoonacularService,
    private readonly translationService: TranslationService,
  ) {}

  async getDailyRecipes(lang: Lang = 'en') {
    const today = this.getToday();
    const cached = await this.dailyRecipeModel.findOne({ date: today }).exec();

    if (cached) {
      return cached.recipes;
    }

    const spoonacularRecipes = await this.spoonacularService.getDailyRecipes();

    const recipes = spoonacularRecipes.map((recipe) => ({
      sourceId: recipe.id,
      title: recipe.title,
      image: recipe.image ?? undefined,
    }));

    await this.dailyRecipeModel.create({
      date: today,
      recipes,
    });

    return recipes;
  }

  private getToday(): string {
    return new Date().toISOString().slice(0, 10);
  }

  async getRecipeDetails(sourceId: number, lang: Lang = 'en') {
    const recipe = await this.findOrCreateRecipe(sourceId);

    if (lang === 'es') {
      if (!recipe.translations?.es) {
        const translated =
          await this.translationService.translateRecipeToSpanish(recipe);

        recipe.translations = {
          ...recipe.translations,
          es: {
            ...translated,
            translatedAt: new Date(),
          },
        };

        await recipe.save();
      }

      return this.buildTranslatedRecipeResponse(recipe, 'es');
    }

    return this.buildRecipeResponse(recipe, 'en');
  }

  async getSimilarRecipe(sourceId: number) {
    return this.spoonacularService.getSimilarRecipes(sourceId);
  }

  async getIngredientsForRecipes(sourceIds: number[], lang: Lang = 'en') {
    const recipes = await Promise.all(
      sourceIds.map((sourceId) => this.findOrCreateRecipe(sourceId)),
    );

    if (lang === 'es') {
      await Promise.all(
        recipes.map(async (recipe) => {
          if (!recipe.translations?.es) {
            const translated =
              await this.translationService.translateRecipeToSpanish(recipe);

            recipe.translations = {
              ...recipe.translations,
              es: {
                ...translated,
                translatedAt: new Date(),
              },
            };

            await recipe.save();
          }
        }),
      );
    }

    return recipes.map((recipe) => {
      if (lang === 'es' && recipe.translations?.es) {
        return {
          sourceId: recipe.sourceId,
          title: recipe.translations.es.title,
          ingredients: recipe.translations.es.ingredients,
        };
      }

      return {
        sourceId: recipe.sourceId,
        title: recipe.base.title,
        ingredients: recipe.base.ingredients,
      };
    });
  }

  async searchRecipes(query: string) {
    const results = await this.spoonacularService.searchRecipes(query);

    return results.map((r) => ({
      sourceId: r.id,
      title: r.title,
      image: r.image,
    }));
  }

  async getAllRecipes() {
    const recipes = await this.recipeModel.find().exec();

    return recipes.map((recipe) => ({
      sourceId: recipe.sourceId,
      title: recipe.base.title,
      image: recipe.meta.image,
    }));
  }

  private buildRecipeResponse(recipe: RecipeDocument, lang: Lang) {
    return {
      sourceId: recipe.sourceId,
      title: recipe.base.title,
      summary: recipe.base.summary,
      instructions: recipe.base.instructions,
      ingredients: recipe.base.ingredients,
      image: recipe.meta.image,
      readyInMinutes: recipe.meta.readyInMinutes,
      servings: recipe.meta.servings,
      vegetarian: recipe.meta.vegetarian,
      vegan: recipe.meta.vegan,
      glutenFree: recipe.meta.glutenFree,

      dairyFree: recipe.meta.dairyFree,
      cookingMinutes: recipe.meta.cookingMinutes,
      preparationMinutes: recipe.meta.preparationMinutes,
      healthScore: recipe.meta.healthScore,
      aggregateLikes: recipe.meta.aggregateLikes,
      sourceName: recipe.meta.sourceName,
      sourceUrl: recipe.meta.sourceUrl,

      lang,
    };
  }

  private buildTranslatedRecipeResponse(recipe: RecipeDocument, lang: 'es') {
    const translation = recipe.translations?.[lang];

    if (!translation) {
      return this.buildRecipeResponse(recipe, 'en');
    }

    return {
      sourceId: recipe.sourceId,
      title: translation.title,
      summary: translation.summary,
      instructions: translation.instructions,
      ingredients: translation.ingredients,
      image: recipe.meta.image,
      readyInMinutes: recipe.meta.readyInMinutes,
      servings: recipe.meta.servings,
      vegetarian: recipe.meta.vegetarian,
      vegan: recipe.meta.vegan,
      glutenFree: recipe.meta.glutenFree,

      dairyFree: recipe.meta.dairyFree,
      cookingMinutes: recipe.meta.cookingMinutes,
      preparationMinutes: recipe.meta.preparationMinutes,
      healthScore: recipe.meta.healthScore,
      aggregateLikes: recipe.meta.aggregateLikes,
      sourceName: recipe.meta.sourceName,
      sourceUrl: recipe.meta.sourceUrl,

      lang,
    };
  }

  private async findOrCreateRecipe(sourceId: number): Promise<RecipeDocument> {
    const recipe = await this.recipeModel.findOne({ sourceId }).exec();

    if (recipe) {
      return recipe;
    }

    const spoonacularRecipe =
      await this.spoonacularService.getRecipeById(sourceId);

    return this.recipeModel.create({
      sourceId,
      base: {
        title: spoonacularRecipe.title,
        summary: spoonacularRecipe.summary,
        instructions: spoonacularRecipe.analyzedInstructions.map((block) => ({
          name: block.name ?? '',
          steps: block.steps.map((step) => ({
            number: step.number,
            text: step.step,
          })),
        })),
        ingredients: spoonacularRecipe.extendedIngredients.map((i) => ({
          id: i.id,
          name: i.name,
          original: i.original,
          amount: i.amount,
          unit: i.unit,
          image: i.image,
        })),
      },
      meta: {
        image: spoonacularRecipe.image,
        readyInMinutes: spoonacularRecipe.readyInMinutes,
        servings: spoonacularRecipe.servings,
        vegetarian: spoonacularRecipe.vegetarian,
        vegan: spoonacularRecipe.vegan,
        glutenFree: spoonacularRecipe.glutenFree,

        dairyFree: spoonacularRecipe.dairyFree,
        cookingMinutes: spoonacularRecipe.cookingMinutes,
        preparationMinutes: spoonacularRecipe.preparationMinutes,
        healthScore: spoonacularRecipe.healthScore,
        aggregateLikes: spoonacularRecipe.aggregateLikes,
        sourceName: spoonacularRecipe.sourceName,
        sourceUrl: spoonacularRecipe.sourceUrl,
      },
    });
  }
}
