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
import {
  mapDailyRecipeSummary,
  mapRecipeDetailResponse,
  mapRecipeIngredientsResponse,
  mapRecipePersistence,
  mapSearchRecipeSummary,
  mapStoredRecipeSummary,
} from './recipes.mapper';

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
    const recipes = spoonacularRecipes.map(mapDailyRecipeSummary);

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
    const translatedRecipe = await this.ensureSpanishTranslation(recipe);

    if (lang === 'es') {
      return mapRecipeDetailResponse(translatedRecipe, translatedRecipe.translations?.es ? 'es' : 'en');
    }

    return mapRecipeDetailResponse(recipe, 'en');
  }

  async getSimilarRecipe(sourceId: number) {
    return this.spoonacularService.getSimilarRecipes(sourceId);
  }

  async getIngredientsForRecipes(sourceIds: number[], lang: Lang = 'en') {
    const recipes = await Promise.all(
      sourceIds.map((sourceId) => this.findOrCreateRecipe(sourceId)),
    );

    if (lang === 'es') {
      await Promise.all(recipes.map((recipe) => this.ensureSpanishTranslation(recipe)));
    }

    return recipes.map((recipe) => mapRecipeIngredientsResponse(recipe, lang));
  }

  async searchRecipes(query: string) {
    const results = await this.spoonacularService.searchRecipes(query);

    return results.map(mapSearchRecipeSummary);
  }

  async getAllRecipes() {
    const recipes = await this.recipeModel.find().exec();

    return recipes.map(mapStoredRecipeSummary);
  }

  private async findOrCreateRecipe(sourceId: number): Promise<RecipeDocument> {
    const recipe = await this.recipeModel.findOne({ sourceId }).exec();

    if (recipe) {
      return recipe;
    }

    const spoonacularRecipe =
      await this.spoonacularService.getRecipeById(sourceId);

    return this.recipeModel.create(mapRecipePersistence(sourceId, spoonacularRecipe));
  }

  private async ensureSpanishTranslation(
    recipe: RecipeDocument,
  ): Promise<RecipeDocument> {
    if (recipe.translations?.es) {
      return recipe;
    }

    try {
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
    } catch {
      return recipe;
    }

    return recipe;
  }
}
