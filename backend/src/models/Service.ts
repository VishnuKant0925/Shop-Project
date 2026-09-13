import { Schema, model, Document } from 'mongoose';

export interface IService extends Document {
  name: string;
  slug: string;
  description: string;
  rate: number;
  rateUnit: string;
  imageUrl: string;
  icon: string;
  isActive: boolean;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    rate: {
      type: Number,
      required: [true, 'Rate is required'],
      min: [0, 'Rate must be positive'],
    },
    rateUnit: {
      type: String,
      required: [true, 'Rate unit is required (e.g. per kg)'],
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '/images/flour-milling.jpg',
    },
    icon: {
      type: String,
      default: '⚙️',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    features: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ServiceSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

export const Service = model<IService>('Service', ServiceSchema);
