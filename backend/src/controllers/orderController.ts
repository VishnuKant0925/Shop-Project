import { Response, NextFunction } from 'express';
import multer from 'multer';
import { Order, IOrderItem } from '../models/Order';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middleware/auth';
import { uploadPaymentFile } from '../config/cloudinary';
import { sendOrderReadyEmail } from '../services/emailService';
import { emitOrderStatusChanged, emitNewNotification, emitAdminNotification } from '../realtime';

/* ── Multer (memory storage for Cloudinary) ── */
export const screenshotUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files (JPEG, PNG, WebP) are accepted.'));
  },
}).single('screenshot');

/* ── Create Order (authenticated) ── */
export const createOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Please login to place an order.' });
      return;
    }

    const { items, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Order must have at least one product item.' });
      return;
    }

    let subtotal = 0;
    const validatedItems: IOrderItem[] = [];

    for (const item of items) {
      // Gracefully handle non-ObjectId product IDs (e.g. static catalogue data)
      let product = null;
      try {
        product = await Product.findById(item.productId);
      } catch {
        // Invalid ObjectId format — skip DB lookup, use client-supplied values
      }

      const unitPrice = product ? product.price : Number(item.unitPrice);
      const productName = product ? product.name : item.productName;
      const quantity = Number(item.quantity);
      const totalPrice = unitPrice * quantity;

      subtotal += totalPrice;
      validatedItems.push({ productId: item.productId, productName, quantity, unitPrice, totalPrice });

      // Decrement inventory
      if (product) {
        product.stockQuantity = Math.max(0, product.stockQuantity - quantity);
        await product.save();
      }
    }

    const tax = Math.round(subtotal * 0.05); // 5 % GST
    const total = subtotal + tax;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${Date.now().toString().slice(-4)}${randomSuffix}`;

    const order = await Order.create({
      orderNumber,
      user: req.user._id,
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone: req.user.phone || '',
      shippingAddress: typeof notes === 'string' && notes.trim() ? notes.trim() : 'Pickup from shop',
      items: validatedItems,
      subtotal,
      tax,
      total,
      status: 'pending',
    });

    // Notify all admin users about the new order
    try {
      const admins = await User.find({ role: 'admin' }).select('_id');
      const adminNotifications = admins.map((admin) => ({
        user: admin._id,
        type: 'new_order' as const,
        title: 'New Order Received',
        message: `New order ${order.orderNumber} from ${req.user!.name} — ₹${order.total}`,
        data: { orderId: order.id, orderNumber: order.orderNumber },
      }));
      if (adminNotifications.length > 0) {
        const created = await Notification.insertMany(adminNotifications);
        // Emit to admin room
        if (created.length > 0) {
          const n = created[0];
          emitAdminNotification({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            createdAt: n.createdAt,
          });
        }
      }
    } catch (notifErr) {
      console.error('[Notification] Failed to notify admins about new order:', notifErr);
    }

    res.status(201).json({ success: true, message: 'Order placed successfully', data: order });
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

    const { id } = req.params;
    const order = await Order.findById(id);

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

    // Upload to Cloudinary with local storage fallback
    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';
    const screenshotUrl = await uploadPaymentFile(
      req.file.buffer,
      req.file.originalname,
      host,
      protocol
    );

    order.paymentScreenshotUrl = screenshotUrl;
    order.status = 'paid';
    await order.save();

    res.status(200).json({ success: true, message: 'Payment proof uploaded successfully.', data: order });
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
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

/* ── Get All Orders (admin) ── */
export const getAllOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.query;
    const query: Record<string, unknown> = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
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
    const { id } = req.params;
    const order = await Order.findById(id).populate('user', 'name email phone');

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    // Customers can only view their own orders
    if (req.user && req.user.role !== 'admin' && String(order.user) !== String(req.user._id)) {
      res.status(403).json({ success: false, message: 'Access denied to this order' });
      return;
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

/* ── Update Order Status (admin) ── */
export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'paid', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    // Notify the customer about every status change via socket + persistent notification
    if (order.user) {
      const userId = String(order.user);
      emitOrderStatusChanged(userId, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status,
      });

      // Create persistent notification for the customer
      const statusLabels: Record<string, string> = {
        paid: 'Payment Confirmed',
        preparing: 'Order Being Prepared',
        ready: 'Order Ready for Pickup',
        completed: 'Order Completed',
        cancelled: 'Order Cancelled',
      };
      const statusLabel = statusLabels[status] || `Status: ${status}`;

      try {
        const notif = await Notification.create({
          user: order.user,
          type: status === 'ready' ? 'order_ready' : 'order_status_changed',
          title: statusLabel,
          message: `Your order #${order.orderNumber} has been updated to: ${statusLabel}`,
          data: { orderId: order.id, orderNumber: order.orderNumber, status },
        });

        emitNewNotification(userId, {
          id: notif.id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          createdAt: notif.createdAt,
        });
      } catch (notifErr) {
        console.error('[Notification] Failed to create status notification:', notifErr);
      }

      // When admin marks as "ready", also send email
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
