import { Router } from 'express';
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getMyNotifications);
router.get('/unread-count', authenticate, getUnreadCount);
router.patch('/:id/read', authenticate, markAsRead);
router.patch('/read-all', authenticate, markAllAsRead);

export default router;
