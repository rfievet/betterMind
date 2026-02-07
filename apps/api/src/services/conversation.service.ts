/**
 * Conversation service
 * Handles conversation and message CRUD operations
 */

import {
  Conversation,
  ConversationResponse,
  ConversationWithMessages,
  Message,
  MessageResponse,
  SendMessageResponse,
  PaginationParams,
  ErrorCode,
  HttpStatus,
} from '@bettermind/shared';
import { query, queryOne, transaction } from '../database/db';
import { AppError } from '../middleware/error.middleware';
import * as aiService from './ai.service';
import * as voiceService from './voice.service';

/**
 * Convert database message to API response
 */
function messageToResponse(message: any): MessageResponse {
  return {
    id: message.id,
    conversationId: message.conversation_id,
    role: message.role,
    type: message.type,
    content: message.content,
    audioUrl: message.audio_url,
    audioDuration: message.audio_duration,
    createdAt: message.created_at.toISOString(),
  };
}

/**
 * Convert database conversation to API response
 */
async function conversationToResponse(
  conversation: any,
  includeLastMessage = true
): Promise<ConversationResponse> {
  // Get message count
  const countResult = await queryOne<{ count: string }>(
    'SELECT COUNT(*)::text as count FROM messages WHERE conversation_id = $1',
    [conversation.id]
  );
  const messageCount = parseInt(countResult?.count || '0', 10);

  // Get last message if requested
  let lastMessage: MessageResponse | undefined;
  if (includeLastMessage && messageCount > 0) {
    const lastMsg = await queryOne<any>(
      `SELECT * FROM messages 
       WHERE conversation_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [conversation.id]
    );
    if (lastMsg) {
      lastMessage = messageToResponse(lastMsg);
    }
  }

  return {
    id: conversation.id,
    userId: conversation.user_id,
    title: conversation.title,
    summary: conversation.summary,
    messageCount,
    lastMessage,
    createdAt: conversation.created_at.toISOString(),
    updatedAt: conversation.updated_at.toISOString(),
  };
}

/**
 * Create a new conversation
 */
export async function createConversation(
  userId: string,
  title?: string
): Promise<ConversationResponse> {
  const conversation = await queryOne<any>(
    `INSERT INTO conversations (user_id, title)
     VALUES ($1, $2)
     RETURNING *`,
    [userId, title || null]
  );

  if (!conversation) {
    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Failed to create conversation',
      ErrorCode.INTERNAL_ERROR
    );
  }

  return conversationToResponse(conversation, false);
}

/**
 * Get all conversations for a user
 */
export async function getUserConversations(
  userId: string,
  pagination?: PaginationParams
): Promise<ConversationResponse[]> {
  const limit = Math.min(pagination?.limit || 20, 100);
  const offset = ((pagination?.page || 1) - 1) * limit;

  const result = await query<any>(
    `SELECT * FROM conversations 
     WHERE user_id = $1 
     ORDER BY updated_at DESC 
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  const conversations = await Promise.all(
    result.rows.map((conv) => conversationToResponse(conv))
  );

  return conversations;
}

/**
 * Get a single conversation with all messages
 */
export async function getConversationById(
  conversationId: string,
  userId: string
): Promise<ConversationWithMessages> {
  // Get conversation
  const conversation = await queryOne<any>(
    'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
    [conversationId, userId]
  );

  if (!conversation) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      'Conversation not found',
      ErrorCode.CONVERSATION_NOT_FOUND
    );
  }

  // Get all messages
  const messagesResult = await query<any>(
    `SELECT * FROM messages 
     WHERE conversation_id = $1 
     ORDER BY created_at ASC`,
    [conversationId]
  );

  const messages = messagesResult.rows.map(messageToResponse);
  const conversationResponse = await conversationToResponse(conversation, false);

  return {
    ...conversationResponse,
    messages,
  };
}

/**
 * Send a text message and get AI response
 */
