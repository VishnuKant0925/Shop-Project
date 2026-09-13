import { Router } from 'express';
import {
  register,
  login,
  googleLogin,
  requestOtp,
  verifyOtp,
  logout,
  getMe,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/otp/request', requestOtp);
router.post('/otp/verify', verifyOtp);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
