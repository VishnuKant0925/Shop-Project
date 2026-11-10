import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { Order, IOrder, IOrderItem, OrderStatus } from '../models/Order';
import { Product } from '../models/Product';
import { Coupon, evaluateCoupon } from '../models/Coupon';
import { getStoreSettings } from '../models/Settings';
import { AuthRequest } from '../middleware/auth';
import { uploadPaymentFile } from '../config/cloudinary';
import { sendOrderReadyEmail } from '../services/emailService';
import { notifyAdmins, notifyUser } from '../services/notify';
import { emitOrderStatusChanged, emitProductsChanged } from '../realtime';
import { parsePagination, searchRegex } from '../utils/helpers';
import { logStockMovements } from '../services/stock';

const ORDER_STATUSES: OrderStatus[] = ['pending', 'paid', 'preparing', 'ready', 'completed', 'cancelled'];
const MAX_LINE_ITEMS = 50;
const MAX_QTY_PER_ITEM = 1000;

const formatINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/* ── Multer (memory storage for Cloudinary) ── */
export const screenshotUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files (JPEG, PNG, WebP) are accepted.'));
  },
}).single('screenshot');

/** Return items of a cancelled order to stock exactly once. */
const restoreStock = async (order: IOrder): Promise<void> => {
  if (order.stockRestored) return;
  const ops = order.items
    .filter((item) => mongoose.Types.ObjectId.isValid(item.productId))
    .map((item) => ({
      updateOne: { filter: { _id: item.productId }, update: { $inc: { stockQuantity: item.quantity } } },
    }));
  if (ops.length > 0) {
    await Product.bulkWrite(ops);
    void logStockMovements(order.items
      .filter((item) => mongoose.Types.ObjectId.isValid(item.productId))
      .map((item) => ({ productId: item.productId, change: item.quantity, reason: 'order_cancelled' as const, reference: order.orderNumber })));
  }
  if (order.couponCode) {
    await Coupon.updateOne({ code: order.couponCode, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
  }
  order.stockRestored = true;
  emitProductsChanged();
};

/** Customers never see the internal admin note. */
const forCustomer = (order: IOrder) => {
  const json = order.toJSON() as Record<string, unknown>;
  delete json.adminNote;
  delete json.stockRestored;
  return json;
};

/* ── Create Order (authenticated) ── */
export const createOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Stock already taken for this request; given back if anything later fails.
  const reserved: { productId: string; quantity: number }[] = [];
  let couponConsumed: string | null = null;

  const rollback = async () => {
    if (reserved.length > 0) {
      await Product.bulkWrite(reserved.map((r) => ({
        updateOne: { filter: { _id: r.productId }, update: { $inc: { stockQuantity: r.quantity } } },
      })));
    }
    if (couponConsumed) await Coupon.updateOne({ code: couponConsumed }, { $inc: { usedCount: -1 } });
  };

  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Please login to place an order.' });
      return;
    }

    const settings = await getStoreSettings();
    if (!settings.acceptingOrders) {
      res.status(403).json({ success: false, message: settings.closedMessage });
      return;
    }

    const { items, notes, couponCode } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Order must have at least one product item.' });
      return;
    }
    if (items.length > MAX_LINE_ITEMS) {
      res.status(400).json({ success: false, message: `An order can contain at most ${MAX_LINE_ITEMS} different products.` });
      return;
    }

    // Validate and merge duplicate lines. Prices always come from the database, never the client.
    const quantities = new Map<string, number>();
    for (const item of items) {
      const productId = String(item?.productId ?? '');
      const quantity = Number(item?.quantity);
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        res.status(400).json({ success: false, message: 'Your cart contains an item that is no longer sold. Please remove it and try again.' });
        return;
      }
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY_PER_ITEM) {
        res.status(400).json({ success: false, message: `Quantities must be whole numbers between 1 and ${MAX_QTY_PER_ITEM}.` });
        return;
      }
      quantities.set(productId, (quantities.get(productId) || 0) + quantity);
    }

    const products = await Product.find({ _id: { $in: [...quantities.keys()] }, isActive: true });
    const byId = new Map(products.map((p) => [p.id as string, p]));
    const missing = [...quantities.keys()].filter((id) => !byId.has(id));
    if (missing.length > 0) {
      res.status(400).json({ success: false, message: 'Some items in your cart are no longer available. Please refresh your cart.' });
      return;
    }

    // Atomically reserve stock for each line: the update only matches if enough stock remains.
    const validatedItems: IOrderItem[] = [];
    let subtotal = 0;
    for (const [productId, quantity] of quantities) {
      const product = byId.get(productId)!;
      const result = await Product.updateOne(
        { _id: productId, stockQuantity: { $gte: quantity } },
        { $inc: { stockQuantity: -quantity } }
      );
      if (result.modifiedCount === 0) {
        await rollback();
        const fresh = await Product.findById(productId).select('stockQuantity unit').lean();
        const left = fresh?.stockQuantity ?? 0;
        res.status(409).json({
          success: false,
          message: left > 0
            ? `Only ${left} ${product.unit} of ${product.name} left in stock. Please reduce the quantity.`
            : `${product.name} just went out of stock. Please remove it from your cart.`,
        });
        return;
      }
      reserved.push({ productId, quantity });
      const totalPrice = product.price * quantity;
      subtotal += totalPrice;
      validatedItems.push({ productId, productName: product.name, quantity, unitPrice: product.price, totalPrice });
    }

    // Coupon: evaluate, then consume one use atomically so usage limits can't be overshot.
    let discount = 0;
    let appliedCode = '';
    if (typeof couponCode === 'string' && couponCode.trim()) {
      const code = couponCode.trim().toUpperCase();
      const coupon = await Coupon.findOne({ code });
      const evaluation = evaluateCoupon(coupon, subtotal);
      if ('error' in evaluation) {
        await rollback();
        res.status(400).json({ success: false, message: evaluation.error });
        return;
      }
      const consumed = await Coupon.updateOne(
        {
          _id: coupon!._id,
          isActive: true,
          $or: [{ usageLimit: 0 }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
        },
        { $inc: { usedCount: 1 } }
      );
      if (consumed.modifiedCount === 0) {
        await rollback();
        res.status(400).json({ success: false, message: 'This coupon has reached its usage limit.' });
        return;
      }
      couponConsumed = code;
      discount = evaluation.discount;
      appliedCode = code;
    }

    const taxable = subtotal - discount;
    const tax = Math.round((taxable * settings.taxRate) / 100);
    const total = taxable + tax;

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;
    const note = typeof notes === 'string' ? notes.trim().slice(0, 300) : '';

    let order: IOrder;
    try {
      order = await Order.create({
        orderNumber,
        user: req.user._id,
        customerName: req.user.name,
        customerEmail: req.user.email,
        customerPhone: req.user.phone || '',
        shippingAddress: note || 'Pickup from shop',
        items: validatedItems,
        subtotal,
        discount,
        couponCode: appliedCode,
        tax,
        total,
        status: 'pending',
      });
    } catch (createErr) {
      await rollback();
      throw createErr;
    }

    emitProductsChanged();
    void logStockMovements(reserved.map((r) => ({
      productId: r.productId,
      change: -r.quantity,
      reason: 'online_order' as const,
      reference: order.orderNumber,
      userId: req.user?._id,
    })));
    void notifyAdmins(
      'new_order',
      'New Order Received',
      `New order ${order.orderNumber} from ${req.user.name} — ${formatINR(order.total)}`,
      { orderId: order.id, orderNumber: order.orderNumber }
    );

    res.status(201).json({ success: true, message: 'Order placed successfully', data: forCustomer(order) });
  } catch (error) {
    next(error);
  }
};

