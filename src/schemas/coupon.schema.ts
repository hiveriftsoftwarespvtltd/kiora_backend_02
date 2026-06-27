import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Coupon extends Document {
  @Prop({ required: true, unique: true })
  id: number;

  @Prop({ required: true, unique: true, uppercase: true })
  code: string;

  @Prop({ required: true, enum: ['percent', 'fixed'] })
  type: string;

  @Prop({ required: true })
  value: number;

  @Prop({ required: true })
  desc: string;

  @Prop({ default: 0 })
  minSubtotal: number;

  @Prop({ default: true })
  enabled: boolean;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
