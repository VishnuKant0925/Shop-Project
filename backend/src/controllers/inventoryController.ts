import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { Product } from '../models/Product';
import { StockMovement } from '../models/StockMovement';
import { emitProductsChanged } from '../realtime';
import { logStockMovements, roundQty } from '../services/stock';
import { parsePagination } from '../utils/helpers';

const MANUAL_REASONS = ['restock', 'wastage', 'correction'] as const;
type ManualReason = (typeof MANUAL_REASONS)[number];

/**
 * Restock / wastage / correction for one product.
 *  - restock:    { quantity }  adds stock
 *  - wastage:    { quantity }  removes stock (cannot go below 0)
 *  - correction: { setTo }     sets the exact counted stock
 */
export const adjustStock = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reason, note } = req.body as { reason: ManualReason; note?: string };
    if (!MANUAL_REASONS.includes(reason)) {
      res.status(400).json({ success: false, message: 'Reason must be restock, wastage or correction.' });
      return;
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    let change: number;
    let updated;
    if (reason === 'correction') {
      const setTo = roundQty(Number(req.body.setTo));
      if (!Number.isFinite(setTo) || setTo < 0) {
        res.status(400).json({ success: false, message: 'Enter the counted stock (0 or more).' });
        return;
      }
      const before = await Product.findById(req.params.id).select('stockQuantity');
      if (!before) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }
      change = roundQty(setTo - before.stockQuantity);
      updated = await Product.findByIdAndUpdate(req.params.id, { stockQuantity: setTo }, { new: true });
    } else {
      const quantity = roundQty(Number(req.body.quantity));
      if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 100000) {
        res.status(400).json({ success: false, message: 'Enter a quantity greater than 0.' });
        return;
      }
      change = reason === 'restock' ? quantity : -quantity;
      const filter: Record<string, unknown> = { _id: req.params.id };
      if (change < 0) filter.stockQuantity = { $gte: quantity };
      updated = await Product.findOneAndUpdate(filter, { $inc: { stockQuantity: change } }, { new: true });
      if (!updated) {
        const exists = await Product.exists({ _id: req.params.id });
        res.status(exists ? 400 : 404).json({
          success: false,
          message: exists ? 'Cannot remove more than the current stock.' : 'Product not found',
        });
        return;
      }
    }

    if (!updated) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    // Keep stock tidy after float arithmetic
    const tidy = roundQty(updated.stockQuantity);
    if (tidy !== updated.stockQuantity) {
      updated.stockQuantity = tidy;
      await updated.save();
    }

    emitProductsChanged();
    await logStockMovements([{
      productId: updated.id,
      change,
      reason,
      note: typeof note === 'string' ? note.trim().slice(0, 200) : '',
      userId: req.user?._id,
    }]);

    res.status(200).json({ success: true, message: 'Stock updated', data: { id: updated.id, stockQuantity: updated.stockQuantity } });
  } catch (error) {
    next(error);
  }
};

/** Stock movement history, optionally for one product. */
export const getStockMovements = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { product } = req.query;
    const { page, limit, skip } = parsePagination(req.query, 40);
    const query: Record<string, unknown> = {};
    if (typeof product === 'string' && mongoose.Types.ObjectId.isValid(product)) query.product = product;

    const [data, total] = await Promise.all([
      StockMovement.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      StockMovement.countDocuments(query),
    ]);
    res.status(200).json({
      success: true,
      data,
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    next(error);
  }
};
