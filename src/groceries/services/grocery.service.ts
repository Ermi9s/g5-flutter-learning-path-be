import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Grocery } from '../entities/grocery.entity';

@Injectable()
export class GroceryService {
  constructor(
    @InjectModel(Grocery.name) private readonly groceryModel: Model<Grocery>,
  ) {}
  async create(data: any): Promise<Grocery> {
    return await this.groceryModel.create(data);
  }

  async findAll(): Promise<Grocery[]> {
    try {
      return await this.groceryModel.find().populate(['options']).exec();
    } catch (e) {
      console.log(e);
    }
    return [];
  }

  async findOne(id: string): Promise<Grocery | null> {
    try {
      return await this.groceryModel
        .findOne({ _id: id })
        .populate(['options'])
        .exec();
    } catch (e) {
      console.log(e);
    }
    return null;
  }

  async update(id: string, data: any) {
    return await this.groceryModel.updateOne({ _id: id }, data).exec();
  }

  async delete(id: string) {
    return await this.groceryModel
      .updateOne({ _id: id }, { isDeleted: true })
      .exec();
  }
}
