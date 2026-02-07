/**
 * API client for making requests to the backend
 * Handles authentication, error handling, and request/response formatting
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  ApiResponse,
  ApiError,
  AuthResponse,
  UserResponse,
  ConversationResponse,
  ConversationWithMessages,
  SendMessageResponse,
  RegisterRequest,
  LoginRequest,
  GoogleAuthRequest,
  UpdateProfileRequest,
  SendTextMessageRequest,
} from '@bettermind/shared';

/**
 * API base URL from environment variables
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_BASE = `${API_URL}/api/v1`;

/**
 * Create axios instance with default configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

/**
 * Request interceptor to add authentication token
 */
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor to handle errors consistently
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      
      // Only redirect if not already on auth pages
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth/login';
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Authentication API
 */
export const authApi = {
  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data.data;
  },

  /**
   * Login with email and password
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data.data;
  },

  /**
   * Login with Google OAuth
   */
  googleAuth: async (data: GoogleAuthRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/google', data);
    return response.data.data;
  },

  /**
   * Get current user profile
   */
  getMe: async (): Promise<UserResponse> => {
    const response = await apiClient.get<ApiResponse<UserResponse>>('/auth/me');
    return response.data.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<UserResponse> => {
    const response = await apiClient.patch<ApiResponse<UserResponse>>('/auth/profile', data);
    return response.data.data;
  },
};

/**
 * Conversation API
 */
export const conversationApi = {
  /**
   * Create a new conversation
   */
  create: async (title?: string): Promise<ConversationResponse> => {
    const response = await apiClient.post<ApiResponse<ConversationResponse>>('/conversations', {
      title,
    });
    return response.data.data;
  },

  /**
   * Get all user conversations
   */
  getAll: async (page = 1, limit = 20): Promise<ConversationResponse[]> => {
    const response = await apiClient.get<ApiResponse<ConversationResponse[]>>('/conversations', {
      params: { page, limit },
    });
    return response.data.data;
  },

  /**
   * Get a single conversation with messages
   */
  getById: async (id: string): Promise<ConversationWithMessages> => {
    const response = await apiClient.get<ApiResponse<ConversationWithMessages>>(
      `/conversations/${id}`
    );
    return response.data.data;
  },

  /**
   * Send a text message
   */
  sendMessage: async (conversationId: string, content: string): Promise<SendMessageResponse> => {
    const response = await apiClient.post<ApiResponse<SendMessageResponse>>(
      `/conversations/${conversationId}/messages`,
      { content }
    );
    return response.data.data;
  },

  /**
   * Generate voice for a message
   */
  generateVoice: async (
    conversationId: string,
    messageId: string
  ): Promise<{ audioUrl: string; duration: number }> => {
    const response = await apiClient.post<
      ApiResponse<{ audioUrl: string; duration: number }>
    >(`/conversations/${conversationId}/messages/${messageId}/voice`);
    return response.data.data;
  },

  /**
   * Delete a conversation
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/conversations/${id}`);
  },

  /**
   * Start a voice call - get signed URL for ElevenLabs WebSocket
   */
  startVoiceCall: async (conversationId: string): Promise<{ signedUrl: string }> => {
    const response = await apiClient.post<ApiResponse<{ signedUrl: string; conversationId: string }>>(
      `/conversations/${conversationId}/voice-call`
    );
    return { signedUrl: response.data.data.signedUrl };
  },

  /**
   * Save voice call transcript
   */
  saveVoiceTranscript: async (
    conversationId: string,
    transcript: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<{ messageCount: number }> => {
    const response = await apiClient.post<ApiResponse<{ messageCount: number }>>(
      `/conversations/${conversationId}/voice-transcript`,
      { transcript }
    );
    return response.data.data;
  },
};

/**
 * Helper function to handle API errors
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError;
    return apiError?.error?.message || error.message || 'An error occurred';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unknown error occurred';
}

export default apiClient;
