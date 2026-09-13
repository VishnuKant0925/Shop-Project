import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][
    mongoose.connection.readyState
  ] || 'unknown';

  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: dbStatus,
      readyState: mongoose.connection.readyState,
    },
    service: 'Pandit Mill API',
  });
});

export default router;
