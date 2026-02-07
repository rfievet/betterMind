/**
 * User-related TypeScript types
 * These types are shared between frontend and backend to ensure type safety
 */

/**
 * Authentication provider types
 * - 'local': Email/password authentication
 * - 'google': Google OAuth authentication
 */
export type AuthProvider = 'local' | 'google';

/**
 * User entity as stored in the database
 * This represents the complete user record
 */
export interface User {
  id: string;
  email: string;
  name: string;
  // Password hash - only for local auth users, null for OAuth users
  passwordHash?: string | null;
  // User's self-description and life context for AI personalization
  description?: string | null;
  // User's stated problems/challenges they want to work on
  problems?: string | null;
  // Which authentication method was used
  authProvider: AuthProvider;
  // Google OAuth ID (only for Google auth users)
  googleId?: string | null;
  // Profile picture URL (from Google or uploaded)
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User data returned to client (excludes sensitive fields)
 * Never send password hashes or internal IDs to the frontend
 */
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  description?: string | null;
  problems?: string | null;
  authProvider: AuthProvider;
  avatarUrl?: string | null;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Request body for user registration with email/password
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

/**
 * Request body for user login with email/password
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Request body for Google OAuth authentication
 */
export interface GoogleAuthRequest {
  // ID token from Google OAuth flow
  idToken: string;
}

/**
 * Response after successful authentication
 * Contains JWT token and user data
 */
export interface AuthResponse {
  token: string; // JWT token for subsequent requests
  user: UserResponse;
}

/**
 * Request body for updating user profile
 */
export interface UpdateProfileRequest {
  name?: string;
  description?: string;
  problems?: string;
  avatarUrl?: string;
}

/**
 * JWT token payload
 * This is what gets encoded in the JWT token
 */
export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number; // Issued at timestamp
  exp?: number; // Expiration timestamp
}
