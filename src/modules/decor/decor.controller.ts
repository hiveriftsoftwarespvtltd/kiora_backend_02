import { Controller, Get, Post, Body, Param, Res, HttpStatus } from '@nestjs/common';
import { DecorService } from './decor.service';
import type { Response } from 'express';

@Controller('api/decor')
export class DecorController {
  constructor(private readonly decorService: DecorService) {}

  @Get()
  async getAll(@Res() res: Response) {
    try {
      const products = await this.decorService.findAll();
      return res.status(HttpStatus.OK).json(products);
    } catch (err) {
      console.error(err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: err.message });
    }
  }

  @Get('subcategory/:subCategory')
  async getBySubCategory(@Param('subCategory') subCategory: string, @Res() res: Response) {
    try {
      const products = await this.decorService.findAll(subCategory);
      return res.status(HttpStatus.OK).json(products);
    } catch (err) {
      console.error(err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: err.message });
    }
  }

  @Post('add')
  async addProduct(@Body() body: any, @Res() res: Response) {
    try {
      const product = await this.decorService.add(body);
      return res.status(HttpStatus.OK).json({ success: true, product });
    } catch (err) {
      console.error(err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: err.message });
    }
  }

  @Post('update')
  async updateProduct(@Body() body: any, @Res() res: Response) {
    try {
      const product = await this.decorService.update(parseInt(body.id), body);
      if (product) {
        return res.status(HttpStatus.OK).json({ success: true, product });
      }
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ success: false, message: 'Decor product not found' });
    } catch (err) {
      console.error(err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: err.message });
    }
  }

  @Post('delete')
  async deleteProduct(@Body() body: { id: any }, @Res() res: Response) {
    try {
      const product = await this.decorService.delete(parseInt(body.id));
      if (product) {
        return res.status(HttpStatus.OK).json({ success: true });
      }
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ success: false, message: 'Decor product not found' });
    } catch (err) {
      console.error(err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: err.message });
    }
  }
}
