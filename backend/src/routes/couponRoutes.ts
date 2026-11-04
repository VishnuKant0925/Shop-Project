import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/couponController';

const router = Router();

// Throttled so codes can't be brute-forced.
router.post('/validate', rateLimit({ windowMs: 10 * 60 * 1000, max: 30 }), validateCoupon);
router.get('/', authenticate, requireAdmin, getCoupons);
router.post('/', authenticate, requireAdmin, createCoupon);
router.put('/:id', authenticate, requireAdmin, updateCoupon);
router.delete('/:id', authenticate, requireAdmin, deleteCoupon);

export default router;
