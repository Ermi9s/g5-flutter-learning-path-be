import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User } from 'src/user/entities/user.entity';

import { UserService } from 'src/user/services/user.service';
import { Chat, ChatDocument } from '../entities/chat.entity';
import { InitiateChatDto } from '../dtos/create-chat';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<Chat>,
    private readonly userService: UserService,
  ) {}

  async createOrGet(data: InitiateChatDto, user: any): Promise<ChatDocument> {
    const user2 = (await this.userService.findOne(
      data.userId,
    )) as unknown as any;
    const chats = await this.chatModel.find().populate(['user1', 'user2']);

    const chat = chats.find(
      (c: any) =>
        (c.user1.id === user.id && c.user2.id === user2.id) ||
        (c.user1.id === user2.id && c.user2.id === user.id),
    );

    if (chat) {
      return chat;
    }

    if (!user2) {
      throw new NotFoundException('User not found');
    }

    try {
      return await (
        await this.chatModel.create({
          user1: user,
          user2: user2,
        })
      ).save();
    } catch (e) {
      console.log(e);
    }
  }

  async findAll(user: any): Promise<ChatDocument[]> {
    return (
      await this.chatModel
        .find()
        .populate([
          { path: 'user1', select: '-password' },
          { path: 'user2', select: '-password' },
        ])
        .exec()
    ).filter((c: any) => c.user1.id === user.id || c.user2.id === user.id);
  }

  async findOne(id: string, user: any): Promise<ChatDocument | null> {
    return (
      await this.chatModel
        .find({ _id: id })
        .populate([
          { path: 'user1', select: '-password' },
          { path: 'user2', select: '-password' },
        ])
        .exec()
    ).filter((c: any) => c.user1.id === user.id || c.user2.id === user.id)[0];
  }

  async delete(id: string, user: User): Promise<boolean> {
    const chat = await this.findOne(id, user);

    if (!chat) {
      return false;
    }

    const result = await chat.deleteOne();

    return result.deletedCount > 0;
  }
}
