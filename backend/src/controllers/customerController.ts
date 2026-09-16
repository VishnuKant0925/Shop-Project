import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Order } from '../models/Order';
import { sendPromotionalEmail } from '../services/emailService';

/* ── Get All Customers with Aggregate Order Metrics ── */
export const getAllCustomers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { q } = req.query;

    // Filter customers
    const userQuery: Record<string, unknown> = { role: 'customer' };
    if (q && typeof q === 'string' && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      userQuery.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const customers = await User.find(userQuery)
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    // Aggregate orders for each customer
    const customerIds = customers.map((c) => c._id);
    const customerEmails = customers.map((c) => c.email.toLowerCase());

    const allOrders = await Order.find({
      $or: [
        { user: { $in: customerIds } },
        { customerEmail: { $in: customerEmails } },
      ],
    })
      .select('orderNumber user customerEmail total status createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Map orders to customers
    let totalCustomerOrders = 0;
    let totalCustomerSpend = 0;
    let repeatCustomerCount = 0;

    const enrichedCustomers = customers.map((customer) => {
      const custIdStr = customer._id.toString();
      const custEmailStr = customer.email.toLowerCase();

      const userOrders = allOrders.filter(
        (o) =>
          (o.user && o.user.toString() === custIdStr) ||
          (o.customerEmail && o.customerEmail.toLowerCase() === custEmailStr)
      );

      const completedOrders = userOrders.filter((o) =>
        ['paid', 'preparing', 'ready', 'completed'].includes(o.status)
      );

      const totalSpent = completedOrders.reduce((sum, o) => sum + o.total, 0);
      const lastOrder = userOrders.length > 0 ? userOrders[0] : null;

      totalCustomerOrders += userOrders.length;
      totalCustomerSpend += totalSpent;
      if (userOrders.length > 1) {
        repeatCustomerCount += 1;
      }

      return {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        createdAt: customer.createdAt,
        totalOrders: userOrders.length,
        totalSpent,
        lastOrderDate: lastOrder ? lastOrder.createdAt : null,
        lastOrderNumber: lastOrder ? lastOrder.orderNumber : null,
        lastOrderStatus: lastOrder ? lastOrder.status : null,
      };
    });

    res.status(200).json({
      success: true,
      data: enrichedCustomers,
      stats: {
        totalCustomers: customers.length,
        totalOrders: totalCustomerOrders,
        totalSpend: totalCustomerSpend,
        repeatCustomers: repeatCustomerCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ── Get Single Customer Profile & Full Chronological Orders ── */
export const getCustomerById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await User.findById(id).select('-password').lean();
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    const orders = await Order.find({
      $or: [
        { user: customer._id },
        { customerEmail: customer.email.toLowerCase() },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    const completedOrders = orders.filter((o) =>
      ['paid', 'preparing', 'ready', 'completed'].includes(o.status)
    );

    const totalSpent = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = completedOrders.length > 0 ? Math.round(totalSpent / completedOrders.length) : 0;

    res.status(200).json({
      success: true,
      data: {
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone || '',
          role: customer.role,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
        },
        orders: orders.map((o) => ({
          id: o._id,
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          customerEmail: o.customerEmail,
          customerPhone: o.customerPhone,
          shippingAddress: o.shippingAddress,
          items: o.items,
          subtotal: o.subtotal,
          tax: o.tax,
          total: o.total,
          status: o.status,
          createdAt: o.createdAt,
        })),
        stats: {
          totalOrders: orders.length,
          totalSpent,
          avgOrderValue,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ── Send Promotional Email Campaign / Scheme Offers ── */
export const sendPromotions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      recipientType = 'all',
      recipientEmails = [],
      subject,
      headline,
      offerCode,
      discountText,
      message,
      ctaUrl,
      ctaText,
    } = req.body;

    if (!subject || !headline || !message) {
      res.status(400).json({
        success: false,
        message: 'Subject line, headline, and message body are required',
      });
      return;
    }

    // Determine target customer recipients
    let recipients: { name: string; email: string }[] = [];

    if (recipientType === 'all') {
      const customers = await User.find({ role: 'customer' })
        .select('name email')
        .lean();
      recipients = customers.map((c) => ({ name: c.name, email: c.email }));
    } else if (Array.isArray(recipientEmails) && recipientEmails.length > 0) {
      const normalizedEmails = recipientEmails.map((e: string) => String(e).trim().toLowerCase());
      const customers = await User.find({ email: { $in: normalizedEmails } })
        .select('name email')
        .lean();

      // Ensure every requested email gets sent, with customer name if known
      recipients = normalizedEmails.map((email: string) => {
        const found = customers.find((c) => c.email.toLowerCase() === email);
        return {
          name: found ? found.name : 'Valued Patron',
          email,
        };
      });
    }

    if (recipients.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No valid customer recipients found for this promotion',
      });
      return;
    }

    // Send emails individually to ensure personalized delivery and recipient privacy
    let sentCount = 0;
    const errors: { email: string; error: string }[] = [];

    for (const recipient of recipients) {
      try {
        await sendPromotionalEmail({
          to: recipient.email,
          customerName: recipient.name,
          subject,
          headline,
          offerCode: offerCode ? String(offerCode).trim() : undefined,
          discountText: discountText ? String(discountText).trim() : undefined,
          message,
          ctaUrl,
          ctaText,
        });
        sentCount += 1;
      } catch (err) {
        console.error(`Failed to send promotion to ${recipient.email}:`, err);
        errors.push({
          email: recipient.email,
          error: err instanceof Error ? err.message : 'Send failure',
        });
      }
    }

    res.status(200).json({
      success: true,
      sentCount,
      totalRecipients: recipients.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully dispatched scheme offer to ${sentCount} recipient(s).`,
    });
  } catch (error) {
    next(error);
  }
};
