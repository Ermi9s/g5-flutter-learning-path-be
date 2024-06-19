import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateProductDto } from '../dtos/create-product.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../entities/product.entity';
import { FilesService } from 'src/files/files.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    private readonly fileService: FilesService,
  ) {}

  async create(
    data: CreateProductDto,
    image: Express.Multer.File,
  ): Promise<ProductDocument> {
    try {
      const { imageUrl, assetExternalId } =
        await this.fileService.uploadImage(image);

      return await (
        await this.productModel.create({
          ...data,
          imageUrl,
          externalImageId: assetExternalId,
        })
      ).save();
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException();
    }
  }

  async findAll(): Promise<ProductDocument[]> {
    return await this.productModel.find().exec();
  }

  async findOne(id: string): Promise<ProductDocument | null> {
    return await this.productModel.findOne({ _id: id }).exec();
  }

  async update(
    id: string,
    data: UpdateProductDto,
    image: Express.Multer.File | null,
  ) {
    if (image) {
      const product = await this.findOne(id);

      if (!product) {
        return null;
      }

      const imageId = product.externalImageId;
      const { imageUrl, assetExternalId } =
        await this.fileService.uploadImage(image);

      data.imageUrl = imageUrl;

      await this.fileService.deleteAssets([imageId]);

      const result = await this.productModel
        .updateOne({ _id: id }, { ...data, externalImageId: assetExternalId })
        .exec();

      if (result.modifiedCount > 0) {
        return await this.productModel.findOne({ _id: id }).exec();
      }
    } else {
      const result = await this.productModel
        .updateOne({ _id: id }, data)
        .exec();

      if (result.matchedCount > 0) {
        return await this.productModel.findOne({ _id: id }).exec();
      }
    }
  }

  async delete(id: string) {
    const product = await this.findOne(id);

    if (!product) {
      return false;
    }

    const imageId = product.externalImageId;

    await this.fileService.deleteAssets([imageId]);

    const result = await this.productModel.deleteOne({ _id: id }).exec();

    return result.deletedCount > 0;
  }
}
