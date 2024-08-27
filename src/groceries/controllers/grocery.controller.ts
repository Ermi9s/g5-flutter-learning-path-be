import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { GroceryService } from '../services/grocery.service';

@ApiTags('groceries')
@Controller('groceries')
export class GroceryController {
  constructor(private readonly groceryService: GroceryService) {}

  @Get()
  async getAll() {
    const groceries = await this.groceryService.findAll();

    return groceries.map((grocery: any) => {
      grocery.options = grocery.options.map((option: any) => ({
        id: option.id,
        name: option.name,
        price: option.price,
      }));

      return {
        id: grocery.id,
        title: grocery.title,
        imageUrl: grocery.imageUrl,
        rating: grocery.rating,
        price: grocery.price,
        discount: grocery.discount,
        description: grocery.description,
        options: grocery.options,
      };
    });
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const grocery: any = await this.groceryService.findOne(id);
    if (!grocery) {
      throw new NotFoundException('Grocery not found');
    }
    return {
      id: grocery.id,
      title: grocery.title,
      imageUrl: grocery.imageUrl,
      rating: grocery.rating,
      price: grocery.price,
      discount: grocery.discount,
      description: grocery.description,
      options: grocery.options.map((option: any) => ({
        id: option.id,
        name: option.name,
        price: option.price,
      })),
    };
  }
}
