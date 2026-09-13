import { Router } from 'express';
import {
  createCallback,
  getCallbacks,
  updateCallbackStatus,
} from '../controllers/callbackController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/', createCallback);
router.get('/', authenticate, requireAdmin, getCallbacks);
router.patch('/:id', authenticate, requireAdmin, updateCallbackStatus);

export default router;
