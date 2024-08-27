import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Option } from './option.entity';

export type GroceryDocument = HydratedDocument<Grocery>;

@Schema()
export class Grocery {
  @Prop()
  title: string;

  @Prop()
  imageUrl: string;

  @Prop()
  rating: number;

  @Prop()
  price: number;

  @Prop()
  discount: number;

  @Prop()
  description: string;

  @Prop({ type: [Types.ObjectId], required: true, ref: Option.name })
  options: Option[];
}

export const GrocerySchema = SchemaFactory.createForClass(Grocery);
