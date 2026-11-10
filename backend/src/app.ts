import express, { Application, Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsOriginDelegate } from './config/cors';

// Route imports
import authRoutes from './routes/authRoutes';
import categoryRoutes from './routes/categoryRoutes';
import productRoutes from './routes/productRoutes';
import serviceRoutes from './routes/serviceRoutes';
import orderRoutes from './routes/orderRoutes';
import callbackRoutes from './routes/callbackRoutes';
import healthRoutes from './routes/healthRoutes';
import notificationRoutes from './routes/notificationRoutes';
import statsRoutes from './routes/statsRoutes';
import uploadRoutes from './routes/uploadRoutes';
import customerRoutes from './routes/customerRoutes';
import couponRoutes from './routes/couponRoutes';
import settingsRoutes from './routes/settingsRoutes';
import billRoutes from './routes/billRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import { errorHandler } from './middleware/errorHandler';

export const createApp = (): Application => {
  const app = express();

  // Render / Vercel sit behind one proxy hop: needed for real client IPs (rate limiting) and https URLs.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // Security and HTTP headers (permits cross-origin loading of images like screenshots)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // Gzip JSON responses (product lists, orders) — large win on mobile connections.
  app.use(compression());

  // Legacy: screenshots saved to disk before uploads became Cloudinary-only (kept so old links still resolve)
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), { maxAge: '7d' }));

  // CORS configuration (supports newpanditmasala.shop, Vercel deployments, CLIENT_URL, localhost)
  app.use(
    cors({
      origin: corsOriginDelegate,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Request logging
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Body parsers
  app.use(express.json({ limit: '200kb' }));
  app.use(express.urlencoded({ extended: true, limit: '200kb' }));

  // Root welcome endpoint
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'New Pandit Masala & Tel Mill API is running',
      docs: '/api/health',
    });
  });

  // API Route Handlers
  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/services', serviceRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/callbacks', callbackRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/coupons', couponRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/bills', billRoutes);
  app.use('/api/inventory', inventoryRoutes);

  // 404 Route Handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'Resource or API route not found',
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};
