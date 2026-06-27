import { Controller, Get, Post, Body, Param, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { CouponsService } from './coupons.service';

@Controller('api/coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) { }

  @Get()
  async getAll(@Res() res: Response) {
    try {
      const coupons = await this.couponsService.findAll();
      return res.status(HttpStatus.OK).json(coupons);
    } catch (err) {
      console.error(err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Server error.' });
    }
  }

  @Post('add')
  async addCoupon(@Body() body: any, @Res() res: Response) {
    try {
      if (!body.code || !body.type || body.value === undefined || !body.desc) {
        return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'Missing required coupon details.' });
      }

      // Check if code already exists
      const existing = await this.couponsService.findByCode(body.code);
      if (existing) {
        return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'Coupon code already exists.' });
      }

      const coupon = await this.couponsService.add(body);
      return res.status(HttpStatus.OK).json({ success: true, coupon });
    } catch (err) {
      console.error(err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Server error adding coupon.' });
    }
  }

  @Post(':id/update')
  async updateCoupon(@Param('id') id: string, @Body() body: any, @Res() res: Response) {
    try {
      const updated = await this.couponsService.update(Number(id), body);
      if (!updated) {
        return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Coupon not found.' });
      }
      return res.status(HttpStatus.OK).json({ success: true, coupon: updated });
    } catch (err) {
      console.error(err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Server error updating coupon.' });
    }
  }

  @Post(':id/delete')
  async deleteCoupon(@Param('id') id: string, @Res() res: Response) {
    try {
      await this.couponsService.delete(Number(id));
      return res.status(HttpStatus.OK).json({ success: true, message: 'Coupon deleted.' });
    } catch (err) {
      console.error(err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Server error deleting coupon.' });
    }
  }
}
