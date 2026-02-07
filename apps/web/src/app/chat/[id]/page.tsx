/**
 * Chat page
 * Individual conversation with AI
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { conversationApi, getErrorMessage } from '@/lib/api';
import type { ConversationWithMessages, MessageResponse } from '@bettermind/shared';
import VoiceCall from './VoiceCall';

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;
  
  const [conversation, setConversation] = useState<ConversationWithMessages | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [generatingVoice, setGeneratingVoice] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  const [voiceCallSignedUrl, setVoiceCallSignedUrl] = useState<string | null>(null);
  const [startingCall, setStartingCall] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    loadConversation();
  }, [conversationId, router]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const loadConversation = async () => {
    try {
      const data = await conversationApi.getById(conversationId);
      setConversation(data);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    setError('');
    setSending(true);

    try {
      const response = await conversationApi.sendMessage(conversationId, message.trim());
      
      // Add messages to conversation
      setConversation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, response.userMessage, response.assistantMessage],
        };
      });

      setMessage('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const handleGenerateVoice = async (messageId: string) => {
    setGeneratingVoice(messageId);
    try {
      const result = await conversationApi.generateVoice(conversationId, messageId);
      
      // Update message with audio URL
      setConversation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === messageId
              ? { ...msg, audioUrl: result.audioUrl }
              : msg
          ),
        };
      });

      // Auto-play the generated audio
      playAudio(result.audioUrl, messageId);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGeneratingVoice(null);
    }
  };

  const playAudio = (audioUrl: string, messageId: string) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Create and play new audio
    const audio = new Audio(`http://localhost:3001${audioUrl}`);
    audioRef.current = audio;
    setPlayingAudio(messageId);

    audio.onended = () => {
      setPlayingAudio(null);
      audioRef.current = null;
    };

    audio.onerror = () => {
      setError('Failed to play audio');
      setPlayingAudio(null);
      audioRef.current = null;
    };

    audio.play().catch((err) => {
      console.error('Audio play error:', err);
      setError('Failed to play audio');
      setPlayingAudio(null);
    });
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingAudio(null);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleStartVoiceCall = async () => {
    setStartingCall(true);
    setError('');
    try {
      const { signedUrl } = await conversationApi.startVoiceCall(conversationId);
      setVoiceCallSignedUrl(signedUrl);
      setIsVoiceCallActive(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setStartingCall(false);
    }
  };

  const handleVoiceCallEnd = async (transcript: Array<{ role: 'user' | 'assistant'; content: string }>) => {
    setIsVoiceCallActive(false);
    setVoiceCallSignedUrl(null);

    // Save transcript to conversation
    if (transcript.length > 0) {
      try {
        await conversationApi.saveVoiceTranscript(conversationId, transcript);
        // Reload conversation to show transcript
        await loadConversation();
      } catch (err) {
        console.error('Failed to save transcript:', err);
      }
    }
  };

  const handleDeleteConversation = async () => {
    if (!confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
      return;
    }

    try {
      await conversationApi.delete(conversationId);
      router.push('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Conversation not found</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 text-primary-600 hover:text-primary-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Voice Call Overlay */}
      {isVoiceCallActive && voiceCallSignedUrl && (
        <VoiceCall
          signedUrl={voiceCallSignedUrl}
          onTranscript={handleVoiceCallEnd}
          onEnd={() => handleVoiceCallEnd([])}
        />
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {conversation.title || 'Conversation'}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Delete Button */}
            <button
              onClick={handleDeleteConversation}
              className="flex items-center gap-2 text-red-600 px-3 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors"
              title="Delete conversation"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* Voice Call Button */}
            <button
              onClick={handleStartVoiceCall}
              disabled={startingCall}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {startingCall ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Starting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  Voice Call
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {conversation.messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Start the conversation
              </h3>
              <p className="text-gray-600">
                Share what's on your mind. I'm here to listen and support you.
              </p>
            </div>
          ) : (
            conversation.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  
                  {/* Voice controls for assistant messages */}
                  {msg.role === 'assistant' && msg.audioUrl && (
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() =>
                          playingAudio === msg.id
                            ? stopAudio()
                            : playAudio(msg.audioUrl!, msg.id)
                        }
                        className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors"
                      >
                        {playingAudio === msg.id ? (
                          <>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Stop
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            Play
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  
                  <p
                    className={`text-xs mt-2 ${
                      msg.role === 'user' ? 'text-primary-100' : 'text-gray-400'
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
