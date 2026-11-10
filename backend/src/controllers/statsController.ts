import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { Service } from '../models/Service';
import { User } from '../models/User';
import { Callback } from '../models/Callback';
import { Bill } from '../models/Bill';
import { getStoreSettings } from '../models/Settings';
import { PAID_STATUSES } from '../utils/helpers';
const DAY_MS = 24 * 60 * 60 * 1000;

const percentChange = (current: number, previous: number): string => {
  const change = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
};

/* ── Dashboard Stats (Admin) — computed in MongoDB instead of loading every order ── */
export const getDashboardStats = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(now - 30 * DAY_MS);
    const sixtyDaysAgo = new Date(now - 60 * DAY_MS);
    const paid = { $in: [...PAID_STATUSES] };

    const sumIf = (cond: Record<string, unknown>, field: string | number) => ({
      $sum: { $cond: [cond, field, 0] },
    });
    const isPaid = { $in: ['$status', [...PAID_STATUSES]] };
    const { lowStockThreshold } = await getStoreSettings();

    const [
      totalProducts,
      totalServices,
      totalUsers,
      pendingEnquiries,
      [orderAgg],
      statusAgg,
      recentOrders,
      lowStockProducts,
      topProducts,
      [counterToday],
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Service.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'customer' }),
      Callback.countDocuments({ status: 'pending' }),
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: sumIf(isPaid, '$total'),
            currentRevenue: sumIf({ $and: [isPaid, { $gte: ['$createdAt', thirtyDaysAgo] }] }, '$total'),
            previousRevenue: sumIf(
              { $and: [isPaid, { $gte: ['$createdAt', sixtyDaysAgo] }, { $lt: ['$createdAt', thirtyDaysAgo] }] },
              '$total'
            ),
            currentOrders: sumIf({ $gte: ['$createdAt', thirtyDaysAgo] }, 1),
            previousOrders: sumIf(
              { $and: [{ $gte: ['$createdAt', sixtyDaysAgo] }, { $lt: ['$createdAt', thirtyDaysAgo] }] },
              1
            ),
            todayOrders: sumIf({ $gte: ['$createdAt', startOfToday] }, 1),
            todayRevenue: sumIf({ $and: [isPaid, { $gte: ['$createdAt', startOfToday] }] }, '$total'),
          },
        },
      ]),
      Order.aggregate<{ _id: string; count: number }>([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderNumber customerName customerEmail total status createdAt'),
      Product.find({ stockQuantity: { $lte: lowStockThreshold }, isActive: true })
        .select('name stockQuantity unit')
        .sort({ stockQuantity: 1 })
        .limit(10),
      Order.aggregate<{ _id: string; quantity: number; revenue: number }>([
        { $match: { status: paid, createdAt: { $gte: thirtyDaysAgo } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.productName', quantity: { $sum: '$items.quantity' }, revenue: { $sum: '$items.totalPrice' } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),
      Bill.aggregate<{ count: number; sales: number }>([
        { $match: { status: 'paid', createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, count: { $sum: 1 }, sales: { $sum: '$total' } } },
      ]),
    ]);

    const o = orderAgg || {
      totalOrders: 0, totalRevenue: 0, currentRevenue: 0, previousRevenue: 0,
      currentOrders: 0, previousOrders: 0, todayOrders: 0, todayRevenue: 0,
    };

    const statusBreakdown: Record<string, number> = {};
    for (const s of statusAgg) statusBreakdown[s._id] = s.count;

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: o.totalRevenue,
        totalOrders: o.totalOrders,
        totalProducts,
        totalServices,
        totalUsers,
        revenueChange: percentChange(o.currentRevenue, o.previousRevenue),
        ordersChange: percentChange(o.currentOrders, o.previousOrders),
        todayOrders: o.todayOrders,
        todayRevenue: o.todayRevenue,
        counterBillsToday: counterToday?.count || 0,
        counterSalesToday: counterToday?.sales || 0,
        lowStockThreshold,
        awaitingPayment: statusBreakdown.pending || 0,
        awaitingVerification: statusBreakdown.paid || 0,
        pendingEnquiries,
        statusBreakdown,
        recentOrders: recentOrders.map((r) => ({
          id: r.id,
          orderNumber: r.orderNumber,
          customerName: r.customerName,
          customerEmail: r.customerEmail,
          total: r.total,
          status: r.status,
          createdAt: r.createdAt,
        })),
        lowStockProducts: lowStockProducts.map((p) => ({
          id: p.id,
          name: p.name,
          stockQuantity: p.stockQuantity,
          unit: p.unit,
        })),
        topProducts: topProducts.map((t) => ({ name: t._id, quantity: t.quantity, revenue: t.revenue })),
      },
    });
  } catch (error) {
    next(error);
  }
};
