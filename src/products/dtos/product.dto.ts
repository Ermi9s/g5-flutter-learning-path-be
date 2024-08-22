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
  price: number;

  @ApiProperty()
  imageUrl: string;

  @ApiProperty()
  seller?: any;

  constructor(partial: ProductDocument) {
    this.id = partial.id;
    this.name = partial.name;
    this.description = partial.description;
    this.price = +partial.price;
    this.imageUrl = partial.imageUrl;
    if ((partial as unknown as any).seller) {
      this.seller = (partial as unknown as any).seller;
    }
  }
}
