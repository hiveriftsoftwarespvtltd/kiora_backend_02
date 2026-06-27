import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DecorProduct } from '../../schemas/decor-product.schema';

@Injectable()
export class DecorService {
  constructor(
    @InjectModel(DecorProduct.name)
    private readonly decorModel: Model<DecorProduct>,
  ) {}

  async findAll(subCategory?: string): Promise<DecorProduct[]> {
    const filter = subCategory ? { subCategory } : {};
    return this.decorModel.find(filter).sort({ updatedAt: -1 }).exec();
  }

  async findById(id: number): Promise<DecorProduct | null> {
    return this.decorModel.findOne({ id }).exec();
  }

  async add(payload: any): Promise<DecorProduct> {
    const all = await this.decorModel.find().exec();
    const newId = all.reduce((max, p) => (p.id > max ? p.id : max), 0) + 1;

    const slug = (payload.name || 'product')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Calculate discount if both prices provided
    let discount = 0;
    if (payload.originalPrice && payload.price) {
      discount = Math.round(
        ((payload.originalPrice - payload.price) / payload.originalPrice) * 100,
      );
    }

    const product = new this.decorModel({
      ...payload,
      id: newId,
      slug: `${slug}-${newId}`,
      discount,
      price: parseFloat(payload.price) || 0,
      originalPrice: payload.originalPrice
        ? parseFloat(payload.originalPrice)
        : null,
      stock: parseInt(payload.stock) || 0,
    });

    return product.save();
  }

  async update(id: number, payload: any): Promise<DecorProduct | null> {
    let discount = payload.discount || 0;
    if (payload.originalPrice && payload.price) {
      discount = Math.round(
        ((payload.originalPrice - payload.price) / payload.originalPrice) * 100,
      );
    }

    return this.decorModel
      .findOneAndUpdate(
        { id },
        {
          ...payload,
          discount,
          price: parseFloat(payload.price) || 0,
          originalPrice: payload.originalPrice
            ? parseFloat(payload.originalPrice)
            : null,
          stock: parseInt(payload.stock) || 0,
        },
        { new: true },
      )
      .exec();
  }

  async delete(id: number): Promise<DecorProduct | null> {
    return this.decorModel.findOneAndDelete({ id }).exec();
  }
}
