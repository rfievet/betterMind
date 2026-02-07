/**
 * Chat page
 * Individual conversation with AI
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { conversationApi, getErrorMessage } from '@/lib/api';
import type { ConversationWithMessages, MessageResponse } from '@bettermind/shared';

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;
  
  const [conversation, setConversation] = useState<ConversationWithMessages | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
