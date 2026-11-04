import { Schema, model, Document } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  description: string;
  type: 'percent' | 'flat';
  value: number;
  minOrder: number;
  maxDiscount: number;
  expiresAt?: Date | null;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9_-]{3,20}$/, 'Code must be 3-20 letters, numbers, - or _'],
    },
    description: { type: String, default: '', trim: true, maxlength: 120 },
    type: { type: String, enum: ['percent', 'flat'], required: true, default: 'percent' },
    value: { type: Number, required: [true, 'Discount value is required'], min: [1, 'Discount must be at least 1'] },
    minOrder: { type: Number, default: 0, min: 0 },
    // 0 = no cap (only meaningful for percent coupons)
    maxDiscount: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date, default: null },
    // 0 = unlimited uses
    usageLimit: { type: Number, default: 0, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

CouponSchema.path('value').validate(function (this: ICoupon, value: number) {
  return this.type !== 'percent' || value <= 100;
}, 'Percent discount cannot exceed 100');

CouponSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

export const Coupon = model<ICoupon>('Coupon', CouponSchema);

/**
 * Checks a coupon against a subtotal. Returns the discount in rupees, or an error message.
 * Does not consume a use — see orderController for the atomic increment.
 */
export const evaluateCoupon = (coupon: ICoupon | null, subtotal: number): { discount: number } | { error: string } => {
  if (!coupon || !coupon.isActive) return { error: 'This coupon code is not valid.' };
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) return { error: 'This coupon has expired.' };
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    return { error: 'This coupon has reached its usage limit.' };
  }
  if (subtotal < coupon.minOrder) {
    return { error: `Add items worth ₹${coupon.minOrder - subtotal} more to use this coupon (minimum ₹${coupon.minOrder}).` };
  }

  let discount = coupon.type === 'percent' ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  if (coupon.type === 'percent' && coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
  return { discount: Math.min(discount, subtotal) };
};
