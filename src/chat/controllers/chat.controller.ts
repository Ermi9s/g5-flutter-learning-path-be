import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  NotFoundException,
  UseGuards,
  Req,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChatService } from '../services/chat.service';
import { InitiateChatDto } from '../dtos/create-chat';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('chats-v3')
@Controller({ version: '3', path: 'chats' })
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async create(@Body() createChatDto: InitiateChatDto, @Req() req: Request) {
    const chat = await this.chatService.createOrGet(
      createChatDto,
      (req as unknown as any).user,
    );

    chat.user1.password = undefined;
    chat.user2.password = undefined;

    return chat;
  }

  @Get()
  async findAll(@Req() req: Request) {
    return await this.chatService.findAll((req as unknown as any).user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const chat = await this.chatService.findOne(
      id,
      (req as unknown as any).user,
    );

    if (chat) {
      return chat;
    }

    throw new NotFoundException('Chat not found');
  }

  @Get(':id/messages')
  async findAllMessages(@Param('id') id: string, @Req() req: Request) {
    const chat = await this.chatService.findAllChatMessages(
      id,
      (req as unknown as any).user,
    );

    if (chat) {
      return chat;
    }

    throw new NotFoundException('Chat not found');
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: Request) {
    if (!(await this.chatService.delete(id, (req as unknown as any).user))) {
      throw new NotFoundException('Chat not found');
    }
  }
}
