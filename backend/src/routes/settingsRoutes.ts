import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { getSettings, updateSettings } from '../controllers/settingsController';

const router = Router();

router.get('/', getSettings);
router.put('/', authenticate, requireAdmin, updateSettings);

export default router;
