/**
 * Authentication middleware
 * Verifies JWT tokens and attaches user info to requests
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload, ErrorCode, HttpStatus } from '@bettermind/shared';
import config from '../config';

/**
 * Extended Express Request with user information
 * After authentication, req.user contains the authenticated user's data
 */
export interface AuthRequest extends Request {
  user?: JWTPayload;
}

/**
 * Authentication middleware
 * Validates JWT token from Authorization header
 * Attaches decoded user info to req.user
 * 
 * Usage: Add to routes that require authentication
 * Example: router.get('/profile', authenticate, getProfile)
 */
export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extract token from Authorization header
    // Expected format: "Bearer <token>"
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        error: {
          message: 'No authorization token provided',
          code: ErrorCode.UNAUTHORIZED,
        },
      });
      return;
    }

    // Check if header starts with "Bearer "
    if (!authHeader.startsWith('Bearer ')) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        error: {
          message: 'Invalid authorization header format. Use: Bearer <token>',
          code: ErrorCode.UNAUTHORIZED,
        },
      });
      return;
    }

    // Extract the token (remove "Bearer " prefix)
    const token = authHeader.substring(7);

    // Verify and decode the JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    // Attach user info to request object
    req.user = decoded;

    // Continue to the next middleware/route handler
    next();
  } catch (error) {
    // Handle JWT-specific errors
    if (error instanceof jwt.TokenExpiredError) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        error: {
          message: 'Token has expired',
          code: ErrorCode.TOKEN_EXPIRED,
        },
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        error: {
          message: 'Invalid token',
          code: ErrorCode.TOKEN_INVALID,
        },
      });
      return;
    }

    // Generic error
    res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      error: {
        message: 'Authentication failed',
        code: ErrorCode.UNAUTHORIZED,
      },
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't require it
 * Useful for routes that work differently for authenticated vs anonymous users
 */
export function optionalAuthenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
}
