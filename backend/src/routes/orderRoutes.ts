import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  uploadPaymentScreenshot,
  screenshotUpload,
} from '../controllers/orderController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createOrder);
router.post('/:id/payment-screenshot', authenticate, screenshotUpload, uploadPaymentScreenshot);
router.get('/my', authenticate, getMyOrders);
router.get('/', authenticate, requireAdmin, getAllOrders);
router.get('/:id', authenticate, getOrderById);
router.patch('/:id/status', authenticate, requireAdmin, updateOrderStatus);

export default router;
