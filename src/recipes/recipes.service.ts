import { Injectable, Logger } from '@nestjs/common';
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
import { StoredRecipesQueryDto } from './dto/requests/stored-recipes-query.dto';
import { safeImage } from './recipe-content';
import { SingleFlight } from '../common/single-flight';
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
  private readonly logger = new Logger(RecipesService.name);
  private readonly dailyFlights = new SingleFlight<
    string,
    DailyRecipeDocument
  >();
  private readonly recipeFlights = new SingleFlight<number, RecipeDocument>();
  private readonly translationFlights = new SingleFlight<
    number,
    RecipeDocument
  >();
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
    const daily = await this.dailyFlights.run(today, async () => {
      const cached = await this.dailyRecipeModel
        .findOne({ date: today })
        .exec();
      if (cached) return cached;
      const recipes = (await this.spoonacularService.getDailyRecipes()).map(
        mapDailyRecipeSummary,
      );
      try {
        return await this.dailyRecipeModel
          .findOneAndUpdate(
            { date: today },
            { $setOnInsert: { date: today, recipes } },
            {
              upsert: true,
              returnDocument: 'after',
              setDefaultsOnInsert: true,
            },
          )
          .exec();
      } catch (error) {
        if (!isDuplicateKey(error)) throw error;
        const winner = await this.dailyRecipeModel
          .findOne({ date: today })
          .exec();
        if (!winner) throw error;
        return winner;
      }
    });
    return this.buildDailyRecipeResponse(daily.recipes, lang);
  }

  private getToday(): string {
    return new Date().toISOString().slice(0, 10);
  }

  async getRecipeDetails(sourceId: number, lang: Lang = 'en') {
    const recipe = await this.findOrCreateRecipe(sourceId);
    if (lang === 'es') {
      const translatedRecipe = await this.ensureSpanishTranslation(recipe);
      return mapRecipeDetailResponse(
        translatedRecipe,
        translatedRecipe.translations?.es ? 'es' : 'en',
      );
    }

    return mapRecipeDetailResponse(recipe, 'en');
  }

  async getSimilarRecipe(sourceId: number, lang: Lang = 'en') {
    const recipes = await this.spoonacularService.getSimilarRecipes(sourceId);

    return this.translateRecipeSummaries(recipes, lang);
  }

  async getIngredientsForRecipes(sourceIds: number[], lang: Lang = 'en') {
    const recipes: RecipeDocument[] = [];
    for (let offset = 0; offset < sourceIds.length; offset += 4) {
      const batch = await Promise.all(
        sourceIds.slice(offset, offset + 4).map(async (sourceId) => {
          const recipe = await this.findOrCreateRecipe(sourceId);
          return lang === 'es' ? this.ensureSpanishTranslation(recipe) : recipe;
        }),
      );
      recipes.push(...batch);
    }

    return recipes.map((recipe) => mapRecipeIngredientsResponse(recipe, lang));
  }

  async searchRecipes(query: string, lang: Lang = 'en') {
    const normalizedQuery =
      lang === 'es' ? await this.translateSearchQueryToEnglish(query) : query;
    const results =
      await this.spoonacularService.searchRecipes(normalizedQuery);

    return results.map(mapSearchRecipeSummary);
  }

  async getAllRecipes(query: StoredRecipesQueryDto = { limit: 50 }) {
    const recipes = await this.recipeModel
      .find(query.after ? { sourceId: { $gt: query.after } } : {})
      .select('sourceId base.title meta.image -_id')
      .sort({ sourceId: 1 })
      .limit(query.limit)
      .lean()
      .exec();

    return recipes.map(mapStoredRecipeSummary);
  }

  private async findOrCreateRecipe(sourceId: number): Promise<RecipeDocument> {
    return this.recipeFlights.run(sourceId, () =>
      this.loadOrCreateRecipe(sourceId),
    );
  }

  private async loadOrCreateRecipe(sourceId: number): Promise<RecipeDocument> {
    const recipe = await this.recipeModel.findOne({ sourceId }).exec();

    if (recipe) {
      return recipe;
    }

    const spoonacularRecipe =
      await this.spoonacularService.getRecipeById(sourceId);

    try {
      return await this.recipeModel
        .findOneAndUpdate(
          { sourceId },
          { $setOnInsert: mapRecipePersistence(sourceId, spoonacularRecipe) },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
        )
        .exec();
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
      const winner = await this.recipeModel.findOne({ sourceId }).exec();
      if (!winner) throw error;
      return winner;
    }
  }

  private async ensureSpanishTranslation(
    recipe: RecipeDocument,
  ): Promise<RecipeDocument> {
    return this.translationFlights.run(recipe.sourceId, () =>
      this.translateRecipe(recipe),
    );
  }

  private async translateRecipe(
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
      this.logger.warn(
        'Spanish translation unavailable; returning base content.',
      );
      return recipe;
    }

    return recipe;
  }

  private async translateSearchQueryToEnglish(query: string): Promise<string> {
    try {
      return await this.translationService.translateSearchQueryToEnglish(query);
    } catch {
      return query;
    }
  }

  private async translateRecipeSummaries(
    recipes: {
      sourceId: number;
      title: string;
      image?: string | null;
    }[],
    lang: Lang,
  ) {
    const summaries = recipes.map((recipe) => ({
      sourceId: recipe.sourceId,
      title: recipe.title,
      image: safeImage(recipe.image),
    }));
    if (lang !== 'es') {
      return summaries;
    }

    try {
      const translatedTitles = await this.translationService.translateTexts(
        summaries.map((recipe) => recipe.title),
        'es',
      );

      return summaries.map((recipe, index) => ({
        ...recipe,
        title: translatedTitles[index],
      }));
    } catch {
      return summaries;
    }
  }

  private async buildDailyRecipeResponse(
    recipes: {
      sourceId: number;
      title: string;
      image?: string;
    }[],
    lang: Lang,
  ) {
    return this.translateRecipeSummaries(recipes, lang);
  }
}

function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}
