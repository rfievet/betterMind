/**
 * API client for React Native
 * Similar to web API client but uses SecureStore for token storage
 */

import axios, { AxiosError, AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';
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
} from '@bettermind/shared';

/**
 * API base URL
 * In development, use your computer's local IP address
 * Example: http://192.168.1.100:3001
 */
const API_URL = process.env.API_URL || 'http://localhost:3001';
const API_BASE = `${API_URL}/api/v1`;

/**
 * Secure token storage keys
 */
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

/**
 * Token storage utilities
 */
export const tokenStorage = {
  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },

  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async removeToken(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },

  async getUser(): Promise<UserResponse | null> {
    const userData = await SecureStore.getItemAsync(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  },

  async setUser(user: UserResponse): Promise<void> {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },

  async removeUser(): Promise<void> {
    await SecureStore.deleteItemAsync(USER_KEY);
  },

  async clear(): Promise<void> {
    await this.removeToken();
    await this.removeUser();
  },
};

/**
 * Create axios instance
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

/**
 * Request interceptor to add authentication token
 */
apiClient.interceptors.request.use(
  async (config) => {
    const token = await tokenStorage.getToken();
    
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
 * Response interceptor to handle errors
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Clear token and user data
      await tokenStorage.clear();
      
      // TODO: Navigate to login screen
      // This would be handled by navigation context
    }
    
    return Promise.reject(error);
  }
);

/**
 * Authentication API
 */
export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data.data;
  },

  googleAuth: async (data: GoogleAuthRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/google', data);
    return response.data.data;
  },

  getMe: async (): Promise<UserResponse> => {
    const response = await apiClient.get<ApiResponse<UserResponse>>('/auth/me');
    return response.data.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserResponse> => {
    const response = await apiClient.patch<ApiResponse<UserResponse>>('/auth/profile', data);
    return response.data.data;
  },
};

/**
 * Conversation API
 */
export const conversationApi = {
  create: async (title?: string): Promise<ConversationResponse> => {
    const response = await apiClient.post<ApiResponse<ConversationResponse>>('/conversations', {
      title,
    });
    return response.data.data;
  },

  getAll: async (page = 1, limit = 20): Promise<ConversationResponse[]> => {
    const response = await apiClient.get<ApiResponse<ConversationResponse[]>>('/conversations', {
      params: { page, limit },
    });
    return response.data.data;
  },

  getById: async (id: string): Promise<ConversationWithMessages> => {
    const response = await apiClient.get<ApiResponse<ConversationWithMessages>>(
      `/conversations/${id}`
    );
    return response.data.data;
  },

  sendMessage: async (conversationId: string, content: string): Promise<SendMessageResponse> => {
    const response = await apiClient.post<ApiResponse<SendMessageResponse>>(
      `/conversations/${conversationId}/messages`,
      { content }
    );
    return response.data.data;
  },

  generateVoice: async (
    conversationId: string,
    messageId: string
  ): Promise<{ audioUrl: string; duration: number }> => {
    const response = await apiClient.post<
      ApiResponse<{ audioUrl: string; duration: number }>
    >(`/conversations/${conversationId}/messages/${messageId}/voice`);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/conversations/${id}`);
  },
};

/**
 * Helper function to get error message
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
