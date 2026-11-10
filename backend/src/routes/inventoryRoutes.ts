import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { adjustStock, getStockMovements } from '../controllers/inventoryController';

const router = Router();

router.use(authenticate, requireAdmin);
router.get('/movements', getStockMovements);
router.post('/products/:id', adjustStock);

export default router;
