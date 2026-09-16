import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { Service } from '../models/Service';
import { User } from '../models/User';

/* ── Dashboard Stats (Admin) ── */
export const getDashboardStats = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Run all queries in parallel for speed
    const [
      totalProducts,
      totalServices,
      totalUsers,
      orders,
      recentOrders,
      lowStockProducts,
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Service.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'customer' }),
      Order.find({}).select('total status createdAt'),
      Order.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email phone'),
      Product.find({ stockQuantity: { $lt: 40 }, isActive: true })
        .select('name stockQuantity unit')
        .sort({ stockQuantity: 1 }),
    ]);

    // Calculate revenue (from completed or paid orders)
    const totalRevenue = orders
      .filter((o) => ['paid', 'preparing', 'ready', 'completed'].includes(o.status))
      .reduce((sum, o) => sum + o.total, 0);

    const totalOrders = orders.length;

    // Calculate status breakdown
    const statusBreakdown: Record<string, number> = {};
    for (const order of orders) {
      statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
    }

    // Calculate 30-day revenue for comparison
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const currentMonthRevenue = orders
      .filter(
        (o) =>
          o.createdAt >= thirtyDaysAgo &&
          ['paid', 'preparing', 'ready', 'completed'].includes(o.status)
      )
      .reduce((sum, o) => sum + o.total, 0);

    const previousMonthRevenue = orders
      .filter(
        (o) =>
          o.createdAt >= sixtyDaysAgo &&
          o.createdAt < thirtyDaysAgo &&
          ['paid', 'preparing', 'ready', 'completed'].includes(o.status)
      )
      .reduce((sum, o) => sum + o.total, 0);

    const revenueChange =
      previousMonthRevenue > 0
        ? (((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100).toFixed(1)
        : currentMonthRevenue > 0
        ? '+100'
        : '0';

    const currentMonthOrders = orders.filter((o) => o.createdAt >= thirtyDaysAgo).length;
    const previousMonthOrders = orders.filter(
      (o) => o.createdAt >= sixtyDaysAgo && o.createdAt < thirtyDaysAgo
    ).length;

    const ordersChange =
      previousMonthOrders > 0
        ? (((currentMonthOrders - previousMonthOrders) / previousMonthOrders) * 100).toFixed(1)
        : currentMonthOrders > 0
        ? '+100'
        : '0';

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalProducts,
        totalServices,
        totalUsers,
        revenueChange: `${Number(revenueChange) >= 0 ? '+' : ''}${revenueChange}%`,
        ordersChange: `${Number(ordersChange) >= 0 ? '+' : ''}${ordersChange}%`,
        statusBreakdown,
        recentOrders: recentOrders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          customerEmail: o.customerEmail,
          total: o.total,
          status: o.status,
          createdAt: o.createdAt,
        })),
        lowStockProducts: lowStockProducts.map((p) => ({
          id: p.id,
          name: p.name,
          stockQuantity: p.stockQuantity,
          unit: p.unit,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
