/**
 * Application configuration
 * Loads and validates environment variables
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

/**
 * Validates that required environment variables are set
 * Throws an error if any required variable is missing
 */
function validateEnv(): void {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'GEMINI_API_KEY',
    'ELEVENLABS_API_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please copy .env.example to .env and fill in the values.'
    );
  }
}

// Validate environment on startup
validateEnv();

/**
 * Application configuration object
 * Centralizes all configuration values
 */
export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',

  // Database configuration
  database: {
    url: process.env.DATABASE_URL!,
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: '7d', // Token expires in 7 days
  },

  // Google OAuth configuration
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },

  // Gemini AI configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY!,
    model: 'gemini-2.5-flash', // Gemini 2.5 Flash model
  },

  // ElevenLabs configuration
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY!,
    defaultVoiceId: process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL',
  },

  // CORS configuration
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:19006',
    ],
  },

  // File upload configuration
  upload: {
    directory: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
  },
} as const;

export default config;
