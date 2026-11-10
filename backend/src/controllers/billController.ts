import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { Bill, IBillItem, nextBillNumber, PaymentMode } from '../models/Bill';
import { Product } from '../models/Product';
import { getStoreSettings } from '../models/Settings';
import { emitProductsChanged } from '../realtime';
import { logStockMovements, roundQty } from '../services/stock';
import { parsePagination, searchRegex } from '../utils/helpers';

const PAYMENT_MODES: PaymentMode[] = ['cash', 'upi', 'card', 'credit'];
const MAX_LINES = 60;
const money = (n: number) => Math.round(n * 100) / 100;

const fail = (res: Response, status: number, message: string) => {
  res.status(status).json({ success: false, message });
};

/* ── Create a counter bill ── */
export const createBill = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  // Stock taken by this request, given back if anything later fails
  const reserved: { productId: string; quantity: number }[] = [];
  const rollback = async () => {
    if (reserved.length === 0) return;
    await Product.bulkWrite(reserved.map((r) => ({
      updateOne: { filter: { _id: r.productId }, update: { $inc: { stockQuantity: r.quantity } } },
    })));
  };

  try {
    const { items, discountType = 'none', discountValue = 0, customerName, customerPhone, paymentMode = 'cash', notes } = req.body;

    if (!Array.isArray(items) || items.length === 0) return fail(res, 400, 'Add at least one item to the bill.');
    if (items.length > MAX_LINES) return fail(res, 400, `A bill can have at most ${MAX_LINES} lines.`);
    if (!PAYMENT_MODES.includes(paymentMode)) return fail(res, 400, 'Choose a valid payment mode.');
    if (!['percent', 'flat', 'none'].includes(discountType)) return fail(res, 400, 'Invalid discount type.');

    // Validate lines. Catalogue products default to their current price; the owner may override the rate.
    const productIds = items
      .map((i: { productId?: unknown }) => String(i?.productId || ''))
      .filter((id: string) => mongoose.Types.ObjectId.isValid(id));
    const products = await Product.find({ _id: { $in: productIds } });
    const byId = new Map(products.map((p) => [p.id as string, p]));

    const lines: IBillItem[] = [];
    for (const raw of items) {
      const quantity = roundQty(Number(raw?.quantity));
      if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 10000) {
        return fail(res, 400, 'Each quantity must be a number greater than 0.');
      }
      const productId = String(raw?.productId || '');
      const product = productId ? byId.get(productId) : undefined;
      if (productId && !product) return fail(res, 400, 'One of the products on this bill no longer exists.');

      const rate = raw?.rate !== undefined && raw?.rate !== '' ? Number(raw.rate) : product?.price;
      if (rate === undefined || !Number.isFinite(rate) || rate < 0) return fail(res, 400, 'Each line needs a valid rate.');

      const name = product ? product.name : String(raw?.name || '').trim().slice(0, 80);
      if (!name) return fail(res, 400, 'Custom lines need a name.');

      lines.push({
        productId: product ? productId : '',
        name,
        unit: product ? product.unit : String(raw?.unit || '').trim().slice(0, 20),
        quantity,
        rate: money(rate),
        amount: money(quantity * rate),
      });
    }

    // Reserve stock atomically per product (sum lines of the same product first)
    const needed = new Map<string, number>();
    for (const l of lines) if (l.productId) needed.set(l.productId, roundQty((needed.get(l.productId) || 0) + l.quantity));
    for (const [productId, quantity] of needed) {
      const result = await Product.updateOne(
        { _id: productId, stockQuantity: { $gte: quantity } },
        { $inc: { stockQuantity: -quantity } }
      );
      if (result.modifiedCount === 0) {
        await rollback();
        const p = byId.get(productId)!;
        const fresh = await Product.findById(productId).select('stockQuantity').lean();
        return fail(res, 409, `Only ${fresh?.stockQuantity ?? 0} ${p.unit} of ${p.name} in stock. Restock it in Inventory or reduce the quantity.`);
      }
      reserved.push({ productId, quantity });
    }

    const settings = await getStoreSettings();
    const subtotal = money(lines.reduce((s, l) => s + l.amount, 0));
    const dValue = Math.max(0, Number(discountValue) || 0);
    let discount = 0;
    if (discountType === 'percent') discount = money((subtotal * Math.min(dValue, 100)) / 100);
    else if (discountType === 'flat') discount = money(Math.min(dValue, subtotal));
    const taxRate = req.body.taxRate !== undefined ? Math.min(28, Math.max(0, Number(req.body.taxRate) || 0)) : settings.taxRate;
    const tax = money(((subtotal - discount) * taxRate) / 100);
    const total = Math.round(subtotal - discount + tax); // bills are settled in whole rupees

    let bill;
    try {
      bill = await Bill.create({
        billNumber: await nextBillNumber(),
        items: lines,
        subtotal,
        discountType: discount > 0 ? discountType : 'none',
        discountValue: discount > 0 ? dValue : 0,
        discount,
        taxRate,
        tax,
        total,
        customerName: typeof customerName === 'string' ? customerName.trim().slice(0, 80) : '',
        customerPhone: typeof customerPhone === 'string' ? customerPhone.trim().slice(0, 20) : '',
        paymentMode,
        notes: typeof notes === 'string' ? notes.trim().slice(0, 200) : '',
        createdBy: req.user?._id,
      });
    } catch (createErr) {
      await rollback();
      throw createErr;
    }

    if (reserved.length > 0) {
      emitProductsChanged();
      void logStockMovements(reserved.map((r) => ({
        productId: r.productId,
        change: -r.quantity,
        reason: 'counter_bill' as const,
        reference: bill.billNumber,
        userId: req.user?._id,
      })));
    }

    res.status(201).json({ success: true, message: `Bill ${bill.billNumber} saved`, data: bill });
  } catch (error) {
    next(error);
  }
};

