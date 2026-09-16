import { Router } from 'express';
import { getDashboardStats } from '../controllers/statsController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/dashboard', authenticate, requireAdmin, getDashboardStats);

export default router;
