import { Response, NextFunction } from 'express';
import { Order, IOrderItem } from '../models/Order';
import { Product } from '../models/Product';
import { AuthRequest } from '../middleware/auth';

export const createOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items,
    } = req.body;

    if (!customerName || !customerEmail || !customerPhone || !shippingAddress) {
      res.status(400).json({ success: false, message: 'Please provide all customer contact and delivery details' });
      return;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Order must have at least one product item' });
      return;
    }

    let subtotal = 0;
    const validatedItems: IOrderItem[] = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      const unitPrice = product ? product.price : Number(item.unitPrice);
      const productName = product ? product.name : item.productName;
      const quantity = Number(item.quantity);
      const totalPrice = unitPrice * quantity;

      subtotal += totalPrice;
      validatedItems.push({
        productId: item.productId,
        productName,
        quantity,
        unitPrice,
        totalPrice,
      });

      // Update product inventory if product exists
      if (product) {
        product.stockQuantity = Math.max(0, product.stockQuantity - quantity);
        await product.save();
      }
    }

    const tax = Math.round(subtotal * 0.05); // 5% GST
    const total = subtotal + tax;

    // Generate unique order number
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${Date.now().toString().slice(-4)}${randomSuffix}`;

    const order = await Order.create({
      orderNumber,
      user: req.user ? req.user._id : undefined,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items: validatedItems,
      subtotal,
      tax,
      total,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

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

export const getAllOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.query;
    const query: Record<string, any> = {};

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

    // Customer can only view their own order unless admin
    if (req.user && req.user.role !== 'admin' && String(order.user) !== String(req.user._id)) {
      res.status(403).json({ success: false, message: 'Access denied to this order' });
      return;
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
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

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};
