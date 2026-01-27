import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DailyRecipeDocument = HydratedDocument<DailyRecipe>;

@Schema({ timestamps: true })
export class DailyRecipe extends Document {
  @Prop({ required: true })
  date: string; // YYYY-MM-DD

  @Prop({
    type: [
      {
        sourceId: Number,
        title: String,
        image: String,
      },
    ],
    required: true,
  })
  recipes: {
    sourceId: number;
    title: string;
    image: string;
  }[];
}

export const DailyRecipeSchema = SchemaFactory.createForClass(DailyRecipe);
