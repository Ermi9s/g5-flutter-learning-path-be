import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Put,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CreateProductDto } from '../dtos/create-product.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { ProductDto } from '../dtos/product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OwnedProductsService } from '../services/owned-products.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('products-v3')
@Controller({ version: '3', path: 'products' })
export class GuardedOwnedProductsController {
  constructor(private readonly productsService: OwnedProductsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createProductDto: CreateProductDto,
    @Req() req: Request,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 10 * 1024 * 1024,
          }),
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return new ProductDto(
      await this.productsService.create(
        createProductDto,
        (req as unknown as any).user,
        file,
      ),
    );
  }

  @Get()
  async findAll() {
    const products = await this.productsService.findAll();
    return products.map((product) => new ProductDto(product));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const product = await this.productsService.findOne(id);
    if (product) {
      return new ProductDto(product);
    }
    throw new NotFoundException('Product not found');
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Req() req: Request,
  ) {
    const product = await this.productsService.update(
      id,
      updateProductDto,
      null,
      (req as unknown as any).user,
    );
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return new ProductDto(product);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: Request) {
    if (
      !(await this.productsService.delete(id, (req as unknown as any).user))
    ) {
      throw new NotFoundException('Product not found');
    }
  }
}
