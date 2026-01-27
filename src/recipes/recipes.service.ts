import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lang } from 'src/common/types/lang.type';
import {
  DailyRecipe,
  DailyRecipeDocument,
} from './schemas/daily-recipe.schema';
import { SpoonacularService } from './spoonacular/spoonacular.service';

@Injectable()
export class RecipesService {
  constructor(
    @InjectModel(DailyRecipe.name)
    private readonly dailyRecipeModel: Model<DailyRecipeDocument>,
    private readonly spoonacularService: SpoonacularService,
  ) {}

  async getDailyRecipes(lang: Lang = 'en') {
    const today = this.getToday();
    console.log(lang);
    const cached = await this.dailyRecipeModel.findOne({ date: today }).exec();

    if (cached) {
      return cached.recipes;
    }

    const spoonacularRecipes = await this.spoonacularService.getDailyRecipes();

    const recipes = spoonacularRecipes.map((recipe) => ({
      sourceId: recipe.id,
      title: recipe.title,
      image: recipe.image,
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

  getRecipeDetails(sourceId: number, lang: Lang) {
    return { sourceId, lang };
  }

  getSimilarRecipe(sourceId: number, lang: Lang) {
    return { sourceId, lang };
  }

  getAllRecipes() {}
}
