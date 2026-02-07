/**
 * Generic API response types
 * Standardized response format for all API endpoints
 */

/**
 * Standard success response wrapper
 * All successful API responses follow this format
 */
export interface ApiResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Standard error response wrapper
 * All error responses follow this format
 */
export interface ApiError {
  success: false;
  error: {
    message: string;
    code?: string;
    // Additional error details (e.g., validation errors)
    details?: Record<string, any>;
  };
}

/**
 * Paginated response wrapper
 * Used for endpoints that return lists with pagination
 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Pagination query parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Common HTTP status codes used in the API
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
}

/**
 * Common error codes for better error handling on frontend
 */
export enum ErrorCode {
  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // User errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  
  // Conversation errors
  CONVERSATION_NOT_FOUND = 'CONVERSATION_NOT_FOUND',
  MESSAGE_NOT_FOUND = 'MESSAGE_NOT_FOUND',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // External service errors
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  VOICE_SERVICE_ERROR = 'VOICE_SERVICE_ERROR',
  
  // Generic errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NOT_FOUND = 'NOT_FOUND',
}