/* ── Bill history with search, date range and totals ── */
export const getBills = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q, from, to, status } = req.query;
    const { page, limit, skip } = parsePagination(req.query, 30);

    const query: Record<string, unknown> = {};
    const rx = searchRegex(q);
    if (rx) query.$or = [{ billNumber: rx }, { customerName: rx }, { customerPhone: rx }];
    if (status === 'paid' || status === 'void') query.status = status;
    const range: Record<string, Date> = {};
    if (typeof from === 'string' && !Number.isNaN(Date.parse(from))) range.$gte = new Date(from);
    if (typeof to === 'string' && !Number.isNaN(Date.parse(to))) range.$lte = new Date(to);
    if (Object.keys(range).length) query.createdAt = range;

    const [bills, total, [summary]] = await Promise.all([
      Bill.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Bill.countDocuments(query),
      Bill.aggregate([
        { $match: { ...query, status: 'paid' } },
        { $group: { _id: null, count: { $sum: 1 }, sales: { $sum: '$total' }, discount: { $sum: '$discount' } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: bills,
      summary: { count: summary?.count || 0, sales: summary?.sales || 0, discount: summary?.discount || 0 },
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    next(error);
  }
};

export const getBill = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return fail(res, 404, 'Bill not found');
    res.status(200).json({ success: true, data: bill });
  } catch (error) {
    next(error);
  }
};

/* ── Void (cancel) a bill: items go back into stock exactly once ── */
export const voidBill = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return fail(res, 404, 'Bill not found');
    if (bill.status === 'void') return fail(res, 400, 'This bill is already cancelled.');

    bill.status = 'void';
    bill.voidReason = typeof req.body.reason === 'string' ? req.body.reason.trim().slice(0, 200) : '';

    const restock = new Map<string, number>();
    for (const l of bill.items) {
      if (l.productId && mongoose.Types.ObjectId.isValid(l.productId)) {
        restock.set(l.productId, roundQty((restock.get(l.productId) || 0) + l.quantity));
      }
    }
    if (!bill.stockRestored && restock.size > 0) {
      await Product.bulkWrite([...restock].map(([id, qty]) => ({
        updateOne: { filter: { _id: id }, update: { $inc: { stockQuantity: qty } } },
      })));
      bill.stockRestored = true;
      emitProductsChanged();
      void logStockMovements([...restock].map(([productId, qty]) => ({
        productId,
        change: qty,
        reason: 'bill_void' as const,
        reference: bill.billNumber,
        userId: req.user?._id,
      })));
    }
    await bill.save();

    res.status(200).json({ success: true, message: `Bill ${bill.billNumber} cancelled`, data: bill });
  } catch (error) {
    next(error);
  }
};
