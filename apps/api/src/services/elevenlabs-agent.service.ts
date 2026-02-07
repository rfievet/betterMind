/**
 * ElevenLabs Agent service
 * Handles ElevenLabs Conversational AI agent creation and management
 */

import config from '../config';
import { AppError } from '../middleware/error.middleware';
import { ErrorCode, HttpStatus } from '@bettermind/shared';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

/**
 * Create or get ElevenLabs conversational agent
 * @returns Agent ID
 */
export async function getOrCreateAgent(): Promise<string> {
  try {
    // For now, we'll use a stored agent ID if available
    // In production, you'd create this once and store it in your database
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    
    if (agentId) {
      return agentId;
    }

    // Create a new agent
    const response = await fetch(`${ELEVENLABS_API_URL}/convai/agents/create`, {
      method: 'POST',
      headers: {
        'xi-api-key': config.elevenlabs.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_config: {
          agent: {
            prompt: {
              prompt: `You are a compassionate and empathetic mental wellness assistant. Your role is to:
- Listen actively and provide emotional support
- Ask thoughtful follow-up questions
- Offer gentle guidance and coping strategies
- Maintain a warm, non-judgmental tone
- Remember you are NOT a licensed therapist - encourage professional help when needed

Keep responses conversational and natural for voice interaction.`,
            },
            first_message: "Hi there! I'm here to listen and support you. How are you feeling today?",
            language: 'en',
          },
          tts: {
            voice_id: config.elevenlabs.defaultVoiceId,
          },
        },
        platform_settings: {
          auth: {
            enable_auth: true, // Require signed URLs for security
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to create ElevenLabs agent:', error);
      throw new Error(`Failed to create agent: ${response.status}`);
    }

    const data = await response.json();
    console.log('Created ElevenLabs agent:', data.agent_id);
    console.log('⚠️  Add this to your .env file: ELEVENLABS_AGENT_ID=' + data.agent_id);
    
    return data.agent_id;
  } catch (error) {
    console.error('Error with ElevenLabs agent:', error);
    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Failed to initialize voice agent',
      ErrorCode.VOICE_SERVICE_ERROR
    );
  }
}

/**
 * Get a signed URL for secure WebSocket connection
 * This keeps the API key secure on the server
 * @param agentId - ElevenLabs agent ID
 * @returns Signed WebSocket URL
 */
export async function getSignedUrl(agentId: string): Promise<string> {
  try {
    const response = await fetch(
      `${ELEVENLABS_API_URL}/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': config.elevenlabs.apiKey,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to get signed URL:', error);
      throw new Error(`Failed to get signed URL: ${response.status}`);
    }

    const data = await response.json();
    return data.signed_url;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Failed to initialize voice call',
      ErrorCode.VOICE_SERVICE_ERROR
    );
  }
}
