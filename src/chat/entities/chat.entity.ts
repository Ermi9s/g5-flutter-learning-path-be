import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from 'src/user/entities/user.entity';

export type ChatDocument = HydratedDocument<Chat>;

@Schema()
export class Chat {
  @Prop({ type: Types.ObjectId, required: true, ref: User.name })
  user1: User;

  @Prop({ type: Types.ObjectId, required: true, ref: User.name })
  user2: User;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
