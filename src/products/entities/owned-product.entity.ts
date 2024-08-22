import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from 'src/user/entities/user.entity';

export type OwnedProductDocument = HydratedDocument<OwnedProduct>;

@Schema()
export class OwnedProduct {
  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop()
  price: number;

  @Prop()
  imageUrl: string;

  @Prop()
  externalImageId: string;

  @Prop({ type: Types.ObjectId, required: true, ref: User.name })
  seller: User;
}

export const OwnedProductSchema = SchemaFactory.createForClass(OwnedProduct);
