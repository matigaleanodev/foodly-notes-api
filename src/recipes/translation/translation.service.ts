import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RecipeDocument } from '../schemas/recipe.schema';
import { AzureTranslationService } from './azure-translation.service';
import {
  TranslationEntry,
  TranslationEntryDocument,
} from '../schemas/translation-entry.schema';
import { TranslationTargetLang } from './azure-translation.service';

@Injectable()
export class TranslationService {
  constructor(
    @InjectModel(TranslationEntry.name)
    private readonly translationEntryModel: Model<TranslationEntryDocument>,
    private readonly azure: AzureTranslationService,
  ) {}

  async translateTexts(
    texts: string[],
    targetLang: TranslationTargetLang,
  ): Promise<string[]> {
    if (!texts.length) {
      return [];
    }

    const cacheEntries = await this.translationEntryModel
      .find({
        sourceText: { $in: texts },
        targetLang,
      })
      .exec();

    const cacheBySourceText = new Map(
      cacheEntries.map((entry) => [entry.sourceText, entry.translatedText]),
    );
    const missingTexts = texts.filter((text) => !cacheBySourceText.has(text));

    if (missingTexts.length) {
      const translatedTexts = await this.azure.translate(missingTexts, targetLang);

      await Promise.all(
        missingTexts.map((sourceText, index) =>
          this.translationEntryModel
            .updateOne(
              { sourceText, targetLang },
              {
                $set: {
                  sourceText,
                  targetLang,
                  translatedText: translatedTexts[index],
                },
              },
              { upsert: true },
            )
            .exec(),
        ),
      );

      missingTexts.forEach((sourceText, index) => {
        cacheBySourceText.set(sourceText, translatedTexts[index]);
      });
    }

    return texts.map((text) => cacheBySourceText.get(text) ?? text);
  }

  async translateSearchQueryToEnglish(query: string): Promise<string> {
    const [translatedQuery] = await this.translateTexts([query], 'en');
    return translatedQuery;
  }

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

    const translated = await this.translateTexts(texts, 'es');

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
