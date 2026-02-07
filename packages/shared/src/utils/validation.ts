/**
 * Shared validation utilities
 * Used by both frontend and backend for consistent validation
 */

/**
 * Email validation regex
 * Validates standard email format
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Password requirements
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * Validates email format
 * @param email - Email string to validate
 * @returns true if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Validates password strength
 * @param password - Password string to validate
 * @returns true if valid, false otherwise
 */
export function isValidPassword(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}

/**
 * Gets password validation error message
 * @param password - Password to validate
 * @returns Error message or null if valid
 */
export function getPasswordError(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/\d/.test(password)) {
    return 'Password must contain at least one number';
  }
  return null;
}

/**
 * Validates user name
 * @param name - Name to validate
 * @returns true if valid, false otherwise
 */
export function isValidName(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= 100;
}

/**
 * Validates description length
 * @param description - Description to validate
 * @returns true if valid, false otherwise
 */
export function isValidDescription(description: string): boolean {
  return description.trim().length <= 2000;
}

/**
 * Validates problems text length
 * @param problems - Problems text to validate
 * @returns true if valid, false otherwise
 */
export function isValidProblems(problems: string): boolean {
  return problems.trim().length <= 2000;
}

/**
 * Sanitizes user input by trimming whitespace
 * @param input - Input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input.trim();
}
