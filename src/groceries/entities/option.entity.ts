import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OptionDocument = HydratedDocument<Option>;

@Schema()
export class Option {
  @Prop()
  name: string;

  @Prop()
  price: number;
}

export const OptionSchema = SchemaFactory.createForClass(Option);
