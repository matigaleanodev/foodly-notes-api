import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'securitycounters' })
export class SecurityCounter {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ required: true })
  count!: number;

  @Prop({ required: true })
  expiresAt!: Date;
}

export const SecurityCounterSchema =
  SchemaFactory.createForClass(SecurityCounter);
SecurityCounterSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: 'security_counter_expiry' },
);
