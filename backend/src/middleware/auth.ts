import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { RevokedToken } from '../models/RevokedToken';

export interface AuthRequest extends Request {
  user?: IUser;
  tokenPayload?: JwtPayload;
}

export interface JwtPayload {
  id: string;
  role: 'customer' | 'admin';
  jti?: string;
  exp?: number;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({ success: false, message: 'Authentication required. Please login.' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'pandit_mill_secret_key';
    const decoded = jwt.verify(token, secret) as JwtPayload;

    if (decoded.jti && await RevokedToken.exists({ tokenId: decoded.jti })) {
      res.status(401).json({ success: false, message: 'This session has been logged out. Please login again.' });
      return;
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({ success: false, message: 'User account no longer exists.' });
      return;
    }

    req.user = user;
    req.tokenPayload = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
    return;
  }
  next();
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'pandit_mill_secret_key';
      const decoded = jwt.verify(token, secret) as JwtPayload;
      if (decoded.jti && await RevokedToken.exists({ tokenId: decoded.jti })) {
        next();
        return;
      }
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
        req.tokenPayload = decoded;
      }
    }
  } catch {
    // Ignore invalid token in optionalAuth
  }
  next();
};
