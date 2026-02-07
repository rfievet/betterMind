/**
 * Shared constants used across the application
 */

/**
 * API version prefix
 */
export const API_VERSION = 'v1';

/**
 * API base path
 */
export const API_BASE_PATH = `/api/${API_VERSION}`;

/**
 * JWT token expiration time (7 days in seconds)
 */
export const JWT_EXPIRATION = 7 * 24 * 60 * 60;

/**
 * Maximum file size for voice uploads (10MB in bytes)
 */
export const MAX_VOICE_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Supported audio formats for voice messages
 */
export const SUPPORTED_AUDIO_FORMATS = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
];

/**
 * Default pagination limit
 */
export const DEFAULT_PAGE_LIMIT = 20;

/**
 * Maximum pagination limit
 */
export const MAX_PAGE_LIMIT = 100;

/**
 * Default ElevenLabs voice ID
 * This is a preset voice for text-to-speech
 */
export const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah voice

/**
 * AI system prompt template
 * Used to provide context to the AI about the user
 */
export const AI_SYSTEM_PROMPT = `You are a compassionate mental wellness assistant. You help users reflect on their thoughts and feelings through guided conversations. Be empathetic, non-judgmental, and supportive. Ask thoughtful questions to help users explore their emotions and experiences.

IMPORTANT: You are NOT a licensed therapist or medical professional. If a user expresses thoughts of self-harm or severe mental health crisis, encourage them to seek professional help immediately.`;

/**
 * AI user context template
 * Injected into the conversation to personalize responses
 */
export const getUserContextPrompt = (description?: string, problems?: string): string => {
  let context = '';
  
  if (description) {
    context += `\n\nUser's self-description: ${description}`;
  }
  
  if (problems) {
    context += `\n\nUser's stated challenges: ${problems}`;
  }
  
  return context;
};
