import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User } from '../entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}
  async create(data: any): Promise<User> {
    return await this.userModel.create(data);
  }

  async findAll(isDeleted: boolean = false): Promise<User[]> {
    try {
      return await this.userModel.find({ isDeleted }).exec();
    } catch (e) {
      console.log(e);
    }
    return [];
  }

  async findOne(id: string, isDeleted: boolean = false): Promise<User | null> {
    try {
      return await this.userModel
        .findOne({ _id: id, isDeleted })

        .exec();
    } catch (e) {
      console.log(e);
    }
    return null;
  }

  async update(id: string, data: any) {
    return await this.userModel
      .updateOne({ _id: id, isDeleted: false }, data)
      .exec();
  }

  async delete(id: string) {
    return await this.userModel
      .updateOne({ _id: id, isDeleted: false }, { isDeleted: true })
      .exec();
  }
}
