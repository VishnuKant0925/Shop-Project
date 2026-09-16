import { createHash, randomInt, randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth';
import { LoginOtp } from '../models/LoginOtp';
import { RevokedToken } from '../models/RevokedToken';
import { IUser, User } from '../models/User';
import { sendLoginOtpEmail } from '../services/emailService';

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const generateToken = (user: IUser): string => {
  const secret = process.env.JWT_SECRET || 'pandit_mill_secret_key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: user._id, role: user.role, jti: randomUUID() }, secret, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
  });
};

const userResponse = (user: IUser) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
});

const respondWithSession = (res: Response, user: IUser, message: string, status = 200): void => {
  res.status(status).json({
    success: true,
    message,
    token: generateToken(user),
    user: userResponse(user),
  });
};

const normaliseEmail = (email: unknown): string =>
  typeof email === 'string' ? email.trim().toLowerCase() : '';

const validEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const hashOtp = (email: string, code: string): string =>
  createHash('sha256').update(`${email}:${code}`).digest('hex');

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, phone, password } = req.body;
    const email = normaliseEmail(req.body.email);

    if (!name || !email || !phone || !password) {
      res.status(400).json({ success: false, message: 'Please provide all required fields (name, email, phone, password)' });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'An account with this email already exists' });
      return;
    }

    const user = await User.create({
      name: String(name).trim(),
      email,
      phone: String(phone).trim(),
      password,
      // Public registration must never be able to grant administrator access.
      role: 'customer',
    });

    respondWithSession(res, user, 'Account registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { password } = req.body;
    const email = normaliseEmail(req.body.email);

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Please provide email and password' });
      return;
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password || !(await user.comparePassword(password))) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    respondWithSession(res, user, 'Logged in successfully');
  } catch (error) {
    next(error);
  }
};

export const googleLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const credential = typeof req.body.credential === 'string' ? req.body.credential : '';
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!credential) {
      res.status(400).json({ success: false, message: 'Google credential is required' });
      return;
    }
    if (!clientId) {
      res.status(503).json({ success: false, message: 'Google sign-in is not configured on the server' });
      return;
    }

    const ticket = await new OAuth2Client(clientId).verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    const email = normaliseEmail(payload?.email);

    if (!payload?.sub || !email || !payload.email_verified) {
      res.status(401).json({ success: false, message: 'Google could not verify this email address' });
      return;
    }

    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = payload.sub;
        await user.save();
      } else {
        user = await User.create({
          name: payload.name?.trim() || email.split('@')[0],
          email,
          phone: '',
          googleId: payload.sub,
          role: 'customer',
        });
      }
    }

    respondWithSession(res, user, 'Signed in with Google successfully');
  } catch (error) {
    next(error);
  }
};

export const requestOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const email = normaliseEmail(req.body.email);
    if (!validEmail(email)) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address' });
      return;
    }

    // Keep this response neutral so this endpoint cannot be used to enumerate accounts.
    const user = await User.findOne({ email });
    if (!user) {
      res.status(200).json({ success: true, message: 'If an account exists for this email, a sign-in code has been sent.' });
      return;
    }

    const now = new Date();
    const currentOtp = await LoginOtp.findOne({ email });
    if (currentOtp && now.getTime() - currentOtp.lastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
      res.status(429).json({ success: false, message: 'Please wait one minute before requesting another code.' });
      return;
    }

    const code = randomInt(100000, 1000000).toString();
    await LoginOtp.findOneAndUpdate(
      { email },
      {
        $set: {
          codeHash: hashOtp(email, code),
          expiresAt: new Date(now.getTime() + OTP_EXPIRY_MS),
          attempts: 0,
          lastSentAt: now,
        },
        $setOnInsert: { email },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    try {
      await sendLoginOtpEmail(email, code);
    } catch (emailError) {
      await LoginOtp.deleteOne({ email });
      throw emailError;
    }

    res.status(200).json({ success: true, message: 'A six-digit sign-in code has been sent to your email.' });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const email = normaliseEmail(req.body.email);
    const code = typeof req.body.code === 'string' ? req.body.code.trim() : '';

    if (!validEmail(email) || !/^\d{6}$/.test(code)) {
      res.status(400).json({ success: false, message: 'Enter a valid email address and six-digit code' });
      return;
    }

    const otp = await LoginOtp.findOne({ email }).select('+codeHash');
    if (!otp || otp.expiresAt.getTime() <= Date.now()) {
      if (otp) await LoginOtp.deleteOne({ _id: otp._id });
      res.status(401).json({ success: false, message: 'This sign-in code is invalid or has expired' });
      return;
    }

    if (otp.attempts >= MAX_OTP_ATTEMPTS) {
      await LoginOtp.deleteOne({ _id: otp._id });
      res.status(429).json({ success: false, message: 'Too many incorrect attempts. Please request a new code.' });
      return;
    }

    if (otp.codeHash !== hashOtp(email, code)) {
      await LoginOtp.updateOne({ _id: otp._id }, { $inc: { attempts: 1 } });
      res.status(401).json({ success: false, message: 'This sign-in code is invalid or has expired' });
      return;
    }

    const user = await User.findOne({ email });
    await LoginOtp.deleteOne({ _id: otp._id });
    if (!user) {
      res.status(401).json({ success: false, message: 'This sign-in code is invalid or has expired' });
      return;
    }

    respondWithSession(res, user, 'Logged in successfully');
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jti, exp } = req.tokenPayload || {};
    if (jti && exp) {
      await RevokedToken.updateOne(
        { tokenId: jti },
        { $setOnInsert: { expiresAt: new Date(exp * 1000) } },
        { upsert: true }
      );
    }
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

  res.status(200).json({ success: true, user: userResponse(req.user) });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    const { name, phone, password } = req.body;

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (trimmedName.length === 0 || trimmedName.length > 60) {
        res.status(400).json({ success: false, message: 'Name must be between 1 and 60 characters.' });
        return;
      }
      req.user.name = trimmedName;
    }

    if (phone !== undefined) {
      req.user.phone = String(phone).trim();
    }

    if (password !== undefined) {
      const pwd = String(password);
      if (pwd.length < 6) {
        res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        return;
      }
      req.user.password = pwd;
    }

    await req.user.save();

    // Also update the session token so the stored user data is fresh
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      token: generateToken(req.user),
      user: userResponse(req.user),
    });
  } catch (error) {
    next(error);
  }
};
