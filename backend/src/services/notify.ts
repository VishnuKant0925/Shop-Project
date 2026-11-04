import { Types } from 'mongoose';
import { Notification, NotificationType } from '../models/Notification';
import { User } from '../models/User';
import { emitAdminNotification, emitNewNotification } from '../realtime';

/** Store a notification for every admin and push it to the admin socket room. Never throws. */
export const notifyAdmins = async (
  type: NotificationType,
  title: string,
  message: string,
  data: Record<string, unknown> = {}
): Promise<void> => {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id').lean();
    if (admins.length === 0) return;
    const created = await Notification.insertMany(
      admins.map((admin) => ({ user: admin._id, type, title, message, data }))
    );
    const n = created[0];
    emitAdminNotification({ id: n.id, type: n.type, title: n.title, message: n.message, createdAt: n.createdAt });
  } catch (err) {
    console.error('[Notification] Failed to notify admins:', err);
  }
};

/** Store a notification for one user and push it over their socket room. Never throws. */
export const notifyUser = async (
  userId: Types.ObjectId | string,
  type: NotificationType,
  title: string,
  message: string,
  data: Record<string, unknown> = {}
): Promise<void> => {
  try {
    const n = await Notification.create({ user: userId, type, title, message, data });
    emitNewNotification(String(userId), {
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      createdAt: n.createdAt,
    });
  } catch (err) {
    console.error('[Notification] Failed to notify user:', err);
  }
};