/* ── Upload Payment Screenshot ── */
export const uploadPaymentScreenshot = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }
    if (String(order.user) !== String(req.user._id)) {
      res.status(403).json({ success: false, message: 'You can only upload payment proof for your own orders.' });
      return;
    }
    if (order.status !== 'pending') {
      res.status(400).json({ success: false, message: 'Payment screenshot can only be uploaded for pending orders.' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Please attach a payment screenshot image.' });
      return;
    }

    // Permanent Cloudinary storage; on failure the order stays "pending" so the customer can retry.
    const screenshotUrl = await uploadPaymentFile(req.file.buffer);

    order.paymentScreenshotUrl = screenshotUrl;
    order.status = 'paid';
    await order.save();

    void notifyAdmins(
      'payment_uploaded',
      'Payment Proof Uploaded',
      `${order.customerName} uploaded payment for ${order.orderNumber} (${formatINR(order.total)}). Please verify.`,
      { orderId: order.id, orderNumber: order.orderNumber }
    );

    res.status(200).json({ success: true, message: 'Payment proof uploaded successfully.', data: forCustomer(order) });
  } catch (error) {
    next(error);
  }
};

/* ── Customer cancels their own unpaid order ── */
export const cancelMyOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order || String(order.user) !== String(req.user!._id)) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }
    if (order.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: 'Only unpaid orders can be cancelled online. Please call the mill to cancel a paid order.',
      });
      return;
    }

    order.status = 'cancelled';
    await restoreStock(order);
    await order.save();

    void notifyAdmins(
      'order_cancelled',
      'Order Cancelled by Customer',
      `${order.customerName} cancelled order ${order.orderNumber}.`,
      { orderId: order.id, orderNumber: order.orderNumber }
    );

    res.status(200).json({ success: true, message: 'Order cancelled.', data: forCustomer(order) });
  } catch (error) {
    next(error);
  }
};

