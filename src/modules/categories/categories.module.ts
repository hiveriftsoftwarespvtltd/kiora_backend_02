import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { Category, CategorySchema } from '../../schemas/category.schema';
import { Product, ProductSchema } from '../../schemas/product.schema';
import { DecorProduct, DecorProductSchema } from '../../schemas/decor-product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
      { name: DecorProduct.name, schema: DecorProductSchema }
    ]),
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
