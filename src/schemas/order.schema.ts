import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ required: true, unique: true })
  id: string; // custom ID e.g. KOR-2401

  @Prop({ default: '' })
  customerId: string; // customer user ID reference

  @Prop({ required: true })
  customer: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  items: number;

  @Prop({ type: [Object], default: [] })
  itemsDetails: any[];

  @Prop({ required: true })
  total: number;

  @Prop({ default: 'pending' })
  status: string; // pending, processing, shipped, delivered, cancelled

  @Prop({ default: 'pending' })
  payment: string; // pending, paid, refunded

  @Prop({ default: '' })
  city: string;

  @Prop({ default: '' })
  address: string; // legacy full address string fallback

  @Prop({ type: Object, default: null })
  shippingAddress: any; // complete shipping address details with ID

  @Prop({ type: Object, default: null })
  billingAddress: any; // complete billing address details with ID

  @Prop({ default: '' })
  razorpayOrderId: string;

  @Prop({ default: '' })
  razorpayPaymentId: string;

  @Prop({ default: '' })
  razorpaySignature: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
