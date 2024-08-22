import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { UserModule } from 'src/user/user.module';
import { Chat, ChatSchema } from './entities/chat.entity';
import { User, UserSchema } from 'src/user/entities/user.entity';
import { ChatController } from './controllers/chat.controller';
import { ChatService } from './services/chat.service';
import { ChatGateway } from './controllers/chat.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { Message, MessageSchema } from './entities/message.entity';

@Module({
  imports: [
    UserModule,
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema },
      { name: Message.name, schema: MessageSchema },
      { name: User.name, schema: UserSchema },
    ]),

    AuthModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
})
export class ChatModule {}
