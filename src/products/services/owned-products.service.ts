import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateProductDto } from '../dtos/create-product.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FilesService } from 'src/files/files.service';
import {
  OwnedProduct,
  OwnedProductDocument,
} from '../entities/owned-product.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class OwnedProductsService {
  constructor(
    @InjectModel(OwnedProduct.name) private productModel: Model<OwnedProduct>,
    private readonly fileService: FilesService,
  ) {}

  async create(
    data: CreateProductDto,
    owner: User,
    image: Express.Multer.File,
  ): Promise<OwnedProductDocument> {
    try {
      const { imageUrl, assetExternalId } =
        await this.fileService.uploadImage(image);

      return await (
        await this.productModel.create({
          ...data,
          seller: owner,
          imageUrl,
          externalImageId: assetExternalId,
        })
      ).save();
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException();
    }
  }

  async findAll(): Promise<OwnedProductDocument[]> {
    return await this.productModel
      .find()
      .populate({ path: 'seller', select: '-password' })
      .exec();
  }

  async findOne(id: string): Promise<OwnedProductDocument | null> {
    return await this.productModel
      .findOne({ _id: id })
      .populate({ path: 'seller', select: '-password' })
      .exec();
  }

  async update(
    id: string,
    data: UpdateProductDto,
    image: Express.Multer.File | null,
    owner: User,
  ) {
    if (image) {
      const product = await this.findOne(id);

      if (
        !product &&
        (product.seller as unknown as any)._id !== (owner as unknown as any)._id
      ) {
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
      const product = await this.findOne(id);

      if (!product) {
        return null;
      }

      if (
        (product.seller as unknown as any).id !== (owner as unknown as any).id
      ) {
        throw new UnauthorizedException();
      }

      const result = await this.productModel
        .updateOne({ _id: id }, data)
        .exec();

      if (result.matchedCount > 0) {
        return await this.productModel.findOne({ _id: id }).exec();
      }
    }
  }

  async delete(id: string, owner: User): Promise<boolean> {
    const product = await this.findOne(id);

    if (!product) {
      return false;
    }

    if (
      (product.seller as unknown as any).id !== (owner as unknown as any).id
    ) {
      throw new UnauthorizedException();
    }

    if (!product) {
      return false;
    }

    const imageId = product.externalImageId;

    await this.fileService.deleteAssets([imageId]);

    const result = await this.productModel.deleteOne({ _id: id }).exec();

    return result.deletedCount > 0;
  }
}
