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

  async findAll(): Promise<User[]> {
    try {
      return await this.userModel.find().select('-password').exec();;
    } catch (e) {
      console.log(e);
    }
    return [];
  }

  async findOne(id: string): Promise<User | null> {
    try {
      return await this.userModel
        .findOne({ _id: id })

        .select('-password').exec();
    } catch (e) {
      console.log(e);
    }
    return null;
  }

  async update(id: string, data: any) {
    return await this.userModel.updateOne({ _id: id }, data).exec();
  }

  async delete(id: string) {
    return await this.userModel
      .updateOne({ _id: id }, { isDeleted: true })
      .exec();
  }
}
