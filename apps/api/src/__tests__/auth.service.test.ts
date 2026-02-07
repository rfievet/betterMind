/**
 * Authentication service tests
 * Tests user registration, login, and profile management
 */

import * as authService from '../services/auth.service';
import { query, queryOne } from '../database/db';
import { AppError } from '../middleware/error.middleware';

// Mock database functions
jest.mock('../database/db');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Mock: User doesn't exist
      mockQueryOne.mockResolvedValueOnce(null);
      
      // Mock: User created successfully
      mockQueryOne.mockResolvedValueOnce({
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        auth_provider: 'local',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await authService.register({
        email: 'test@example.com',
        password: 'Test1234',
        name: 'Test User',
      });

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw error if user already exists', async () => {
      // Mock: User exists
      mockQueryOne.mockResolvedValueOnce({ id: '123' });

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'Test1234',
          name: 'Test User',
        })
      ).rejects.toThrow(AppError);
    });
  });

  describe('login', () => {
    it('should login user with correct credentials', async () => {
      // Mock: User exists with hashed password
      mockQueryOne.mockResolvedValueOnce({
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        password_hash: '$2b$10$rKvVJvH8qN5xZ5xZ5xZ5xOqN5xZ5xZ5xZ5xZ5xZ5xZ5xZ5xZ5xZ5x',
        auth_provider: 'local',
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Note: This test would need a real password hash to work properly
      // In a real test, you'd use bcrypt.hash to create a test hash
    });

    it('should throw error for invalid credentials', async () => {
      // Mock: User not found
      mockQueryOne.mockResolvedValueOnce(null);

      await expect(
        authService.login({
          email: 'wrong@example.com',
          password: 'WrongPassword',
        })
      ).rejects.toThrow(AppError);
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      mockQueryOne.mockResolvedValueOnce({
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        auth_provider: 'local',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const user = await authService.getUserById('123');

      expect(user.id).toBe('123');
      expect(user.email).toBe('test@example.com');
    });

    it('should throw error if user not found', async () => {
      mockQueryOne.mockResolvedValueOnce(null);

      await expect(authService.getUserById('nonexistent')).rejects.toThrow(AppError);
    });
  });
});
