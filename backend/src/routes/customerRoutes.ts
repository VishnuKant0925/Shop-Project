import { Router } from 'express';
import {
  getAllCustomers,
  getCustomerById,
  sendPromotions,
} from '../controllers/customerController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All customer management routes require admin authentication
router.use(authenticate, requireAdmin);

router.get('/', getAllCustomers);
router.get('/:id', getCustomerById);
router.post('/send-promotions', sendPromotions);

export default router;
