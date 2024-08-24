import {
  WebSocketGateway,
  OnGatewayConnection,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

import { ChatService } from '../services/chat.service';
import { UnauthorizedException } from '@nestjs/common';
import { SendMessage } from '../dtos/send-message';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  private server: Socket;

  constructor(private readonly chatService: ChatService) { }

  handleConnection(socket: Socket): void {
    this.chatService.handleConnection(socket);
  }

  @SubscribeMessage('message:send')
  async handleEvent(
    @MessageBody() message: SendMessage,
    @ConnectedSocket() socket: Socket,
  ): Promise<void> {
    const user = await this.chatService.authenticateSocket(socket);

    if (!user) throw new UnauthorizedException('User not found');
    const createdMessage = await this.chatService.sendMessage(user, message);
    socket.emit('message:delivered', createdMessage);
  }

  @SubscribeMessage('chat:join')
  async handleChatJoin(
    @MessageBody() data: { chatId: string },
    @ConnectedSocket() socket: Socket,
  ): Promise<void> {
    const user = await this.chatService.authenticateSocket(socket);

    if (!user) throw new UnauthorizedException('User not found');
  }
}
