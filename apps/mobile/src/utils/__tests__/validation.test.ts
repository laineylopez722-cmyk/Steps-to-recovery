import { validateEmail, validatePassword, formatDate, calculateDaysSober } from '../validation';

describe('validation utilities', () => {
  describe('validateEmail', () => {
    it('returns true for valid email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.user@domain.co')).toBe(true);
      expect(validateEmail('a+b@sub.domain.org')).toBe(true);
    });

    it('returns true for email with leading/trailing whitespace', () => {
      expect(validateEmail('  user@example.com  ')).toBe(true);
    });

    it('returns false for empty string', () => {
      expect(validateEmail('')).toBe(false);
    });

    it('returns false for non-string input', () => {
      expect(validateEmail(null as unknown as string)).toBe(false);
      expect(validateEmail(undefined as unknown as string)).toBe(false);
      expect(validateEmail(123 as unknown as string)).toBe(false);
    });

    it('returns false for email without @', () => {
      expect(validateEmail('userexample.com')).toBe(false);
    });

    it('returns false for email without domain dot', () => {
      expect(validateEmail('user@localhost')).toBe(false);
    });

    it('returns false for domain starting or ending with dot', () => {
      expect(validateEmail('user@.example.com')).toBe(false);
      expect(validateEmail('user@example.com.')).toBe(false);
    });

    it('returns false for local part longer than 64 characters', () => {
      const longLocal = 'a'.repeat(65);
      expect(validateEmail(`${longLocal}@example.com`)).toBe(false);
    });

    it('returns true for local part exactly 64 characters', () => {
      const maxLocal = 'a'.repeat(64);
      expect(validateEmail(`${maxLocal}@example.com`)).toBe(true);
    });

    it('returns false for email with spaces in middle', () => {
      expect(validateEmail('user name@example.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('returns valid for a strong password', () => {
      const result = validatePassword('StrongPass1');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns errors for empty string', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    it('returns errors for null/undefined input', () => {
      const result = validatePassword(null as unknown as string);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    it('returns error for password shorter than 8 characters', () => {
      const result = validatePassword('Ab1');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('returns error for password without uppercase letter', () => {
      const result = validatePassword('lowercase1');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain an uppercase letter');
    });

    it('returns error for password without lowercase letter', () => {
      const result = validatePassword('UPPERCASE1');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain a lowercase letter');
    });

    it('returns error for password without number', () => {
      const result = validatePassword('NoNumbers');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain a number');
    });

    it('returns multiple errors when multiple rules violated', () => {
      const result = validatePassword('abc');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });

    it('accepts password with exactly 8 characters meeting all rules', () => {
      const result = validatePassword('Abcdefg1');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('formatDate', () => {
    it('formats a date as YYYY-MM-DD', () => {
      const date = new Date('2026-03-15T10:30:00Z');
      expect(formatDate(date)).toBe('2026-03-15');
    });

    it('throws for invalid Date object', () => {
      expect(() => formatDate(new Date('invalid'))).toThrow('Invalid date provided');
    });

    it('throws for non-Date input', () => {
      expect(() => formatDate('2026-01-01' as unknown as Date)).toThrow('Invalid date provided');
      expect(() => formatDate(null as unknown as Date)).toThrow();
    });

    it('formats epoch date correctly', () => {
      const date = new Date('1970-01-01T00:00:00Z');
      expect(formatDate(date)).toBe('1970-01-01');
    });
  });

  describe('calculateDaysSober', () => {
    it('returns 0 for a future start date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(calculateDaysSober(futureDate)).toBe(0);
    });

    it('returns 0 for today as start date', () => {
      const today = new Date();
      expect(calculateDaysSober(today)).toBe(0);
    });

    it('returns positive number for past date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      expect(calculateDaysSober(pastDate)).toBe(10);
    });

    it('returns 0 for invalid date', () => {
      expect(calculateDaysSober(new Date('invalid'))).toBe(0);
    });

    it('returns 0 for non-Date input', () => {
      expect(calculateDaysSober(null as unknown as Date)).toBe(0);
    });

    it('calculates correctly for known date range', () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      expect(calculateDaysSober(sevenDaysAgo)).toBe(7);
    });
  });
});
