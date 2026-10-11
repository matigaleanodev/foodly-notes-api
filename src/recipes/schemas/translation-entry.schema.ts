import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TranslationEntryDocument = HydratedDocument<TranslationEntry>;

@Schema({ timestamps: true })
export class TranslationEntry {
  @Prop({ required: true, index: true })
  sourceText!: string;

  @Prop({ required: true, index: true })
  targetLang!: string;

  @Prop({ required: true })
  translatedText!: string;
}

export const TranslationEntrySchema =
  SchemaFactory.createForClass(TranslationEntry);

TranslationEntrySchema.index(
  { sourceText: 1, targetLang: 1 },
  { unique: true },
);
TranslationEntrySchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60, name: 'translation_cache_expiry' },
);
