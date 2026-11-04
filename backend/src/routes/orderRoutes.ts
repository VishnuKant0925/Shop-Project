import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  uploadPaymentScreenshot,
  screenshotUpload,
  cancelMyOrder,
} from '../controllers/orderController';

const router = Router();

const orderLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20, message: 'Too many orders from this device. Please wait a few minutes.' });

router.post('/', authenticate, orderLimiter, createOrder);
router.post('/:id/payment-screenshot', authenticate, orderLimiter, screenshotUpload, uploadPaymentScreenshot);
router.post('/:id/cancel', authenticate, cancelMyOrder);
router.get('/my', authenticate, getMyOrders);
router.get('/', authenticate, requireAdmin, getAllOrders);
router.get('/:id', authenticate, getOrderById);
router.patch('/:id/status', authenticate, requireAdmin, updateOrderStatus);
router.patch('/:id', authenticate, requireAdmin, updateOrderStatus);

export default router;
