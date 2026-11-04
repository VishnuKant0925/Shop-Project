import { Router } from 'express';
import {
  register,
  login,
  googleLogin,
  requestOtp,
  verifyOtp,
  logout,
  getMe,
  updateProfile,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

// Brute-force protection for credential and OTP endpoints.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many sign-in attempts. Please wait 15 minutes and try again.' });
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: 'Too many code requests. Please wait 15 minutes.' });

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleLogin);
router.post('/otp/request', otpLimiter, requestOtp);
router.post('/otp/verify', authLimiter, verifyOtp);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);

export default router;
