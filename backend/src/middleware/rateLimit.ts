import { Request, Response, NextFunction } from 'express';

/**
 * Small in-memory fixed-window rate limiter (per IP + route group).
 * Good enough for a single API instance; swap for a shared store if the API is scaled out.
 */
export const rateLimit = ({ windowMs, max, message }: { windowMs: number; max: number; message?: string }) => {
  const hits = new Map<string, { count: number; resetAt: number }>();

  // Periodically drop expired buckets so memory stays bounded.
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of hits) if (bucket.resetAt <= now) hits.delete(key);
  }, windowMs).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const bucket = hits.get(key);

    if (!bucket || bucket.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    bucket.count += 1;
    if (bucket.count > max) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
      res.status(429).json({ success: false, message: message || 'Too many requests. Please try again shortly.' });
      return;
    }
    next();
  };
};
