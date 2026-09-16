import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Notification } from '../models/Notification';

/* ── Get Notifications for Current User ── */
export const getMyNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ user: req.user._id }),
    ]);

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

/* ── Get Unread Count ── */
export const getUnreadCount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const count = await Notification.countDocuments({ user: req.user._id, isRead: false });
    res.status(200).json({ success: true, count });
  } catch (error) {
    next(error);
  }
};

/* ── Mark Single Notification as Read ── */
export const markAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found.' });
      return;
    }

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

/* ── Mark All Notifications as Read ── */
export const markAllAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};
