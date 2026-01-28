import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DailyRecipeDocument = HydratedDocument<DailyRecipe>;

@Schema({ timestamps: true })
export class DailyRecipe {
  @Prop({ required: true })
  date: string; // YYYY-MM-DD

  @Prop({
    type: [
      {
        sourceId: Number,
        title: String,
        image: String,
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
    ],
    required: true,
  })
  recipes: {
    sourceId: number;
    title: string;
    image: string;
    ingredients: [
      {
        id: number;
        name: string;
        original: string;
        amount: number;
        unit: string;
        image: string;
      },
    ];
  }[];
}

export const DailyRecipeSchema = SchemaFactory.createForClass(DailyRecipe);
