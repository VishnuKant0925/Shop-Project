import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { uploadImageFile } from '../config/cloudinary';

const router = Router();

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files (JPEG, PNG, WebP) are accepted.'));
  },
}).single('image');

router.post(
  '/image',
  authenticate,
  requireAdmin,
  imageUpload,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'Please attach an image file.' });
        return;
      }

      const folder = typeof req.body.folder === 'string' && req.body.folder.trim()
        ? `pandit-mill/${req.body.folder.trim()}`
        : 'pandit-mill/general';

      const url = await uploadImageFile(req.file.buffer, folder);

      res.status(200).json({ success: true, url });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
