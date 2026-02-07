/**
 * Dashboard page
 * Main page after login - shows user's conversations
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { conversationApi } from '@/lib/api';
import type { ConversationResponse, UserResponse } from '@bettermind/shared';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    setUser(JSON.parse(userData));

    // Load conversations
    loadConversations();
  }, [router]);

  const loadConversations = async () => {
    try {
      const data = await conversationApi.getAll();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleNewConversation = async () => {
    try {
      const conversation = await conversationApi.create('New Conversation');
      router.push(`/chat/${conversation.id}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      alert('Failed to create conversation. Please try again.');
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
    
    if (!confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
      return;
    }

    setDeletingId(conversationId);
    try {
      await conversationApi.delete(conversationId);
      setConversations(conversations.filter(c => c.id !== conversationId));
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              better<span className="text-primary-600">Mind</span>
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, <span className="font-semibold">{user?.name}</span>
              </span>
              <button
                onClick={() => router.push('/profile')}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h2>
          <p className="text-primary-100 mb-6">
            Ready to continue your mental wellness journey?
          </p>
          <button
            onClick={handleNewConversation}
            className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
          >
            + Start New Conversation
          </button>
        </div>

        {/* Conversations List */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Your Conversations
          </h3>

          {conversations.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">💭</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                No conversations yet
              </h4>
              <p className="text-gray-600 mb-6">
                Start your first conversation to begin your wellness journey
              </p>
              <button
                onClick={handleNewConversation}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Start Your First Conversation
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => router.push(`/chat/${conversation.id}`)}
                  className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 relative group"
                >
                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDeleteConversation(e, conversation.id)}
                    disabled={deletingId === conversation.id}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg disabled:opacity-50"
                    title="Delete conversation"
                  >
                    {deletingId === conversation.id ? (
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>

                  <h4 className="font-semibold text-gray-900 mb-2 pr-8">
                    {conversation.title || 'Untitled Conversation'}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {conversation.messageCount} messages
                  </p>
                  {conversation.lastMessage && (
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {conversation.lastMessage.content}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-3">
                    {new Date(conversation.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
