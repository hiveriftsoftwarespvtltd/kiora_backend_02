import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Coupon } from '../../schemas/coupon.schema';

@Injectable()
export class CouponsService implements OnModuleInit {
  constructor(
    @InjectModel(Coupon.name) private readonly couponModel: Model<Coupon>,
  ) { }

  async onModuleInit() {
    const count = await this.couponModel.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding default coupons...');
      const defaultCoupons = [
        { id: 1, code: 'KIORA10', type: 'percent', value: 10, desc: '10% off your order', minSubtotal: 0, enabled: true },
        { id: 2, code: 'WELCOME20', type: 'percent', value: 20, desc: '20% off for new customers', minSubtotal: 0, enabled: true },
        { id: 3, code: 'FLAT500', type: 'fixed', value: 500, desc: '₹500 off on orders above ₹3,000', minSubtotal: 3000, enabled: true }
      ];
      await this.couponModel.insertMany(defaultCoupons);
      console.log('✅ Coupons seeded successfully.');
    }
  }

  async findAll(): Promise<Coupon[]> {
    return this.couponModel.find().exec();
  }

  async findByCode(code: string): Promise<Coupon | null> {
    return this.couponModel.findOne({ code: code.toUpperCase() }).exec();
  }

  async add(payload: any): Promise<Coupon> {
    const all = await this.couponModel.find().exec();
    const newId = all.reduce((max, c) => c.id > max ? c.id : max, 0) + 1;

    const newCoupon = new this.couponModel({
      ...payload,
      id: newId,
      code: payload.code.toUpperCase(),
      enabled: payload.enabled !== undefined ? Boolean(payload.enabled) : true,
      minSubtotal: payload.minSubtotal !== undefined ? Number(payload.minSubtotal) : 0,
      value: Number(payload.value),
    });

    return newCoupon.save();
  }

  async update(id: number, payload: any): Promise<Coupon | null> {
    const coupon = await this.couponModel.findOne({ id }).exec();
    if (!coupon) return null;

    if (payload.code !== undefined) coupon.code = payload.code.toUpperCase();
    if (payload.type !== undefined) coupon.type = payload.type;
    if (payload.value !== undefined) coupon.value = Number(payload.value);
    if (payload.desc !== undefined) coupon.desc = payload.desc;
    if (payload.minSubtotal !== undefined) coupon.minSubtotal = Number(payload.minSubtotal);
    if (payload.enabled !== undefined) coupon.enabled = Boolean(payload.enabled);

    return coupon.save();
  }

  async delete(id: number): Promise<any> {
    return this.couponModel.deleteOne({ id }).exec();
  }
}
