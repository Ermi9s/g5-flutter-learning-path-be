import { Module } from '@nestjs/common';
import { ProductsService } from './services/products.service';
import { ProductsController } from './controllers/products.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './entities/product.entity';
import { FilesModule } from 'src/files/files.module';
import { GuardedProductsController } from './controllers/products-v2.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    FilesModule,
  ],
  controllers: [ProductsController, GuardedProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
