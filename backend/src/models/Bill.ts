import { Schema, model, Document, Types } from 'mongoose';

export interface IBillItem {
  productId?: string;
  name: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
}

export type PaymentMode = 'cash' | 'upi' | 'card' | 'credit';

export interface IBill extends Document {
  billNumber: string;
  items: IBillItem[];
  subtotal: number;
  discountType: 'percent' | 'flat' | 'none';
  discountValue: number;
  discount: number;
  taxRate: number;
  tax: number;
  total: number;
  customerName: string;
  customerPhone: string;
  paymentMode: PaymentMode;
  notes: string;
  status: 'paid' | 'void';
  voidReason: string;
  stockRestored: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BillItemSchema = new Schema<IBillItem>(
  {
    // Set for catalogue products (stock is tracked); empty for custom lines like milling charges
    productId: { type: String, default: '' },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    unit: { type: String, default: '', trim: true, maxlength: 20 },
    quantity: { type: Number, required: true, min: 0.01 },
    rate: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

/** A counter (walk-in) sale created by the shop owner from the admin billing screen. */
const BillSchema = new Schema<IBill>(
  {
    billNumber: { type: String, required: true, unique: true },
    items: {
      type: [BillItemSchema],
      validate: [(v: IBillItem[]) => v.length > 0, 'A bill needs at least one item'],
    },
    subtotal: { type: Number, required: true, min: 0 },
    discountType: { type: String, enum: ['percent', 'flat', 'none'], default: 'none' },
    discountValue: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 28 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    customerName: { type: String, default: '', trim: true, maxlength: 80 },
    customerPhone: { type: String, default: '', trim: true, maxlength: 20 },
    paymentMode: { type: String, enum: ['cash', 'upi', 'card', 'credit'], default: 'cash' },
    notes: { type: String, default: '', trim: true, maxlength: 200 },
    status: { type: String, enum: ['paid', 'void'], default: 'paid' },
    voidReason: { type: String, default: '', trim: true, maxlength: 200 },
    stockRestored: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

BillSchema.index({ createdAt: -1 });
BillSchema.index({ status: 1, createdAt: -1 });

BillSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

export const Bill = model<IBill>('Bill', BillSchema);

/* ── Sequential bill numbers (INV-YYMM-0001), safe under concurrent requests ── */
const CounterSchema = new Schema({ key: { type: String, unique: true }, seq: { type: Number, default: 0 } });
const Counter = model('Counter', CounterSchema);

export const nextBillNumber = async (date = new Date()): Promise<string> => {
  const yymm = `${String(date.getFullYear()).slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const counter = await Counter.findOneAndUpdate(
    { key: `bill-${yymm}` },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return `INV-${yymm}-${String(counter!.seq).padStart(4, '0')}`;
};
