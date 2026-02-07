/**
 * Conversation routes
 * Handles conversation and message operations
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validation.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import * as conversationService from '../services/conversation.service';
import * as elevenlabsAgentService from '../services/elevenlabs-agent.service';

const router = Router();

// All conversation routes require authentication
router.use(authenticate);

/**
 * POST /api/v1/conversations
 * Create a new conversation
 */
router.post(
  '/',
  [
    body('title')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Title must be less than 255 characters'),
    validate,
  ],
  asyncHandler(async (req: AuthRequest, res) => {
    const conversation = await conversationService.createConversation(
      req.user!.userId,
      req.body.title
    );
    res.status(201).json({
      success: true,
      data: conversation,
      message: 'Conversation created successfully',
    });
  })
);

/**
 * GET /api/v1/conversations
 * Get all conversations for the current user
 */
router.get(
  '/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validate,
  ],
  asyncHandler(async (req: AuthRequest, res) => {
    const conversations = await conversationService.getUserConversations(
      req.user!.userId,
      {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      }
    );
    res.json({
      success: true,
      data: conversations,
    });
  })
);

/**
 * GET /api/v1/conversations/:id
 * Get a single conversation with all messages
 */
router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid conversation ID'),
    validate,
  ],
  asyncHandler(async (req: AuthRequest, res) => {
    const conversation = await conversationService.getConversationById(
      req.params.id,
      req.user!.userId
    );
    res.json({
      success: true,
      data: conversation,
    });
  })
);

/**
 * POST /api/v1/conversations/:id/messages
 * Send a text message in a conversation
 */
router.post(
  '/:id/messages',
  [
    param('id').isUUID().withMessage('Invalid conversation ID'),
    body('content')
      .trim()
      .notEmpty().withMessage('Message content is required')
      .isLength({ max: 5000 }).withMessage('Message must be less than 5000 characters'),
    validate,
  ],
  asyncHandler(async (req: AuthRequest, res) => {
    const result = await conversationService.sendTextMessage(
      req.params.id,
      req.user!.userId,
      req.body.content
    );
    res.status(201).json({
      success: true,
      data: result,
      message: 'Message sent successfully',
    });
  })
);

/**
 * POST /api/v1/conversations/:conversationId/messages/:messageId/voice
 * Generate voice audio for a text message
 */
router.post(
  '/:conversationId/messages/:messageId/voice',
  [
    param('conversationId').isUUID().withMessage('Invalid conversation ID'),
    param('messageId').isUUID().withMessage('Invalid message ID'),
    validate,
  ],
  asyncHandler(async (req: AuthRequest, res) => {
    const result = await conversationService.generateVoiceResponse(
      req.params.messageId,
      req.user!.userId
    );
    res.json({
      success: true,
      data: result,
      message: 'Voice generated successfully',
    });
  })
);

/**
 * DELETE /api/v1/conversations/:id
 * Delete a conversation
 */
router.delete(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid conversation ID'),
    validate,
  ],
  asyncHandler(async (req: AuthRequest, res) => {
    await conversationService.deleteConversation(
      req.params.id,
      req.user!.userId
    );
    res.status(204).send();
  })
);

/**
 * POST /api/v1/conversations/:id/voice-call
 * Get a signed URL for ElevenLabs voice call
 * This keeps the API key secure on the server
 */
router.post(
  '/:id/voice-call',
  [
    param('id').isUUID().withMessage('Invalid conversation ID'),
    validate,
  ],
  asyncHandler(async (req: AuthRequest, res) => {
    // Verify user owns this conversation
    await conversationService.getConversationById(
      req.params.id,
      req.user!.userId
    );

    // Get or create ElevenLabs agent
    const agentId = await elevenlabsAgentService.getOrCreateAgent();
    
    // Get signed URL for secure WebSocket connection
    const signedUrl = await elevenlabsAgentService.getSignedUrl(agentId);

    res.json({
      success: true,
      data: {
        signedUrl,
        conversationId: req.params.id,
      },
    });
  })
);

/**
 * POST /api/v1/conversations/:id/voice-transcript
 * Save voice call transcript to conversation
 */
router.post(
  '/:id/voice-transcript',
  [
    param('id').isUUID().withMessage('Invalid conversation ID'),
    body('transcript')
      .isArray()
      .withMessage('Transcript must be an array'),
    body('transcript.*.role')
      .isIn(['user', 'assistant'])
      .withMessage('Invalid role'),
    body('transcript.*.content')
      .trim()
      .notEmpty()
      .withMessage('Content is required'),
    validate,
  ],
  asyncHandler(async (req: AuthRequest, res) => {
    const result = await conversationService.saveVoiceTranscript(
      req.params.id,
      req.user!.userId,
      req.body.transcript
    );
    res.json({
      success: true,
      data: result,
      message: 'Transcript saved successfully',
    });
  })
);

export default router;
