/**
 * Error handling middleware
 * Catches and formats errors consistently across the API
 */

import { Request, Response, NextFunction } from 'express';
import { ErrorCode, HttpStatus } from '@bettermind/shared';
import config from '../config';

/**
 * Custom application error class
 * Allows throwing errors with specific status codes and error codes
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: ErrorCode,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 * Must be registered AFTER all routes
 * Catches all errors and returns consistent error responses
 */
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error in development
  if (config.isDevelopment) {
    console.error('❌ Error:', error);
  }

  // Handle AppError (our custom errors)
  if (error instanceof AppError) {
    const statusCode = error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
    res.status(statusCode).json({
      success: false,
      error: {
        message: error.message,
        code: error.code || ErrorCode.INTERNAL_ERROR,
        ...(error.details && { details: error.details }),
      },
    });
    return;
  }

  // Handle validation errors from express-validator
  if (error.name === 'ValidationError') {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: ErrorCode.VALIDATION_ERROR,
        details: error.message,
      },
    });
    return;
  }

  // Handle database errors
  if (error.name === 'QueryFailedError' || error.message.includes('database')) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        message: 'Database error occurred',
        code: ErrorCode.INTERNAL_ERROR,
        // Don't expose database details in production
        ...(config.isDevelopment && { details: error.message }),
      },
    });
    return;
  }

  // Generic error handler
  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: {
      message: config.isProduction 
        ? 'An unexpected error occurred' 
        : error.message,
      code: ErrorCode.INTERNAL_ERROR,
      // Include stack trace in development
      ...(config.isDevelopment && { stack: error.stack }),
    },
  });
}

/**
 * 404 Not Found handler
 * Catches requests to undefined routes
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.status(HttpStatus.NOT_FOUND).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: ErrorCode.NOT_FOUND,
    },
  });
}

/**
 * Async route handler wrapper
 * Catches errors in async route handlers and passes them to error middleware
 * 
 * Usage:
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await getUsers();
 *   res.json(users);
 * }));
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
