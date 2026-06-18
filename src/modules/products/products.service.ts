import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../../schemas/product.schema';

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  async onModuleInit() {
    // Migrate existing products to set isNewArrival to match isNew (or fallback to true)
    try {
      const updateResult = await this.productModel.updateMany(
        { isNewArrival: { $exists: false } },
        { $set: { isNewArrival: true } }
      ).exec();
      if (updateResult.modifiedCount > 0) {
        console.log(`🧹 Migrated ${updateResult.modifiedCount} products to use isNewArrival schema field.`);
      }
    } catch (migrationErr) {
      console.error('Migration isNew -> isNewArrival error:', migrationErr);
    }

    // Migrate existing image paths from .png to .webp in MongoDB
    try {
      const productsToUpdate = await this.productModel.find({
        $or: [
          { img: /\.png$/i },
          { imgs: /\.png$/i }
        ]
      }).exec();
      
      let updatedCount = 0;
      for (const prod of productsToUpdate) {
        let changed = false;
        if (prod.img && prod.img.endsWith('.png') && !prod.img.toLowerCase().includes('upload-')) {
          prod.img = prod.img.replace(/\.png$/i, '.webp');
          changed = true;
        }
        if (prod.imgs && prod.imgs.length > 0) {
          const originalImgsStr = JSON.stringify(prod.imgs);
          prod.imgs = prod.imgs.map(img => (img.endsWith('.png') && !img.toLowerCase().includes('upload-')) ? img.replace(/\.png$/i, '.webp') : img);
          if (JSON.stringify(prod.imgs) !== originalImgsStr) {
            changed = true;
          }
        }
        if (changed) {
          await prod.save();
          updatedCount++;
        }
      }
      if (updatedCount > 0) {
        console.log(`🧹 Migrated ${updatedCount} products from .png to .webp image paths.`);
      }
    } catch (migrationErr) {
      console.error('Migration .png -> .webp error:', migrationErr);
    }

    // Migrate old scentFamily strings to new ones
    try {
      const oldToNewMap = {
        'floral': 'floral-powdery-fresh',
        'oriental': 'sweet-spicy-amber',
        'fresh': 'citrus-aquatic-mint',
        'woody': 'woody-amber-clean-spice',
        'fruity': 'fruity-spicy-woody',
        'gourmand': 'warm-spicy-gourmand'
      };
      const allProducts = await this.productModel.find().exec();
      let migratedCount = 0;
      for (const prod of allProducts) {
        if (oldToNewMap[prod.scentFamily]) {
          prod.scentFamily = oldToNewMap[prod.scentFamily];
          await prod.save();
          migratedCount++;
        }
      }
      if (migratedCount > 0) {
        console.log(`🌸 Migrated ${migratedCount} products to new Scent Families.`);
      }
    } catch (scentMigrationErr) {
      console.error('Migration old scentFamily to new error:', scentMigrationErr);
    }

    // Seed default products if empty
    const count = await this.productModel.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding default products into MongoDB...');
      const defaultProducts = [
        {
          id: 1,
          sku: 'KOR-0001',
          name: 'Rose Mystique',
          brand: 'KIORA',
          slug: 'rose-mystique',
          subtitle: 'A timeless floral bouquet',
          category: 'women',
          status: 'active',
          isFeatured: true,
          price: 4999,
          originalPrice: 6500,
          discount: 23,
          sizes: ['30ml', '50ml', '100ml'],
          selectedSize: '50ml',
          variants: [
            { size: '30ml', price: 3499, stock: 20, sku: 'KOR-0001-30' },
            { size: '50ml', price: 4999, stock: 45, sku: 'KOR-0001-50' },
            { size: '100ml', price: 7999, stock: 15, sku: 'KOR-0001-100' }
          ],
          notes: { top: ['Rose', 'Bergamot'], heart: ['Jasmine', 'Iris'], base: ['Sandalwood', 'Musk'] },
          scentFamily: 'floral-powdery-fresh',
          gender: 'women',
          concentration: 'Eau de Parfum',
          rating: 4.8,
          reviews: 124,
          stock: 45,
          isNewArrival: false,
          isBestseller: true,
          img: 'images/prod-rose.webp',
          imgs: ['images/prod-rose.webp', 'images/hero1.webp', 'images/prod-blossom.webp', 'images/hero3.webp'],
          description: '<p>Rose Mystique is an intoxicating floral fragrance that captures the essence of a blooming rose garden at dawn. The fresh bergamot opening gives way to a heart of jasmine and iris, before settling into a warm, sensual base of sandalwood and musk. A fragrance for the modern woman who appreciates timeless elegance.</p>',
          seo: {
            title: 'Rose Mystique - Floral Eau de Parfum | KIORA',
            description: 'Discover Rose Mystique, a timeless floral bouquet by KIORA. Notes of rose, bergamot, jasmine & sandalwood.',
            keywords: ['rose perfume', 'floral perfume', 'women perfume', 'KIORA', 'rose mystique'],
            slug: 'rose-mystique',
            ogImage: 'images/prod-rose.webp'
          }
        },
        {
          id: 2,
          sku: 'KOR-0002',
          name: 'Oud Royale',
          brand: 'KIORA',
          slug: 'oud-royale',
          subtitle: 'Rich, dark, and unmistakably luxurious',
          category: 'men',
          status: 'active',
          isFeatured: true,
          price: 7999,
          originalPrice: 9500,
          discount: 16,
          sizes: ['50ml', '100ml'],
          selectedSize: '50ml',
          variants: [
            { size: '50ml', price: 7999, stock: 20, sku: 'KOR-0002-50' },
            { size: '100ml', price: 13999, stock: 10, sku: 'KOR-0002-100' }
          ],
          notes: { top: ['Saffron', 'Pepper'], heart: ['Oud', 'Rose'], base: ['Amber', 'Vetiver'] },
          scentFamily: 'woody-amber-clean-spice',
          gender: 'men',
          concentration: 'Extrait de Parfum',
          rating: 4.9,
          reviews: 89,
          stock: 20,
          isNewArrival: false,
          isBestseller: true,
          img: 'images/prod-oud.webp',
          imgs: ['images/prod-oud.webp', 'images/hero2.webp', 'images/prod-amber.webp', 'images/prod-ocean.webp'],
          description: '<p>Oud Royale is a statement fragrance for those who command presence. Opening with a bold spark of saffron and black pepper, it transitions into a rich heart of precious oud wood and Turkish rose. The base of aged amber and vetiver creates an unforgettable sillage. This is royalty in a bottle.</p>',
          seo: {
            title: 'Oud Royale - Extrait de Parfum for Men | KIORA',
            description: 'Oud Royale by KIORA — a rich oriental fragrance with saffron, oud, and amber. True luxury in every drop.',
            keywords: ['oud perfume', 'men perfume', 'oriental perfume', 'KIORA', 'oud royale'],
            slug: 'oud-royale',
            ogImage: 'images/prod-oud.webp'
          }
        },
        {
          id: 3,
          sku: 'KOR-0003',
          name: 'Blossom Rain',
          brand: 'KIORA',
          slug: 'blossom-rain',
          subtitle: 'Fresh petals after morning rain',
          category: 'women',
          status: 'active',
          isFeatured: false,
          price: 3499,
          originalPrice: 4200,
          discount: 17,
          sizes: ['30ml', '50ml', '100ml'],
          selectedSize: '50ml',
          variants: [
            { size: '30ml', price: 2299, stock: 30, sku: 'KOR-0003-30' },
            { size: '50ml', price: 3499, stock: 80, sku: 'KOR-0003-50' },
            { size: '100ml', price: 5999, stock: 25, sku: 'KOR-0003-100' }
          ],
          notes: { top: ['Peach', 'Freesia'], heart: ['Peony', 'Lotus'], base: ['White Musk', 'Cedar'] },
          scentFamily: 'fruity-floral-gourmand',
          gender: 'women',
          concentration: 'Eau de Toilette',
          rating: 4.6,
          reviews: 67,
          stock: 80,
          isNewArrival: true,
          isBestseller: false,
          img: 'images/prod-blossom.webp',
          imgs: ['images/prod-blossom.webp', 'images/prod-rose.webp'],
          description: '<p>Blossom Rain evokes the joy of spring rain on flower petals. A light and airy composition that feels like a gentle breeze of floral freshness. Perfect for everyday wear and those who love delicate, feminine scents.</p>',
          seo: {
            title: 'Blossom Rain - Fresh Floral Eau de Toilette | KIORA',
            description: 'Blossom Rain by KIORA — fresh petals after morning rain. Peach, peony, and white musk in a light, airy fragrance.',
            keywords: ['blossom perfume', 'floral women perfume', 'fresh perfume', 'KIORA', 'blossom rain'],
            slug: 'blossom-rain',
            ogImage: 'images/prod-blossom.webp'
          }
        },
        {
          id: 4,
          sku: 'KOR-0004',
          name: 'Noir Absolu',
          brand: 'KIORA',
          slug: 'noir-absolu',
          subtitle: 'Mysterious, sensual, unforgettable',
          category: 'unisex',
          status: 'active',
          isFeatured: true,
          price: 5999,
          originalPrice: 7200,
          discount: 17,
          sizes: ['50ml', '100ml'],
          selectedSize: '50ml',
          variants: [
            { size: '50ml', price: 5999, stock: 35, sku: 'KOR-0004-50' },
            { size: '100ml', price: 9999, stock: 20, sku: 'KOR-0004-100' }
          ],
          notes: { top: ['Black Currant', 'Bergamot'], heart: ['Patchouli', 'Black Rose'], base: ['Dark Amber', 'Vanilla'] },
          scentFamily: 'fruity-smoky-woody',
          gender: 'unisex',
          concentration: 'Eau de Parfum',
          rating: 4.7,
          reviews: 156,
          stock: 35,
          isNewArrival: false,
          isBestseller: true,
          img: 'images/prod-noir.webp',
          imgs: ['images/prod-noir.webp', 'images/hero2.webp'],
          description: '<p>Noir Absolu is a seductive and mysterious fragrance that blurs the line between masculine and feminine. A masterpiece of contrasts — dark and light, sweet and smoky, intimate and powerful. For those who dare to leave an impression.</p>',
          seo: {
            title: 'Noir Absolu - Unisex Oriental Eau de Parfum | KIORA',
            description: 'Noir Absolu by KIORA — mysterious, sensual, and unforgettable. A unisex oriental with black currant, patchouli, and amber.',
            keywords: ['noir perfume', 'unisex perfume', 'oriental scent', 'KIORA', 'noir absolu'],
            slug: 'noir-absolu',
            ogImage: 'images/prod-noir.webp'
          }
        },
        {
          id: 5,
          sku: 'KOR-0005',
          name: 'Ocean Drift',
          brand: 'KIORA',
          slug: 'ocean-drift',
          subtitle: 'Fresh aquatic breeze',
          category: 'men',
          status: 'active',
          isFeatured: false,
          price: 2999,
          originalPrice: 3800,
          discount: 21,
          sizes: ['50ml', '100ml', '150ml'],
          selectedSize: '100ml',
          variants: [
            { size: '50ml', price: 2999, stock: 60, sku: 'KOR-0005-50' },
            { size: '100ml', price: 4999, stock: 120, sku: 'KOR-0005-100' },
            { size: '150ml', price: 6999, stock: 40, sku: 'KOR-0005-150' }
          ],
          notes: { top: ['Sea Salt', 'Lime', 'Grapefruit'], heart: ['Aquatic', 'Driftwood'], base: ['Cedarwood', 'Vetiver'] },
          scentFamily: 'citrus-aquatic-mint',
          gender: 'men',
          concentration: 'Eau de Toilette',
          rating: 4.5,
          reviews: 201,
          stock: 120,
          isNewArrival: false,
          isBestseller: false,
          img: 'images/prod-ocean.webp',
          imgs: ['images/prod-ocean.webp', 'images/prod-oud.webp'],
          description: '<p>Ocean Drift captures the invigorating essence of an open sea voyage. A fresh, clean fragrance that energizes and refreshes from morning to night. Perfect for the adventurous modern man.</p>',
          seo: {
            title: 'Ocean Drift - Fresh Aquatic Eau de Toilette | KIORA',
            description: 'Ocean Drift by KIORA — a fresh aquatic breeze with sea salt, lime, and cedarwood. Energizing all-day freshness.',
            keywords: ['aquatic perfume', 'fresh men perfume', 'ocean perfume', 'KIORA', 'ocean drift'],
            slug: 'ocean-drift',
            ogImage: 'images/prod-ocean.webp'
          }
        },
        {
          id: 6,
          sku: 'KOR-0006',
          name: 'Velvet Oud',
          brand: 'KIORA',
          slug: 'velvet-oud',
          subtitle: 'Warm oriental luxury',
          category: 'unisex',
          status: 'active',
          isFeatured: true,
          price: 8999,
          originalPrice: 11000,
          discount: 18,
          sizes: ['30ml', '50ml'],
          selectedSize: '30ml',
          variants: [
            { size: '30ml', price: 8999, stock: 12, sku: 'KOR-0006-30' },
            { size: '50ml', price: 13999, stock: 8, sku: 'KOR-0006-50' }
          ],
          notes: { top: ['Frankincense', 'Cardamom'], heart: ['Oud', 'Rose', 'Saffron'], base: ['Labdanum', 'Leather'] },
          scentFamily: 'sweet-spicy-amber',
          gender: 'unisex',
          concentration: 'Extrait de Parfum',
          rating: 5.0,
          reviews: 43,
          stock: 12,
          isNewArrival: false,
          isBestseller: true,
          img: 'images/prod-velvet.webp',
          imgs: ['images/prod-velvet.webp', 'images/hero2.webp'],
          description: '<p>Velvet Oud is our most prestigious and exclusive creation. A masterclass in oriental perfumery using only the finest ingredients — frankincense, rare oud, and precious saffron layered over a warm leather base. Reserve yours before it\'s gone.</p>',
          seo: {
            title: 'Velvet Oud - Exclusive Extrait de Parfum | KIORA',
            description: 'Velvet Oud by KIORA — the pinnacle of oriental luxury. Frankincense, oud, saffron, and leather in an exclusive extrait.',
            keywords: ['velvet oud', 'luxury perfume', 'oriental unisex', 'KIORA', 'oud extrait'],
            slug: 'velvet-oud',
            ogImage: 'images/prod-velvet.webp'
          }
        },
        {
          id: 7,
          sku: 'KOR-0007',
          name: 'Citrus Bloom',
          brand: 'KIORA',
          slug: 'citrus-bloom',
          subtitle: 'Zesty freshness all day long',
          category: 'women',
          status: 'active',
          isFeatured: false,
          price: 2499,
          originalPrice: 3200,
          discount: 22,
          sizes: ['30ml', '50ml', '100ml'],
          selectedSize: '50ml',
          variants: [
            { size: '30ml', price: 1699, stock: 50, sku: 'KOR-0007-30' },
            { size: '50ml', price: 2499, stock: 95, sku: 'KOR-0007-50' },
            { size: '100ml', price: 4299, stock: 40, sku: 'KOR-0007-100' }
          ],
          notes: { top: ['Lemon', 'Neroli', 'Yuzu'], heart: ['White Flowers', 'Green Tea'], base: ['Musk', 'Vetiver'] },
          scentFamily: 'citrus-aquatic-mint',
          gender: 'women',
          concentration: 'Eau de Toilette',
          rating: 4.4,
          reviews: 88,
          stock: 95,
          isNewArrival: true,
          isBestseller: false,
          img: 'images/prod-citrus.webp',
          imgs: ['images/prod-citrus.webp'],
          description: '<p>A vibrant, uplifting fragrance that brings the energy of a Mediterranean citrus grove. Light, fresh, and joyful — perfect for warm days and sunny getaways. Citrus Bloom is your everyday burst of happiness.</p>',
          seo: {
            title: 'Citrus Bloom - Fresh Citrus Eau de Toilette | KIORA',
            description: 'Citrus Bloom by KIORA — zesty lemon, neroli, and yuzu with white flowers and musk. Fresh, joyful, all-day wear.',
            keywords: ['citrus perfume', 'fresh women perfume', 'lemon perfume', 'KIORA', 'citrus bloom'],
            slug: 'citrus-bloom',
            ogImage: 'images/prod-citrus.webp'
          }
        },
        {
          id: 8,
          sku: 'KOR-0008',
          name: 'Amber Elixir',
          brand: 'KIORA',
          slug: 'amber-elixir',
          subtitle: 'Warm, resinous, and captivating',
          category: 'men',
          status: 'active',
          isFeatured: false,
          price: 5499,
          originalPrice: 6800,
          discount: 19,
          sizes: ['50ml', '100ml'],
          selectedSize: '100ml',
          variants: [
            { size: '50ml', price: 5499, stock: 30, sku: 'KOR-0008-50' },
            { size: '100ml', price: 8999, stock: 60, sku: 'KOR-0008-100' }
          ],
          notes: { top: ['Orange', 'Cinnamon'], heart: ['Amber', 'Benzoin', 'Labdanum'], base: ['Tonka Bean', 'Vanilla'] },
          scentFamily: 'warm-spicy-gourmand',
          gender: 'men',
          concentration: 'Eau de Parfum',
          rating: 4.6,
          reviews: 112,
          stock: 60,
          isNewArrival: false,
          isBestseller: false,
          img: 'images/prod-amber.webp',
          imgs: ['images/prod-amber.webp'],
          description: '<p>Amber Elixir is a rich, enveloping fragrance built around a luminous amber accord. Sweet, warm, and deeply comforting — like a cashmere blanket on a winter evening. Notes of orange and cinnamon add a spicy brightness to this oriental masterpiece.</p>',
          seo: {
            title: 'Amber Elixir - Warm Oriental Eau de Parfum | KIORA',
            description: 'Amber Elixir by KIORA — warm, resinous, and captivating. Orange, amber, and tonka bean in a rich oriental EDP.',
            keywords: ['amber perfume', 'oriental men perfume', 'warm perfume', 'KIORA', 'amber elixir'],
            slug: 'amber-elixir',
            ogImage: 'images/prod-amber.webp'
          }
        }
      ];

      await this.productModel.insertMany(defaultProducts);
      console.log('✅ Seeded default products successfully.');
    }
  }

  async findAll(): Promise<Product[]> {
    return this.productModel.find().exec();
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return this.productModel.findOne({ slug }).exec();
  }

  async add(payload: any): Promise<Product> {
    const products = await this.findAll();
    const newId = products.reduce((max, p) => p.id > max ? p.id : max, 0) + 1;
    const slug = (payload.name || 'new-fragrance')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const price = parseInt(payload.price) || 2999;
    const originalPrice = payload.originalPrice ? parseInt(payload.originalPrice) : null;
    const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

    let notes = payload.notes || { top: ['Fresh Notes'], heart: ['Floral Notes'], base: ['Amber Notes'] };
    if (notes && !Array.isArray(notes.top)) {
      notes = {
        top: typeof notes.top === 'string' ? notes.top.split(',').map((s: string) => s.trim()) : ['Fresh Notes'],
        heart: typeof notes.heart === 'string' ? notes.heart.split(',').map((s: string) => s.trim()) : ['Floral Notes'],
        base: typeof notes.base === 'string' ? notes.base.split(',').map((s: string) => s.trim()) : ['Amber Notes'],
      };
    }

    const sizeList = payload.sizes || ['50ml', '100ml'];
    const variants = Array.isArray(payload.variants) && payload.variants.length > 0
      ? payload.variants
      : sizeList.map((size: string) => ({
          size,
          price,
          stock: Math.floor((parseInt(payload.stock) || 50) / sizeList.length),
          sku: `KOR-${String(newId).padStart(4, '0')}-${size.replace('ml', '')}`
        }));

    const newProduct = new this.productModel({
      ...payload,
      id: newId,
      sku: payload.sku || `KOR-${String(newId).padStart(4, '0')}`,
      slug,
      price,
      originalPrice,
      discount,
      sizes: sizeList,
      selectedSize: sizeList[0],
      variants,
      notes,
      rating: 5.0,
      reviews: 0,
      stock: parseInt(payload.stock) || 50,
      isNewArrival: true,
      seo: payload.seo || {
        title: `${payload.name || 'New Fragrance'} | KIORA`,
        description: payload.subtitle || 'Premium KIORA fragrance',
        keywords: [slug, 'KIORA', 'perfume'],
        slug,
        ogImage: payload.img || 'images/prod-rose.webp'
      }
    });

    return newProduct.save();
  }

  async update(id: number, payload: any): Promise<Product | null> {
    console.log('--- PRODUCTS SERVICE UPDATE START ---');
    console.log('Update Product ID:', id);
    console.log('Incoming payload:', JSON.stringify(payload, null, 2));

    const originalPrice = payload.originalPrice ? parseInt(payload.originalPrice) : null;
    let discount = 0;
    if (originalPrice && payload.price) {
      discount = Math.round(((originalPrice - parseInt(payload.price)) / originalPrice) * 100);
    }

    let notes = payload.notes;
    if (notes && !Array.isArray(notes.top)) {
      notes = {
        top: typeof notes.top === 'string' ? notes.top.split(',').map((s: string) => s.trim()) : notes.top,
        heart: typeof notes.heart === 'string' ? notes.heart.split(',').map((s: string) => s.trim()) : notes.heart,
        base: typeof notes.base === 'string' ? notes.base.split(',').map((s: string) => s.trim()) : notes.base,
      };
    }

    const updateData: any = {
      ...payload,
      price: payload.price ? parseInt(payload.price) : undefined,
      originalPrice,
      stock: payload.stock !== undefined ? parseInt(payload.stock) : undefined,
    };

    if (originalPrice && payload.price) {
      updateData.discount = discount;
    }
    if (notes) {
      updateData.notes = notes;
    }

    console.log('Final updateData object to be sent to Mongo:', JSON.stringify(updateData, null, 2));

    const updatedDoc = await this.productModel.findOneAndUpdate({ id }, { $set: updateData }, { new: true }).exec();
    console.log('Returned document from DB after update:', updatedDoc ? JSON.stringify({
      id: updatedDoc.id,
      name: updatedDoc.name,
      isBestseller: updatedDoc.isBestseller,
      isNewArrival: updatedDoc.isNewArrival,
      isFeatured: updatedDoc.isFeatured
    }, null, 2) : 'null');
    console.log('--- PRODUCTS SERVICE UPDATE END ---');

    return updatedDoc;
  }

  async delete(id: number): Promise<any> {
    return this.productModel.findOneAndDelete({ id }).exec();
  }
}
