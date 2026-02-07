/**
 * Authentication service
 * Handles user registration, login, and token generation
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import {
  User,
  UserResponse,
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  GoogleAuthRequest,
  JWTPayload,
  ErrorCode,
  HttpStatus,
} from '@bettermind/shared';
import { query, queryOne } from '../database/db';
import { AppError } from '../middleware/error.middleware';
import config from '../config';

// Google OAuth client
const googleClient = new OAuth2Client(config.google.clientId);

/**
 * Number of bcrypt salt rounds
 * Higher = more secure but slower
 */
const SALT_ROUNDS = 10;

/**
 * Converts database user to API response format
 * Removes sensitive fields and formats dates
 */
function userToResponse(user: any): UserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    description: user.description,
    problems: user.problems,
    authProvider: user.auth_provider,
    avatarUrl: user.avatar_url,
    createdAt: user.created_at.toISOString(),
    updatedAt: user.updated_at.toISOString(),
  };
}

/**
 * Generates a JWT token for a user
 */
function generateToken(userId: string, email: string): string {
  const payload: JWTPayload = {
    userId,
    email,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

/**
 * Register a new user with email and password
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const { email, password, name } = data;

  // Check if user already exists
  const existingUser = await queryOne(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (existingUser) {
    throw new AppError(
      HttpStatus.CONFLICT,
      'User with this email already exists',
      ErrorCode.USER_ALREADY_EXISTS
    );
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const user = await queryOne<any>(
    `INSERT INTO users (email, name, password_hash, auth_provider)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [email.toLowerCase(), name, passwordHash, 'local']
  );

  if (!user) {
    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Failed to create user',
      ErrorCode.INTERNAL_ERROR
    );
  }

  // Generate JWT token
  const token = generateToken(user.id, user.email);

  return {
    token,
    user: userToResponse(user),
  };
}

/**
 * Login with email and password
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const { email, password } = data;

  // Find user by email
  const user = await queryOne<any>(
    'SELECT * FROM users WHERE email = $1 AND auth_provider = $2',
    [email.toLowerCase(), 'local']
  );

  if (!user) {
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      'Invalid email or password',
      ErrorCode.INVALID_CREDENTIALS
    );
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      'Invalid email or password',
      ErrorCode.INVALID_CREDENTIALS
    );
  }

  // Generate JWT token
  const token = generateToken(user.id, user.email);

  return {
    token,
    user: userToResponse(user),
  };
}

/**
 * Authenticate with Google OAuth
 * Verifies Google ID token and creates/updates user
 */
export async function googleAuth(data: GoogleAuthRequest): Promise<AuthResponse> {
  try {
    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: data.idToken,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        'Invalid Google token',
        ErrorCode.INVALID_INPUT
      );
    }

    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists
    let user = await queryOne<any>(
      'SELECT * FROM users WHERE google_id = $1',
      [googleId]
    );

    if (!user) {
      // Check if email is already used with local auth
      const existingUser = await queryOne(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser) {
        throw new AppError(
          HttpStatus.CONFLICT,
          'Email already registered with password. Please login with password.',
          ErrorCode.USER_ALREADY_EXISTS
        );
      }

      // Create new user
      user = await queryOne<any>(
        `INSERT INTO users (email, name, google_id, auth_provider, avatar_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [email.toLowerCase(), name || 'User', googleId, 'google', picture]
      );
    } else {
      // Update existing user's info
      user = await queryOne<any>(
        `UPDATE users 
         SET name = $1, avatar_url = $2, updated_at = CURRENT_TIMESTAMP
         WHERE google_id = $3
         RETURNING *`,
        [name || user.name, picture || user.avatar_url, googleId]
      );
    }

    if (!user) {
      throw new AppError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Failed to authenticate with Google',
        ErrorCode.INTERNAL_ERROR
      );
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    return {
      token,
      user: userToResponse(user),
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error('Google auth error:', error);
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'Failed to verify Google token',
      ErrorCode.INVALID_INPUT
    );
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<UserResponse> {
  const user = await queryOne<any>(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );

  if (!user) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      'User not found',
      ErrorCode.USER_NOT_FOUND
    );
  }

  return userToResponse(user);
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  updates: { name?: string; description?: string; problems?: string; avatarUrl?: string }
): Promise<UserResponse> {
  // Build dynamic update query
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramCount++}`);
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramCount++}`);
    values.push(updates.description);
  }
  if (updates.problems !== undefined) {
    fields.push(`problems = $${paramCount++}`);
    values.push(updates.problems);
  }
  if (updates.avatarUrl !== undefined) {
    fields.push(`avatar_url = $${paramCount++}`);
    values.push(updates.avatarUrl);
  }

  if (fields.length === 0) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      'No fields to update',
      ErrorCode.INVALID_INPUT
    );
  }

  values.push(userId);

  const user = await queryOne<any>(
    `UPDATE users 
     SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING *`,
    values
  );

  if (!user) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      'User not found',
      ErrorCode.USER_NOT_FOUND
    );
  }

  return userToResponse(user);
}
