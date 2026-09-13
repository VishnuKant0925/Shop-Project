import { Router } from 'express';
import {
  getProducts,
  getProductBySlugOrId,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getProducts);
router.get('/:identifier', getProductBySlugOrId);
router.post('/', authenticate, requireAdmin, createProduct);
router.put('/:id', authenticate, requireAdmin, updateProduct);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);

export default router;
