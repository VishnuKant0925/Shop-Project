import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { createApp } from './app';
import { connectDB } from './config/db';
import mongoose from 'mongoose';
import { initialiseRealtime } from './realtime';

const startServer = () => {
  const port = process.env.PORT || 5000;
  const app = createApp();
  const httpServer = createServer(app);
  initialiseRealtime(httpServer);

  const server = httpServer.listen(port, () => {
    console.log(`====================================================`);
    console.log(`🚀 Pandit Mill Server is running on port ${port}`);
    console.log(`🌐 Health check: http://localhost:${port}/api/health`);
    console.log(`🛒 Products:     http://localhost:${port}/api/products`);
    console.log(`⚙️  Services:     http://localhost:${port}/api/services`);
    console.log(`====================================================`);
  });

  // Attempt database connection in background
  connectDB();

  // Graceful shutdown handlers
  const handleShutdown = (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      await mongoose.connection.close().catch(() => undefined);
      process.exit(0);
    });
    // Force exit if open sockets keep the server alive
    setTimeout(() => process.exit(0), 10000).unref();
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
};

startServer();
