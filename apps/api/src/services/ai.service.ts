/**
 * AI service
 * Handles interactions with Google Gemini AI
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_SYSTEM_PROMPT, getUserContextPrompt } from '@bettermind/shared';
import config from '../config';
import { AppError } from '../middleware/error.middleware';
import { ErrorCode, HttpStatus } from '@bettermind/shared';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

/**
 * Message format for conversation history
 */
interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}

/**
 * Generate AI response based on conversation history and user context
 * @param messages - Previous messages in the conversation
 * @param userMessage - New message from the user
 * @param userContext - User's description and problems for personalization
 * @returns AI-generated response
 */
export async function generateResponse(
  messages: ChatMessage[],
  userMessage: string,
  userContext?: { description?: string; problems?: string }
): Promise<string> {
  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: config.gemini.model });

    // Build the system prompt with user context
    let systemPrompt = AI_SYSTEM_PROMPT;
    if (userContext) {
      systemPrompt += getUserContextPrompt(
        userContext.description,
        userContext.problems
      );
    }

    // Start a chat session with history
    const chat = model.startChat({
      history: [
        // Add system prompt as first message
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: 'I understand. I will be a compassionate mental wellness assistant, keeping in mind your context and challenges. How can I support you today?' }],
        },
        // Add conversation history
        ...messages.map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.parts }],
        })),
      ],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7, // Balance between creativity and consistency
        topP: 0.8,
        topK: 40,
      },
    });

    // Send the new message and get response
    const result = await chat.sendMessage(userMessage);
    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error('Empty response from AI');
    }

    return text;
  } catch (error) {
    console.error('AI service error:', error);
    
    // Handle specific Gemini API errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new AppError(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'AI service configuration error',
          ErrorCode.AI_SERVICE_ERROR
        );
      }
      
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        throw new AppError(
          HttpStatus.TOO_MANY_REQUESTS,
          'AI service is temporarily unavailable. Please try again later.',
          ErrorCode.AI_SERVICE_ERROR
        );
      }
    }

    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Failed to generate AI response',
      ErrorCode.AI_SERVICE_ERROR,
      { originalError: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

/**
 * Generate a conversation title based on the first message
 * @param firstMessage - The first user message in the conversation
 * @returns A short, descriptive title
 */
export async function generateConversationTitle(firstMessage: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: config.gemini.model });

    const prompt = `Generate a short, descriptive title (max 6 words) for a mental wellness conversation that starts with this message: "${firstMessage}". Only return the title, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let title = response.text().trim();

    // Remove quotes if present
    title = title.replace(/^["']|["']$/g, '');

    // Truncate if too long
    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }

    return title || 'New Conversation';
  } catch (error) {
    console.error('Failed to generate title:', error);
    // Return a default title if generation fails
    return 'New Conversation';
  }
}

/**
 * Generate a summary of a conversation
 * @param messages - All messages in the conversation
 * @returns A brief summary of the conversation
 */
export async function generateConversationSummary(
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: config.gemini.model });

    // Format messages for the prompt
    const conversationText = messages
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const prompt = `Summarize this mental wellness conversation in 2-3 sentences, focusing on the main topics discussed and any insights or progress made:\n\n${conversationText}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const summary = response.text().trim();

    return summary || 'Conversation about mental wellness';
  } catch (error) {
    console.error('Failed to generate summary:', error);
    return 'Conversation about mental wellness';
  }
}
