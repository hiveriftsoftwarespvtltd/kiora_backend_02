import { Controller, Get, Post, Body, Res, HttpStatus, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import type { Response } from 'express';

@Controller('api/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Get()
  async getAll(@Res() res: Response) {
    const categories = await this.categoriesService.findAll();
    return res.status(HttpStatus.OK).json(categories);
  }

  @Post('add')
  async addCategory(@Body() body: any, @Res() res: Response) {
    try {
      const category = await this.categoriesService.add(body);
      return res.status(HttpStatus.OK).json({ success: true, category });
    } catch (err) {
      console.error(err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
  }

  @Post(':id/toggle')
  async toggleCategory(@Param('id') id: string, @Res() res: Response) {
    try {
      const category = await this.categoriesService.toggle(Number(id));
      if (!category) {
        return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Category not found' });
      }
      return res.status(HttpStatus.OK).json({ success: true, category });
    } catch (err) {
      console.error(err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
  }

  @Post(':id/update')
  async updateCategory(@Param('id') id: string, @Body() body: any, @Res() res: Response) {
    try {
      const category = await this.categoriesService.update(Number(id), body);
      if (!category) {
        return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Category not found' });
      }
      return res.status(HttpStatus.OK).json({ success: true, category });
    } catch (err) {
      console.error(err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
  }

  @Post(':id/delete')
  async deleteCategory(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.categoriesService.delete(Number(id));
      return res.status(HttpStatus.OK).json({ success: true, result });
    } catch (err) {
      console.error(err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
  }
}
