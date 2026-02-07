/**
 * Authentication routes
 * Handles user registration, login, and profile management
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import * as authService from '../services/auth.service';
import { isValidEmail, isValidPassword, isValidName } from '@bettermind/shared';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new user with email and password
 */
router.post(
  '/register',
  [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .custom((value) => isValidEmail(value)).withMessage('Invalid email format'),
    body('password')
      .notEmpty().withMessage('Password is required')
      .custom((value) => isValidPassword(value))
      .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .custom((value) => isValidName(value))
      .withMessage('Name must be between 2 and 100 characters'),
    validate,
  ],
  asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      data: result,
      message: 'User registered successfully',
    });
  })
);

/**
 * POST /api/v1/auth/login
 * Login with email and password
 */
router.post(
  '/login',
  [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format'),
    body('password')
      .notEmpty().withMessage('Password is required'),
    validate,
  ],
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.json({
      success: true,
      data: result,
      message: 'Login successful',
    });
  })
);

/**
 * POST /api/v1/auth/google
 * Authenticate with Google OAuth
 */
router.post(
  '/google',
  [
    body('idToken')
      .notEmpty().withMessage('Google ID token is required'),
    validate,
  ],
  asyncHandler(async (req, res) => {
    const result = await authService.googleAuth(req.body);
    res.json({
      success: true,
      data: result,
      message: 'Google authentication successful',
    });
  })
);

/**
 * GET /api/v1/auth/me
 * Get current user profile (requires authentication)
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await authService.getUserById(req.user!.userId);
    res.json({
      success: true,
      data: user,
    });
  })
);

/**
 * PATCH /api/v1/auth/profile
 * Update user profile (requires authentication)
 */
router.patch(
  '/profile',
  authenticate,
  [
    body('name')
      .optional()
      .trim()
      .custom((value) => isValidName(value))
      .withMessage('Name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must be less than 2000 characters'),
    body('problems')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Problems must be less than 2000 characters'),
    body('avatarUrl')
      .optional()
      .trim()
      .isURL().withMessage('Invalid avatar URL'),
    validate,
  ],
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await authService.updateProfile(req.user!.userId, req.body);
    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully',
    });
  })
);

export default router;
