import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '../../schemas/category.schema';
import { Product } from '../../schemas/product.schema';
import { DecorProduct } from '../../schemas/decor-product.schema';

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(DecorProduct.name) private readonly decorModel: Model<DecorProduct>,
  ) { }

  async onModuleInit() {
    console.log('🌱 Re-seeding categories to set the 5 requested collections...');
    await this.categoryModel.deleteMany({});
    const defaultCategories = [
      { id: 1, name: "Women's Perfume", slug: 'women', img: 'images/prod-rose.png', enabled: true, count: 0 },
      { id: 2, name: "Men's Perfume", slug: 'men', img: 'images/prod-oud.png', enabled: true, count: 0 },
      { id: 3, name: 'Bags', slug: 'bags', img: 'images/kioradesgin.png', enabled: true, count: 0 },
      { id: 4, name: 'Candles', slug: 'candles', img: 'images/Bannerere.png', enabled: true, count: 0 },
      { id: 5, name: 'Tabletop', slug: 'tabletop', img: 'images/kioradesign2.png', enabled: true, count: 0 }
    ];
    await this.categoryModel.insertMany(defaultCategories);
    console.log('✅ Categories successfully seeded.');
  }

  async findAll(): Promise<any[]> {
    const categories = await this.categoryModel.find().exec();
    
    // Calculate counts dynamically
    const results = await Promise.all(
      categories.map(async (cat) => {
        const catObj = cat.toObject();
        const slug = catObj.slug;
        
        let count = 0;
        if (slug === 'women' || slug === 'men') {
          count = await this.productModel.countDocuments({ category: slug });
        } else {
          const dbSubCategory = slug === 'tabletop' ? 'table-decor' : slug;
          count = await this.decorModel.countDocuments({ subCategory: dbSubCategory });
        }
        
        catObj.count = count;
        return catObj;
      })
    );
    
    return results;
  }

  async add(payload: any): Promise<Category> {
    const categories = await this.findAll();
    const newId = categories.reduce((max, c) => c.id > max ? c.id : max, 0) + 1;
    const slug = (payload.name || 'category')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newCategory = new this.categoryModel({
      ...payload,
      id: newId,
      slug,
      enabled: payload.enabled !== undefined ? Boolean(payload.enabled) : true,
      count: payload.count !== undefined ? parseInt(payload.count) : 0,
    });

    return newCategory.save();
  }

  async toggle(id: number): Promise<Category | null> {
    const category = await this.categoryModel.findOne({ id }).exec();
    if (!category) return null;
    category.enabled = !category.enabled;
    return category.save();
  }

  async update(id: number, payload: any): Promise<Category | null> {
    const category = await this.categoryModel.findOne({ id }).exec();
    if (!category) return null;

    if (payload.name !== undefined) {
      category.name = payload.name;
      category.slug = payload.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    if (payload.img !== undefined) category.img = payload.img;
    if (payload.enabled !== undefined) category.enabled = Boolean(payload.enabled);
    if (payload.count !== undefined) category.count = Number(payload.count);

    return category.save();
  }

  async delete(id: number): Promise<any> {
    return this.categoryModel.deleteOne({ id }).exec();
  }
}

