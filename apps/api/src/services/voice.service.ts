/**
 * Voice service
 * Handles text-to-speech and speech-to-text using ElevenLabs
 */

import fs from 'fs/promises';
import path from 'path';
import config from '../config';
import { AppError } from '../middleware/error.middleware';
import { ErrorCode, HttpStatus } from '@bettermind/shared';

/**
 * ElevenLabs API base URL
 */
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

/**
 * Convert text to speech using ElevenLabs
 * @param text - Text to convert to speech
 * @param voiceId - ElevenLabs voice ID (optional, uses default if not provided)
 * @returns Path to the generated audio file
 */
export async function textToSpeech(
  text: string,
  voiceId?: string
): Promise<{ audioPath: string; duration: number }> {
  try {
    const voice = voiceId || config.elevenlabs.defaultVoiceId;
    
    // Call ElevenLabs API
    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${voice}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': config.elevenlabs.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs API error:', error);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    // Get audio data
    const audioBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(audioBuffer);

    // Generate unique filename
    const filename = `tts-${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`;
    const audioPath = path.join(config.upload.directory, filename);

    // Ensure upload directory exists
    await fs.mkdir(config.upload.directory, { recursive: true });

    // Save audio file
    await fs.writeFile(audioPath, buffer);

    // Estimate duration (rough estimate: 150 words per minute, average 5 chars per word)
    const wordCount = text.split(/\s+/).length;
    const duration = Math.ceil((wordCount / 150) * 60);

    return {
      audioPath: `/uploads/${filename}`,
      duration,
    };
  } catch (error) {
    console.error('Text-to-speech error:', error);
    
    if (error instanceof Error && error.message.includes('API key')) {
      throw new AppError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Voice service configuration error',
        ErrorCode.VOICE_SERVICE_ERROR
      );
    }

    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Failed to generate speech',
      ErrorCode.VOICE_SERVICE_ERROR,
      { originalError: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

/**
 * Transcribe audio to text using ElevenLabs (or alternative service)
 * Note: ElevenLabs doesn't have built-in STT, so this would use another service
 * For now, this is a placeholder that would integrate with services like:
 * - Google Speech-to-Text
 * - OpenAI Whisper
 * - AssemblyAI
 * 
 * @param audioPath - Path to the audio file
 * @returns Transcribed text
 */
export async function speechToText(audioPath: string): Promise<string> {
  try {
    // TODO: Implement speech-to-text using a service like:
    // - Google Cloud Speech-to-Text
    // - OpenAI Whisper API
    // - AssemblyAI
    
    // For now, return a placeholder
    // In production, you would:
    // 1. Read the audio file
    // 2. Send it to the STT service
    // 3. Return the transcribed text
    
    throw new AppError(
      HttpStatus.NOT_IMPLEMENTED,
      'Speech-to-text is not yet implemented. Please use text messages for now.',
      ErrorCode.VOICE_SERVICE_ERROR
    );
  } catch (error) {
    console.error('Speech-to-text error:', error);
    
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Failed to transcribe audio',
      ErrorCode.VOICE_SERVICE_ERROR,
      { originalError: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

/**
 * Delete an audio file
 * @param audioPath - Path to the audio file (relative URL)
 */
export async function deleteAudioFile(audioPath: string): Promise<void> {
  try {
    // Extract filename from URL path
    const filename = path.basename(audioPath);
    const fullPath = path.join(config.upload.directory, filename);

    // Check if file exists
    try {
      await fs.access(fullPath);
      await fs.unlink(fullPath);
    } catch (error) {
      // File doesn't exist, ignore
      console.warn(`Audio file not found: ${fullPath}`);
    }
  } catch (error) {
    console.error('Failed to delete audio file:', error);
    // Don't throw error, just log it
  }
}

/**
 * Get available voices from ElevenLabs
 * @returns List of available voices
 */
export async function getAvailableVoices(): Promise<any[]> {
  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
      headers: {
        'xi-api-key': config.elevenlabs.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();
    return data.voices || [];
  } catch (error) {
    console.error('Failed to fetch voices:', error);
    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Failed to fetch available voices',
      ErrorCode.VOICE_SERVICE_ERROR
    );
  }
}
