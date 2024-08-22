import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User } from 'src/user/entities/user.entity';

import { UserService } from 'src/user/services/user.service';
import { Chat, ChatDocument } from '../entities/chat.entity';
import { InitiateChatDto } from '../dtos/create-chat';
import { Socket } from 'socket.io';
import { Message } from '../entities/message.entity';
import { SendMessage } from '../dtos/send-message';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ChatService {
  private readonly connectedClients: Map<string, Socket> = new Map();

  constructor(
    @InjectModel(Chat.name) private chatModel: Model<Chat>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  handleConnection(socket: Socket): void {
    const clientId = socket.id;
    this.connectedClients.set(clientId, socket);

    socket.on('disconnect', () => {
      this.connectedClients.delete(clientId);
    });
  }

  async findAllChatMessages(chatId: string, user: any): Promise<Message[]> {
    const chat = await this.findOne(chatId, user);

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return await this.messageModel
      .find({ chat })
      .populate([
        {
          path: 'sender',
          select: '-password',
        },
        {
          path: 'chat',
          populate: [
            {
              path: 'user1',
              select: '-password',
            },
            {
              path: 'user2',
              select: '-password',
            },
          ],
        },
      ])
      .exec();
  }

  async sendMessage(sender: any, messageData: SendMessage) {
    const chat = (await this.findOne(messageData.chatId, sender)) as any;

    const message = await (
      await this.messageModel.create({
        chat,
        sender,
        content: messageData.content,
      })
    ).save();

    message.sender.password = undefined;

    const receiver = chat.user1.id === sender.id ? chat.user2 : chat.user1;

    for (const receiverSocket of this.connectedClients.values()) {
      const user = (await this.authenticateSocket(receiverSocket)) as any;

      if (user.id === receiver.id) {
        receiverSocket.emit('message:received', message);
        break;
      }
    }

    return message;
  }

  async authenticateSocket(socket: Socket): Promise<User> {
    const token = this.extractJwtToken(socket);
    const user: any = this.jwtService.verify<User>(token, {
      secret: process.env.JWT_SECRET,
    });
    return await this.userService.findOne(user.sub);
  }

  extractJwtToken(socket: Socket): string {
    const authHeader = socket.handshake.headers.authorization;

    if (!authHeader)
      throw new UnauthorizedException('No authorization header found');

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token)
      throw new UnauthorizedException('Invalid or missing token');

    return token;
  }

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
