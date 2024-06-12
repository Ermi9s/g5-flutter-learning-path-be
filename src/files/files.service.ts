import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import * as cloudinary from 'cloudinary';
import * as sharp from 'sharp';

export interface UploadResult {
  imageUrl: string;
  assetExternalId: string;
}

@Injectable()
export class FilesService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.v2.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async deleteAssets(assetExternalIds: string[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      cloudinary.v2.api.delete_resources(
        assetExternalIds,
        (err: any, result: any) => {
          console.log('Cloudinary delete result:', result, assetExternalIds);
          if (err) {
            console.error('Cloudinary delete error:', err);
            reject('Cloudinary delete error');
          }
          if (!result) {
            console.error('Cloudinary delete error: Result is undefined');
            reject('Cloudinary delete error: Result is undefined');
          }

          resolve();
        },
      );
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<UploadResult> {
    const resizedBuffer: Buffer = await sharp(file.buffer)
      .resize({ width: 800, height: 600 })
      .toBuffer();

    return new Promise<UploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: this.configService.get('CLOUDINARY_FOLDER'),
        } as any,
        (
          err: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (err) {
            console.error('Cloudinary upload error:', err);
            reject('Cloudinary upload error');
          }
          if (!result) {
            console.error('Cloudinary upload error: Result is undefined');
            reject('Cloudinary upload error: Result is undefined');
          }

          resolve({
            imageUrl: result.secure_url,
            assetExternalId: result.public_id,
          });
        },
      );
      uploadStream.end(resizedBuffer);
    });
  }
}
