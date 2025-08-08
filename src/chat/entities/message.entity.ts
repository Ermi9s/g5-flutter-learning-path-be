import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from 'src/user/entities/user.entity';
import { Chat } from './chat.entity';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, required: true, ref: User.name })
  sender: User;

  @Prop({ type: Types.ObjectId, required: true, ref: Chat.name })
  chat: Chat;

  @Prop({ default: 'text' })
  type: string;

  @Prop()
  content: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
