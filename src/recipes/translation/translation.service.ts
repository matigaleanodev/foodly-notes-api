import { Injectable } from '@nestjs/common';
import { RecipeDocument } from '../schemas/recipe.schema';
import { AzureTranslationService } from './azure-translation.service';

@Injectable()
export class TranslationService {
  constructor(private readonly azure: AzureTranslationService) {}

  async translateRecipeToSpanish(doc: RecipeDocument) {
    const recipe = doc.toObject();

    const instructionSteps = recipe.base.instructions.flatMap((block) =>
      block.steps.map((s) => s.text),
    );

    const texts: string[] = [
      recipe.base.title,
      recipe.base.summary,
      ...instructionSteps,
      ...recipe.base.ingredients.flatMap((i) => [i.name, i.original]),
    ];

    const translated = await this.azure.translate(texts, 'es');

    let index = 0;

    const title = translated[index++];
    const summary = translated[index++];

    const translatedInstructions = recipe.base.instructions.map((block) => ({
      name: block.name,
      steps: block.steps.map((step) => ({
        number: step.number,
        text: translated[index++],
      })),
    }));

    const translatedIngredients = recipe.base.ingredients.map((ingredient) => ({
      id: ingredient.id,
      amount: ingredient.amount,
      unit: ingredient.unit,
      image: ingredient.image,
      name: translated[index++],
      original: translated[index++],
    }));

    return {
      title,
      summary,
      instructions: translatedInstructions,
      ingredients: translatedIngredients,
      translatedAt: new Date(),
    };
  }
}
