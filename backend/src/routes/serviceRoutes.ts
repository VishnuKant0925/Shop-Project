import { Router } from 'express';
import {
  getServices,
  getServiceBySlugOrId,
  createService,
  updateService,
  deleteService,
} from '../controllers/serviceController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getServices);
router.get('/:identifier', getServiceBySlugOrId);
router.post('/', authenticate, requireAdmin, createService);
router.put('/:id', authenticate, requireAdmin, updateService);
router.delete('/:id', authenticate, requireAdmin, deleteService);

export default router;
