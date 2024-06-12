import { ApiProperty } from '@nestjs/swagger';
import { ProductDocument } from '../entities/product.entity';

export class ProductDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  price: string;

  @ApiProperty()
  imageUrl: string;

  constructor(partial: ProductDocument) {
    this.id = partial.id;
    this.name = partial.name;
    this.description = partial.description;
    this.price = partial.price;
    this.imageUrl = partial.imageUrl;
  }
}
