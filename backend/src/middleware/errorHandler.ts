import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: number;
  keyValue?: Record<string, any>;
  errors?: Record<string, any>;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000 && err.keyValue) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value entered for '${field}'. Please use another value.`;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e: any) => e.message)
      .join(', ');
  }

  // Upload errors (file too large, wrong field) and file-type rejections are client errors
  if (err.name === 'MulterError' || /Only image files/.test(message)) {
    statusCode = 400;
    if ((err as { code?: unknown }).code === 'LIMIT_FILE_SIZE') message = 'Image must be smaller than 5 MB.';
  }

  // Malformed JSON body
  if (err.name === 'SyntaxError' && (err as { type?: string }).type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid request body.';
  }

  if (statusCode >= 500) {
    console.error('[Error]', err);
    // Never leak internal error details to clients in production (unless written for the customer)
    if (process.env.NODE_ENV === 'production' && !(err as { expose?: boolean }).expose) {
      message = 'Something went wrong. Please try again.';
    }
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found or invalid ID format';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
