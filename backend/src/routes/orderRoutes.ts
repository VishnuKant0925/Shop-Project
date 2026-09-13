import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} from '../controllers/orderController';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth';

const router = Router();

router.post('/', optionalAuth, createOrder);
router.get('/my', authenticate, getMyOrders);
router.get('/', authenticate, requireAdmin, getAllOrders);
router.get('/:id', authenticate, getOrderById);
router.patch('/:id/status', authenticate, requireAdmin, updateOrderStatus);

export default router;
