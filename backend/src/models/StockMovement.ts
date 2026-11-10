import { Schema, model, Document, Types } from 'mongoose';

export type StockReason =
  | 'online_order'
  | 'order_cancelled'
  | 'counter_bill'
  | 'bill_void'
  | 'restock'
  | 'wastage'
  | 'correction';

export interface IStockMovement extends Document {
  product: Types.ObjectId;
  productName: string;
  change: number;
  balanceAfter: number | null;
  reason: StockReason;
  reference: string;
  note: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
}

/** Append-only log of every stock change, so the shop owner can see why stock moved. */
const StockMovementSchema = new Schema<IStockMovement>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true, trim: true },
    change: { type: Number, required: true },
    balanceAfter: { type: Number, default: null },
    reason: {
      type: String,
      enum: ['online_order', 'order_cancelled', 'counter_bill', 'bill_void', 'restock', 'wastage', 'correction'],
      required: true,
    },
    // Order / bill number this movement belongs to (empty for manual changes)
    reference: { type: String, default: '', trim: true },
    note: { type: String, default: '', trim: true, maxlength: 200 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

StockMovementSchema.index({ product: 1, createdAt: -1 });
StockMovementSchema.index({ createdAt: -1 });

StockMovementSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

export const StockMovement = model<IStockMovement>('StockMovement', StockMovementSchema);
