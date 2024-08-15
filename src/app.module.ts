import { Module } from '@nestjs/common';

import { ProductsModule } from './products/products.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';

import { ChatModule } from './chat/chat.module';

import { GroceriesModule } from './groceries/groceries.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),

    ProductsModule,
    UserModule,
    AuthModule,

    ChatModule,

    GroceriesModule,

  ],
})
export class AppModule {}
