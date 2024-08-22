import { Module } from '@nestjs/common';
import { ProductsService } from './services/products.service';
import { ProductsController } from './controllers/products.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './entities/product.entity';
import { FilesModule } from 'src/files/files.module';
import { GuardedProductsController } from './controllers/products-v2.controller';
import { UserModule } from 'src/user/user.module';
import { GuardedOwnedProductsController } from './controllers/products-v3.controller';
import { OwnedProductsService } from './services/owned-products.service';
import {
  OwnedProduct,
  OwnedProductSchema,
} from './entities/owned-product.entity';

@Module({
  imports: [
    UserModule,
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      {
        name: OwnedProduct.name,
        schema: OwnedProductSchema,
      },
    ]),
    FilesModule,
  ],
  controllers: [
    ProductsController,
    GuardedProductsController,
    GuardedOwnedProductsController,
  ],
  providers: [ProductsService, OwnedProductsService],
})
export class ProductsModule {}
