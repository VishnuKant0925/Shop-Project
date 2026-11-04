import { Request, Response, NextFunction } from 'express';
import { Coupon, evaluateCoupon } from '../models/Coupon';
import { pick } from '../utils/helpers';

const EDITABLE = ['code', 'description', 'type', 'value', 'minOrder', 'maxDiscount', 'expiresAt', 'usageLimit', 'isActive'] as const;

const normalise = (body: Record<string, unknown>) => {
  const data = pick(body, EDITABLE) as Record<string, unknown>;
  if (typeof data.code === 'string') data.code = data.code.trim().toUpperCase();
  for (const key of ['value', 'minOrder', 'maxDiscount', 'usageLimit']) {
    if (data[key] !== undefined) data[key] = Number(data[key]) || 0;
  }
  if (data.expiresAt === '' || data.expiresAt === undefined) {
    if (Object.prototype.hasOwnProperty.call(body, 'expiresAt')) data.expiresAt = null;
  }
  return data;
};

/* ── Customer: check a code against the current cart subtotal ── */
export const validateCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const code = typeof req.body.code === 'string' ? req.body.code.trim().toUpperCase() : '';
    const subtotal = Number(req.body.subtotal) || 0;
    if (!code) {
      res.status(400).json({ success: false, message: 'Please enter a coupon code.' });
      return;
    }

    const coupon = await Coupon.findOne({ code });
    const result = evaluateCoupon(coupon, subtotal);
    if ('error' in result) {
      res.status(400).json({ success: false, message: result.error });
      return;
    }

    res.status(200).json({
      success: true,
      data: { code, discount: result.discount, description: coupon!.description },
      message: `Coupon applied — you save ₹${result.discount}.`,
    });
  } catch (error) {
    next(error);
  }
};

/* ── Admin CRUD ── */
export const getCoupons = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: coupons.length, data: coupons });
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const coupon = await Coupon.create(normalise(req.body));
    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    next(error);
  }
};

export const updateCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      res.status(404).json({ success: false, message: 'Coupon not found' });
      return;
    }
    // Assign + save (rather than findByIdAndUpdate) so the percent <= 100 validator sees the final type.
    coupon.set(normalise(req.body));
    await coupon.save();
    res.status(200).json({ success: true, data: coupon });
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      res.status(404).json({ success: false, message: 'Coupon not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
};
