import { Schema, model, Document, Types } from 'mongoose';

export interface IOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus = 'pending' | 'paid' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface IOrder extends Document {
  orderNumber: string;
  user?: Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentScreenshotUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true,
      lowercase: true,
    },
    customerPhone: {
      type: String,
      default: '',
      trim: true,
    },
    shippingAddress: {
      type: String,
      default: 'Pickup from shop',
      trim: true,
    },
    items: {
      type: [OrderItemSchema],
      required: [true, 'Order items are required'],
      validate: [
        (val: IOrderItem[]) => val.length > 0,
        'Order must have at least 1 item',
      ],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'preparing', 'ready', 'completed', 'cancelled'],
      default: 'pending',
    },
    paymentScreenshotUrl: {
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

OrderSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

export const Order = model<IOrder>('Order', OrderSchema);
