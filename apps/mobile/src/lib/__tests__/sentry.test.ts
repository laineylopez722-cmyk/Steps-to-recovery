/**
 * Sentry Configuration Tests
 *
 * Tests that Sentry is properly configured with:
 * - Sensitive data sanitization
 * - User tracking
 * - Error capture
 */

// Mock Constants first
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      version: '1.0.0',
    },
  },
}));

// Mock Sentry
const mockSentryInit = jest.fn();
const mockSentrySetUser = jest.fn();
const mockSentryCaptureException = jest.fn();
const mockSentryAddBreadcrumb = jest.fn();
const mockSentryWrap = jest.fn((component) => component);
const mockSentryReactNativeTracingIntegration = jest.fn();

jest.mock('@sentry/react-native', () => ({
  init: mockSentryInit,
  setUser: mockSentrySetUser,
  captureException: mockSentryCaptureException,
  addBreadcrumb: mockSentryAddBreadcrumb,
  wrap: mockSentryWrap,
  reactNativeTracingIntegration: mockSentryReactNativeTracingIntegration,
}));

describe('Sentry Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment
    delete process.env.EXPO_PUBLIC_SENTRY_DSN;
  });

  describe('setSentryUser', () => {
    it('should set user with ID', () => {
      const { setSentryUser } = require('../sentry');

      setSentryUser('user-123');

      expect(mockSentrySetUser).toHaveBeenCalledWith({ id: 'user-123' });
    });

    it('should clear user when ID is null', () => {
      const { setSentryUser } = require('../sentry');

      setSentryUser(null);

      expect(mockSentrySetUser).toHaveBeenCalledWith(null);
    });
  });

  describe('captureException', () => {
    it('should capture exception with sanitized context', () => {
      const { captureException } = require('../sentry');

      const error = new Error('Test error');
      const context = {
        userId: 'user-123',
        encrypted_body: 'sensitive data',
        plaintext: 'should be redacted',
      };

      captureException(error, context);

      expect(mockSentryCaptureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          extra: expect.objectContaining({
            userId: 'user-123',
            encrypted_body: '[REDACTED]',
            plaintext: '[REDACTED]',
          }),
        }),
      );
    });

    it('should handle exception without context', () => {
      const { captureException } = require('../sentry');

      const error = new Error('Test error');

      captureException(error);

      expect(mockSentryCaptureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          extra: {},
        }),
      );
    });
  });

  describe('addBreadcrumb', () => {
    it('should add breadcrumb with sanitized data', () => {
      const { addBreadcrumb } = require('../sentry');

      addBreadcrumb('navigation', 'User navigated to settings', {
        screen: 'SettingsScreen',
        encrypted_title: 'should be redacted',
      });

      expect(mockSentryAddBreadcrumb).toHaveBeenCalled();
      const breadcrumb = mockSentryAddBreadcrumb.mock.calls[0][0];

      expect(breadcrumb.category).toBe('navigation');
      expect(breadcrumb.message).toBe('User navigated to settings');
      expect(breadcrumb.data?.screen).toBe('SettingsScreen');
      expect(breadcrumb.data?.encrypted_title).toBe('[REDACTED]');
    });

    it('should not add breadcrumb with sensitive message', () => {
      const { addBreadcrumb } = require('../sentry');

      addBreadcrumb('journal', 'User created encrypted_body entry');

      // Should not call addBreadcrumb because message contains sensitive keyword
      expect(mockSentryAddBreadcrumb).not.toHaveBeenCalled();
    });
  });

  describe('Data Sanitization', () => {
    it('should redact all sensitive keys', () => {
      const { captureException } = require('../sentry');

      const sensitiveContext = {
        encrypted_body: 'secret',
        encrypted_title: 'secret',
        encrypted_content: 'secret',
        encrypted_answer: 'secret',
        encrypted_intention: 'secret',
        encrypted_reflection: 'secret',
        encrypted_mood: 'secret',
        encrypted_craving: 'secret',
        encrypted_notes: 'secret',
        encrypted_tags: 'secret',
        password: 'secret',
        token: 'secret',
        key: 'secret',
        secret: 'secret',
        safeData: 'should not be redacted',
      };

      captureException(new Error('Test'), sensitiveContext);

      const capturedExtra = mockSentryCaptureException.mock.calls[0][1].extra;

      // All sensitive keys should be redacted
      expect(capturedExtra.encrypted_body).toBe('[REDACTED]');
      expect(capturedExtra.encrypted_title).toBe('[REDACTED]');
      expect(capturedExtra.encrypted_content).toBe('[REDACTED]');
      expect(capturedExtra.password).toBe('[REDACTED]');
      expect(capturedExtra.token).toBe('[REDACTED]');
      expect(capturedExtra.key).toBe('[REDACTED]');
      expect(capturedExtra.secret).toBe('[REDACTED]');

      // Safe data should be preserved
      expect(capturedExtra.safeData).toBe('should not be redacted');
    });

    it('should redact sensitive values in non-sensitive keys', () => {
      const { captureException } = require('../sentry');

      const context = {
        message: 'User updated encrypted_body field',
        safeField: 'This contains the word journal but is safe',
      };

      captureException(new Error('Test'), context);

      const capturedExtra = mockSentryCaptureException.mock.calls[0][1].extra;

      // Message contains sensitive keyword 'encrypted_body'
      expect(capturedExtra.message).toBe('[REDACTED]');

      // safeField contains 'journal' - should be redacted for safety
      expect(capturedExtra.safeField).toBe('[REDACTED]');
    });
  });
});
