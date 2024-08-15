import { Module } from '@nestjs/common';
import { GroceryService } from './services/grocery.service';
import { GroceryController } from './controllers/grocery.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Grocery, GrocerySchema } from './entities/grocery.entity';
import { Option, OptionSchema } from './entities/option.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Grocery.name, schema: GrocerySchema },
      { name: Option.name, schema: OptionSchema },
    ]),
  ],
  controllers: [GroceryController],
  providers: [GroceryService],
})
export class GroceriesModule {}
