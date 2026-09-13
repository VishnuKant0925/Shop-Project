import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Route imports
import authRoutes from './routes/authRoutes';
import categoryRoutes from './routes/categoryRoutes';
import productRoutes from './routes/productRoutes';
import serviceRoutes from './routes/serviceRoutes';
import orderRoutes from './routes/orderRoutes';
import callbackRoutes from './routes/callbackRoutes';
import healthRoutes from './routes/healthRoutes';
import { errorHandler } from './middleware/errorHandler';

export const createApp = (): Application => {
  const app = express();

  // Security and HTTP headers
  app.use(helmet());

  // CORS configuration
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  app.use(
    cors({
      origin: [clientUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
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
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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
