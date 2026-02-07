/**
 * Main application entry point
 * Sets up Express server with all middleware and routes
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import config from './config';
import { testConnection } from './database/db';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import conversationRoutes from './routes/conversation.routes';

/**
 * Create and configure Express application
 */
async function createApp() {
  const app = express();

  // ===== Middleware =====

  // CORS - Allow requests from frontend applications
  app.use(cors({
    origin: config.cors.origins,
    credentials: true,
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Serve uploaded files (audio files)
  app.use('/uploads', express.static(config.upload.directory));

  // Request logging in development
  if (config.isDevelopment) {
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });
  }

  // ===== Routes =====

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
      },
    });
  });

  // API routes
  const API_PREFIX = '/api/v1';
  app.use(`${API_PREFIX}/auth`, authRoutes);
  app.use(`${API_PREFIX}/conversations`, conversationRoutes);

  // API documentation endpoint
  app.get(`${API_PREFIX}/docs`, (req, res) => {
    res.json({
      success: true,
      data: {
        version: '1.0.0',
        endpoints: {
          auth: {
            'POST /auth/register': 'Register a new user',
            'POST /auth/login': 'Login with email/password',
            'POST /auth/google': 'Login with Google OAuth',
            'GET /auth/me': 'Get current user profile',
            'PATCH /auth/profile': 'Update user profile',
          },
          conversations: {
            'POST /conversations': 'Create a new conversation',
            'GET /conversations': 'Get all user conversations',
            'GET /conversations/:id': 'Get conversation with messages',
            'POST /conversations/:id/messages': 'Send a text message',
            'POST /conversations/:conversationId/messages/:messageId/voice': 'Generate voice for message',
            'DELETE /conversations/:id': 'Delete a conversation',
          },
        },
      },
    });
  });

  // ===== Error Handling =====

  // 404 handler (must be after all routes)
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Start the server
 */
async function startServer() {
  try {
    console.log('🚀 Starting betterMind API...');

    // Test database connection
    await testConnection();

    // Create Express app
    const app = await createApp();

    // Start listening
    app.listen(config.port, () => {
      console.log(`✅ Server running on port ${config.port}`);
      console.log(`📝 Environment: ${config.nodeEnv}`);
      console.log(`🔗 API: http://localhost:${config.port}/api/v1`);
      console.log(`📚 Docs: http://localhost:${config.port}/api/v1/docs`);
      console.log(`💚 Health: http://localhost:${config.port}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export { createApp, startServer };
