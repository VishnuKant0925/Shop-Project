import { Router } from 'express';
import {
  getProducts,
  getProductBySlugOrId,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, getProducts);
router.get('/:identifier', optionalAuth, getProductBySlugOrId);
router.post('/', authenticate, requireAdmin, createProduct);
router.put('/:id', authenticate, requireAdmin, updateProduct);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);

export default router;
