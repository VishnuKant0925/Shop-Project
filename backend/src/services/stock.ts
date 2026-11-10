import { Types } from 'mongoose';
import { Product } from '../models/Product';
import { StockMovement, StockReason } from '../models/StockMovement';

export interface MovementInput {
  productId: string;
  change: number;
  reason: StockReason;
  reference?: string;
  note?: string;
  userId?: Types.ObjectId | string;
}

/** Stock is kept to 2 decimals so loose items (0.5 kg, 1.25 L) can be sold. */
export const roundQty = (n: number): number => Math.round(n * 100) / 100;

/**
 * Write movement log entries (with the balance after the change). Never throws:
 * a logging failure must not undo a sale that already happened.
 */
export const logStockMovements = async (entries: MovementInput[]): Promise<void> => {
  if (entries.length === 0) return;
  try {
    const products = await Product.find({ _id: { $in: entries.map((e) => e.productId) } })
      .select('name stockQuantity')
      .lean();
    const byId = new Map(products.map((p) => [String(p._id), p]));
    await StockMovement.insertMany(
      entries
        .filter((e) => byId.has(e.productId))
        .map((e) => ({
          product: e.productId,
          productName: byId.get(e.productId)!.name,
          change: roundQty(e.change),
          balanceAfter: byId.get(e.productId)!.stockQuantity,
          reason: e.reason,
          reference: e.reference || '',
          note: e.note || '',
          createdBy: e.userId,
        }))
    );
  } catch (err) {
    console.error('[Stock] Failed to log stock movements:', err);
  }
};
