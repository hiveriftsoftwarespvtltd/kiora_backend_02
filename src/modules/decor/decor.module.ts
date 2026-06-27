import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DecorController } from './decor.controller';
import { DecorService } from './decor.service';
import { DecorProduct, DecorProductSchema } from '../../schemas/decor-product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: DecorProduct.name, schema: DecorProductSchema }]),
  ],
  controllers: [DecorController],
  providers: [DecorService],
  exports: [DecorService],
})
export class DecorModule {}
