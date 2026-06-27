import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Category extends Document {
  @Prop({ required: true })
  id: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ default: '' })
  img: string;

  @Prop({ default: true })
  enabled: boolean;

  @Prop({ default: 0 })
  count: number;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
