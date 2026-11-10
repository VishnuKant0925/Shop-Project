import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { createBill, getBills, getBill, voidBill } from '../controllers/billController';

const router = Router();

// Counter billing is for the shop owner only
router.use(authenticate, requireAdmin);
router.get('/', getBills);
router.post('/', createBill);
router.get('/:id', getBill);
router.post('/:id/void', voidBill);

export default router;
