/**
 * Validation Utilities
 *
 * Provides validation functions for user input and data formatting.
 *
 * @module utils/validation
 */

/**
 * Validate email format using regex
 *
 * @param email - Email address to validate
 * @returns True if email format is valid
 * @example
 * ```ts
 * if (!validateEmail(userInput)) {
 *   setError('Invalid email format');
 * }
 * ```
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const trimmedEmail = email.trim();

  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return false;
  }

  // Additional checks for common issues
  const [localPart, domain] = trimmedEmail.split('@');

  // Local part should not be empty and not too long
  if (!localPart || localPart.length > 64) {
    return false;
  }

  // Domain should not be empty and contain a dot
  if (!domain || !domain.includes('.')) {
    return false;
  }

  // Domain should not start or end with dot
  if (domain.startsWith('.') || domain.endsWith('.')) {
    return false;
  }

  return true;
}

/**
 * Validate password strength
 *
 * Checks password against security requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 *
 * @param password - Password to validate
 * @returns Object with isValid flag and array of error messages
 * @example
 * ```ts
 * const result = validatePassword(userInput);
 * if (!result.isValid) {
 *   setErrors(result.errors);
 * }
 * ```
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['Password is required'],
    };
  }
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format date as YYYY-MM-DD for database storage
 *
 * @param date - Date object to format
 * @returns ISO date string (YYYY-MM-DD)
 * @example
 * ```ts
 * const dateStr = formatDate(new Date()); // "2026-01-15"
 * ```
 */
export function formatDate(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date provided');
  }
  return date.toISOString().split('T')[0];
}

/**
 * Calculate days sober from start date
 *
 * Calculates the number of full days between the sobriety start date
 * and the current date/time.
 *
 * @param startDate - Sobriety start date
 * @returns Number of days (0 if startDate is in the future)
 * @example
 * ```ts
 * const days = calculateDaysSober(new Date('2025-01-01'));
 * // Returns days since Jan 1, 2025
 * ```
 */
export function calculateDaysSober(startDate: Date): number {
  if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
    return 0;
  }
  const now = new Date();
  const diff = now.getTime() - startDate.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return Math.max(0, days); // Never return negative days
}
