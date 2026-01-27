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

@Injectable()
export class RecipesService {
  constructor(
    @InjectModel(DailyRecipe.name)
    private readonly dailyRecipeModel: Model<DailyRecipeDocument>,
    @InjectModel(Recipe.name)
    private readonly recipeModel: Model<RecipeDocument>,
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

  async getRecipeDetails(sourceId: number, lang: Lang = 'en') {
    let recipe = await this.recipeModel.findOne({ sourceId }).exec();
    console.log(lang);
    if (!recipe) {
      const spoonacularRecipe =
        await this.spoonacularService.getRecipeById(sourceId);

      recipe = await this.recipeModel.create({
        sourceId,
        base: {
          title: spoonacularRecipe.title,
          summary: spoonacularRecipe.summary,
          instructions: spoonacularRecipe.instructions,
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
        },
      });
    }

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
      lang: 'en',
    };
  }

  async getSimilarRecipe(sourceId: number) {
    const similar = await this.spoonacularService.getSimilarRecipes(sourceId);

    return similar.map((recipe) => ({
      sourceId: recipe.id,
      title: recipe.title,
      image: `https://img.spoonacular.com/recipes/${recipe.id}-556x370.${recipe.imageType}`,
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
}
