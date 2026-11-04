import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import {
  createCallback,
  getCallbacks,
  updateCallbackStatus,
  deleteCallback,
} from '../controllers/callbackController';

const router = Router();

router.post('/', rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: 'Too many requests. Please call us directly.' }), createCallback);
router.get('/', authenticate, requireAdmin, getCallbacks);
router.patch('/:id', authenticate, requireAdmin, updateCallbackStatus);
router.delete('/:id', authenticate, requireAdmin, deleteCallback);

export default router;