/* ── Get Orders for Current User ── */
export const getMyOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orders = await Order.find({ user: req.user!._id })
      .select('-adminNote -stockRestored')
      .sort({ createdAt: -1 })
      .limit(200);
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

/* ── Get All Orders (admin): filter, search and paginate ── */
export const getAllOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, q } = req.query;
    const { page, limit, skip } = parsePagination(req.query, 25);

    const baseQuery: Record<string, unknown> = {};
    const rx = searchRegex(q);
    if (rx) {
      baseQuery.$or = [{ orderNumber: rx }, { customerName: rx }, { customerEmail: rx }, { customerPhone: rx }];
    }

    const query = { ...baseQuery };
    if (typeof status === 'string' && status !== 'all' && ORDER_STATUSES.includes(status as OrderStatus)) {
      query.status = status;
    }

    const [orders, total, counts] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(query),
      Order.aggregate<{ _id: string; count: number }>([
        { $match: baseQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const statusCounts: Record<string, number> = { all: 0 };
    for (const s of ORDER_STATUSES) statusCounts[s] = 0;
    for (const c of counts) {
      statusCounts[c._id] = c.count;
      statusCounts.all += c.count;
    }

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
      statusCounts,
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    next(error);
  }
};

/* ── Get Single Order ── */
export const getOrderById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);
    const isAdmin = req.user?.role === 'admin';

    if (!order || (!isAdmin && String(order.user) !== String(req.user!._id))) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    res.status(200).json({ success: true, data: isAdmin ? order : forCustomer(order) });
  } catch (error) {
    next(error);
  }
};

const statusLabels: Record<string, string> = {
  pending: 'Awaiting Payment',
  paid: 'Payment Confirmed',
  preparing: 'Order Being Prepared',
  ready: 'Order Ready for Pickup',
  completed: 'Order Completed',
  cancelled: 'Order Cancelled',
};

/* ── Update Order status and/or admin note (admin) ── */
export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, adminNote } = req.body;

    if (status === undefined && adminNote === undefined) {
      res.status(400).json({ success: false, message: 'Nothing to update.' });
      return;
    }
    if (status !== undefined && !ORDER_STATUSES.includes(status)) {
      res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${ORDER_STATUSES.join(', ')}` });
      return;
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    if (typeof adminNote === 'string') order.adminNote = adminNote.trim().slice(0, 500);

    const statusChanged = status !== undefined && status !== order.status;
    if (statusChanged) {
      if (order.status === 'cancelled') {
        res.status(400).json({
          success: false,
          message: 'A cancelled order cannot be reopened because its stock was already released. Ask the customer to order again.',
        });
        return;
      }
      order.status = status;
      if (status === 'cancelled') await restoreStock(order);
    }

    await order.save();

    if (statusChanged && order.user) {
      const userId = String(order.user);
      emitOrderStatusChanged(userId, { orderId: order.id, orderNumber: order.orderNumber, status });
      const label = statusLabels[status] || `Status: ${status}`;
      void notifyUser(
        userId,
        status === 'ready' ? 'order_ready' : 'order_status_changed',
        label,
        `Your order #${order.orderNumber} has been updated to: ${label}`,
        { orderId: order.id, orderNumber: order.orderNumber, status }
      );

      if (status === 'ready') {
        sendOrderReadyEmail(order.customerEmail, order.orderNumber, order.total).catch((err) =>
          console.error('[Email] Failed to send order-ready notification:', err.message)
        );
      }
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};
