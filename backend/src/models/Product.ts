import { Schema, model, Document, Types } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  unit: 'kg' | 'litre' | 'packet';
  stockQuantity: number;
  imageUrl: string;
  category: Types.ObjectId;
  isActive: boolean;
  badge?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Product slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive'],
    },
    unit: {
      type: String,
      enum: ['kg', 'litre', 'packet'],
      default: 'kg',
      required: true,
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    imageUrl: {
      type: String,
      default: '/images/red-chili-powder.jpg',
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    badge: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual id field to align with frontend Product interface
ProductSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

export const Product = model<IProduct>('Product', ProductSchema);
