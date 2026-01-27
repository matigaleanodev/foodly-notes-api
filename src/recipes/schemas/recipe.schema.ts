import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RecipeDocument = HydratedDocument<Recipe>;

@Schema({ timestamps: true })
export class Recipe {
  @Prop({ required: true, index: true })
  sourceId: number;

  @Prop({ default: 'spoonacular' })
  source: string;

  @Prop({ default: 'en' })
  originalLang: string;

  @Prop({
    type: {
      title: String,
      summary: String,
      instructions: [
        {
          name: String,
          steps: [
            {
              number: Number,
              text: String,
            },
          ],
        },
      ],
      ingredients: [
        {
          id: Number,
          name: String,
          original: String,
          amount: Number,
          unit: String,
          image: String,
        },
      ],
    },
    required: true,
  })
  base: {
    title: string;
    summary: string;
    instructions: {
      name: string;
      steps: {
        number: number;
        text: string;
      }[];
    }[];
    ingredients: {
      id: number;
      name: string;
      original: string;
      amount: number;
      unit: string;
      image: string;
    }[];
  };

  @Prop({
    type: {
      image: String,
      readyInMinutes: Number,
      servings: Number,
      vegetarian: Boolean,
      vegan: Boolean,
      glutenFree: Boolean,
    },
  })
  meta: {
    image: string;
    readyInMinutes: number;
    servings: number;
    vegetarian: boolean;
    vegan: boolean;
    glutenFree: boolean;
  };

  @Prop({
    type: Object,
    default: {},
  })
  translations: {
    [lang: string]: {
      title: string;
      summary: string;
      instructions: {
        name: string;
        steps: {
          number: number;
          text: string;
        }[];
      }[];
      ingredients: {
        id: number;
        name: string;
        original: string;
        amount: number;
        unit: string;
        image: string;
      }[];
      translatedAt: Date;
    };
  };
}

export const RecipeSchema = SchemaFactory.createForClass(Recipe);