export async function sendTextMessage(
  conversationId: string,
  userId: string,
  content: string
): Promise<SendMessageResponse> {
  return transaction(async (client) => {
    // Verify conversation belongs to user
    const conversation = await client.query(
      'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (conversation.rows.length === 0) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        'Conversation not found',
        ErrorCode.CONVERSATION_NOT_FOUND
      );
    }

    // Get user context for AI personalization
    const userResult = await client.query(
      'SELECT description, problems FROM users WHERE id = $1',
      [userId]
    );
    const userContext = userResult.rows[0];

    // Get conversation history for AI context
    const historyResult = await client.query(
      `SELECT role, content FROM messages 
       WHERE conversation_id = $1 
       ORDER BY created_at ASC`,
      [conversationId]
    );

    const history = historyResult.rows.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: msg.content,
    }));

    // Save user message
    const userMessageResult = await client.query(
      `INSERT INTO messages (conversation_id, role, type, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [conversationId, 'user', 'text', content]
    );
    const userMessage = userMessageResult.rows[0];

    // Generate AI response
    const aiResponse = await aiService.generateResponse(
      history,
      content,
      userContext
    );

    // Save AI message
    const aiMessageResult = await client.query(
      `INSERT INTO messages (conversation_id, role, type, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [conversationId, 'assistant', 'text', aiResponse]
    );
    const aiMessage = aiMessageResult.rows[0];

    // Update conversation timestamp
    await client.query(
      'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [conversationId]
    );

    // Generate title if this is the first message
    if (history.length === 0) {
      const title = await aiService.generateConversationTitle(content);
      await client.query(
        'UPDATE conversations SET title = $1 WHERE id = $2',
        [title, conversationId]
      );
    }

    return {
      userMessage: messageToResponse(userMessage),
      assistantMessage: messageToResponse(aiMessage),
    };
  });
}

/**
 * Send a voice message and get AI response
 * (Placeholder - would need speech-to-text implementation)
 */
export async function sendVoiceMessage(
  conversationId: string,
  userId: string,
  audioPath: string,
  audioDuration: number
): Promise<SendMessageResponse> {
  // TODO: Implement speech-to-text
  // For now, return an error
  throw new AppError(
    HttpStatus.NOT_IMPLEMENTED,
    'Voice messages are not yet fully implemented',
    ErrorCode.VOICE_SERVICE_ERROR
  );
}

/**
 * Generate voice response for a text message
 */
export async function generateVoiceResponse(
  messageId: string,
  userId: string
): Promise<{ audioUrl: string; duration: number }> {
  // Get the message
  const message = await queryOne<any>(
    `SELECT m.*, c.user_id 
     FROM messages m
     JOIN conversations c ON m.conversation_id = c.id
     WHERE m.id = $1 AND c.user_id = $2`,
    [messageId, userId]
  );

  if (!message) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      'Message not found',
      ErrorCode.MESSAGE_NOT_FOUND
    );
  }

  // Generate voice
  const { audioPath, duration } = await voiceService.textToSpeech(message.content);

  // Update message with audio URL
  await query(
    `UPDATE messages 
     SET audio_url = $1, audio_duration = $2 
     WHERE id = $3`,
    [audioPath, duration, messageId]
  );

  return {
    audioUrl: audioPath,
    duration,
  };
}

/**
 * Delete a conversation and all its messages
 */
export async function deleteConversation(
  conversationId: string,
  userId: string
): Promise<void> {
  return transaction(async (client) => {
    // Verify conversation belongs to user
    const conversation = await client.query(
      'SELECT id FROM conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (conversation.rows.length === 0) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        'Conversation not found',
        ErrorCode.CONVERSATION_NOT_FOUND
      );
    }

    // Get all audio files to delete
    const audioFiles = await client.query(
      'SELECT audio_url FROM messages WHERE conversation_id = $1 AND audio_url IS NOT NULL',
      [conversationId]
    );

    // Delete conversation (messages will be cascade deleted)
    await client.query('DELETE FROM conversations WHERE id = $1', [conversationId]);

    // Delete audio files asynchronously (don't wait)
    audioFiles.rows.forEach((row: any) => {
      voiceService.deleteAudioFile(row.audio_url).catch(console.error);
    });
  });
}

/**
 * Save voice call transcript to conversation
 * Converts voice conversation into text messages
 */
export async function saveVoiceTranscript(
  conversationId: string,
  userId: string,
  transcript: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<{ messageCount: number }> {
  return transaction(async (client) => {
    // Verify conversation belongs to user
    const conversation = await client.query(
      'SELECT id, title FROM conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (conversation.rows.length === 0) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        'Conversation not found',
        ErrorCode.CONVERSATION_NOT_FOUND
      );
    }

    // Save each message from transcript
    for (const entry of transcript) {
      await client.query(
        `INSERT INTO messages (conversation_id, role, type, content)
         VALUES ($1, $2, $3, $4)`,
        [conversationId, entry.role, 'text', entry.content]
      );
    }

    // Update conversation timestamp
    await client.query(
      'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [conversationId]
    );

    // Generate title if conversation doesn't have one
    if (!conversation.rows[0].title && transcript.length > 0) {
      const firstUserMessage = transcript.find((t) => t.role === 'user');
      if (firstUserMessage) {
        const title = await aiService.generateConversationTitle(firstUserMessage.content);
        await client.query(
          'UPDATE conversations SET title = $1 WHERE id = $2',
          [title, conversationId]
        );
      }
    }

    return { messageCount: transcript.length };
  });
}
