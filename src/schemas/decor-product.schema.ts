import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class DecorProduct extends Document {
  @Prop({ required: true })
  id: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  // 'bags' | 'table-decor' | 'candles'
  @Prop({ required: true })
  subCategory: string;

  // ── Common fields ──
  @Prop({ default: '' })
  subtitle: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: null })
  originalPrice: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ required: true })
  stock: number;

  @Prop({ default: 'active' })
  status: string;

  @Prop({ default: '' })
  img: string;

  @Prop({ type: [String], default: [] })
  imgs: string[];

  @Prop({ default: '' })
  description: string;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: true })
  isNewArrival: boolean;

  @Prop({ default: false })
  isBestseller: boolean;

  // ── Bags specific ──
  @Prop({ default: '' })
  bagSubType: string; // 'canvas' | 'jute' | 'raffia'

  @Prop({ default: '' })
  size: string; // e.g. '10" X 11" X 4"'

  @Prop({ default: '' })
  material: string; // e.g. 'Printed Canvas & PU'

  @Prop({ default: '' })
  lining: string; // e.g. 'Polyester'

  @Prop({ default: '' })
  styleNo: string; // used for both bags & table decor

  // ── Table Decor specific ──
  @Prop({ default: '' })
  decorType: string; // 'pen-holder' | 'tray' | 'tissue-holder'

  // ── Candles specific ──
  @Prop({ default: '' })
  candleType: string; // 'jar' | 'pillar' | 'tealight'

  @Prop({ default: '' })
  scent: string;

  @Prop({ default: '' })
  burnTime: string;

  @Prop({ default: '' })
  waxType: string;
}

export const DecorProductSchema = SchemaFactory.createForClass(DecorProduct);
