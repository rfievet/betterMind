/**
 * Request validation middleware
 * Uses express-validator to validate request data
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ErrorCode, HttpStatus } from '@bettermind/shared';

/**
 * Validation middleware
 * Checks for validation errors from express-validator
 * Returns 400 Bad Request if validation fails
 * 
 * Usage:
 * router.post('/register',
 *   body('email').isEmail(),
 *   body('password').isLength({ min: 8 }),
 *   validate,
 *   registerHandler
 * );
 */
export function validate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Get validation errors from express-validator
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Format errors into a more readable structure
    const formattedErrors = errors.array().reduce((acc, error) => {
      // @ts-ignore - express-validator types are complex
      const field = error.param || error.path || 'unknown';
      acc[field] = error.msg;
      return acc;
    }, {} as Record<string, string>);

    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: ErrorCode.VALIDATION_ERROR,
        details: formattedErrors,
      },
    });
    return;
  }

  // No errors, continue to next middleware
  next();
}

/**
 * Combines validation chains with the validate middleware
 * Cleaner syntax for route definitions
 * 
 * Usage:
 * router.post('/register', validateRequest([
 *   body('email').isEmail().withMessage('Invalid email'),
 *   body('password').isLength({ min: 8 }).withMessage('Password too short'),
 * ]), registerHandler);
 */
export function validateRequest(validations: ValidationChain[]) {
  return [...validations, validate];
}
