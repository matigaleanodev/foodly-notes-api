import { Injectable } from '@nestjs/common';
import { Lang } from 'src/common/types/lang.type';

@Injectable()
export class RecipesService {
  getDailyRecipes(lang: Lang) {
    return lang;
  }

  getRecipeDetails(sourceId: number, lang: Lang) {
    return { sourceId, lang };
  }

  getSimilarRecipe(sourceId: number, lang: Lang) {
    return { sourceId, lang };
  }

  getAllRecipes() {}
}
