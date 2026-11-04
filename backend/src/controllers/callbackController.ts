import { Request, Response, NextFunction } from 'express';
import { Callback } from '../models/Callback';
import { notifyAdmins } from '../services/notify';
import { parsePagination, searchRegex } from '../utils/helpers';

const STATUSES = ['pending', 'contacted', 'resolved'];

export const createCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim().slice(0, 80) : '';
    const phone = typeof req.body.phone === 'string' ? req.body.phone.trim().slice(0, 20) : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().slice(0, 120) : '';
    const message = typeof req.body.message === 'string' ? req.body.message.trim().slice(0, 1000) : '';

    if (!name || !/^[+\d][\d\s-]{6,18}$/.test(phone)) {
      res.status(400).json({ success: false, message: 'Please provide your name and a valid phone number.' });
      return;
    }

    const callback = await Callback.create({ name, phone, email, message });

    void notifyAdmins('new_enquiry', 'New Callback Request', `${name} (${phone}) asked for a callback.`, {
      callbackId: callback.id,
    });

    // Only acknowledge — never echo stored records back to anonymous callers.
    res.status(201).json({
      success: true,
      message: 'Callback request received. We will get back to you shortly!',
    });
  } catch (error) {
    next(error);
  }
};

export const getCallbacks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, q } = req.query;
    const { page, limit, skip } = parsePagination(req.query, 30);

    const query: Record<string, unknown> = {};
    if (typeof status === 'string' && STATUSES.includes(status)) query.status = status;
    const rx = searchRegex(q);
    if (rx) query.$or = [{ name: rx }, { phone: rx }, { email: rx }, { message: rx }];

    const [callbacks, total, pendingCount] = await Promise.all([
      Callback.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Callback.countDocuments(query),
      Callback.countDocuments({ status: 'pending' }),
    ]);

    res.status(200).json({
      success: true,
      count: callbacks.length,
      data: callbacks,
      pendingCount,
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCallbackStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.body;
    if (!STATUSES.includes(status)) {
      res.status(400).json({ success: false, message: `Status must be one of: ${STATUSES.join(', ')}` });
      return;
    }

    const callback = await Callback.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    if (!callback) {
      res.status(404).json({ success: false, message: 'Callback request not found' });
      return;
    }

    res.status(200).json({ success: true, data: callback });
  } catch (error) {
    next(error);
  }
};

export const deleteCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const callback = await Callback.findByIdAndDelete(req.params.id);
    if (!callback) {
      res.status(404).json({ success: false, message: 'Callback request not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Callback request deleted' });
  } catch (error) {
    next(error);
  }
};
