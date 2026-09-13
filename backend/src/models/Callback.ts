import { Schema, model, Document } from 'mongoose';

export interface ICallback extends Document {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  status: 'pending' | 'contacted' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

const CallbackSchema = new Schema<ICallback>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'resolved'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

CallbackSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

export const Callback = model<ICallback>('Callback', CallbackSchema);
