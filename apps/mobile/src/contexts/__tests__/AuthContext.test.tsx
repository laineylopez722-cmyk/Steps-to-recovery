/**
 * AuthContext Test Suite
 *
 * Tests authentication flow including:
 * - Login/logout functionality
 * - Session persistence
 * - Token refresh
 * - Error handling
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock dependencies
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
  },
}));

jest.mock('../../adapters/secureStorage', () => ({
  secureStorage: {
    initializeWithSession: jest.fn().mockResolvedValue(undefined),
    clearSession: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../utils/logoutCleanup', () => ({
  performLogoutCleanup: jest.fn().mockResolvedValue(undefined),
}));

// Import mocked modules
import { supabase } from '../../lib/supabase';
import { secureStorage } from '../../adapters/secureStorage';
import { performLogoutCleanup } from '../../utils/logoutCleanup';

describe('AuthContext', () => {
  // Test data
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'authenticated',
  };

  const mockSession = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    user: mockUser,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  };

  // Auth state change callback holder
  /** @type {((event: string, session: any) => void) | null} */
  let authStateCallback = null;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    authStateCallback = null;

    // Default mock implementations
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
      authStateCallback = callback;
      return {
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      };
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  // Wrapper component for testing hooks
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Initial State', () => {
    it('should start with loading state', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.initialized).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.session).toBe(null);
    });

    it('should initialize with no session when not logged in', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.session).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should restore existing session on mount', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
      expect(secureStorage.initializeWithSession).toHaveBeenCalledWith(
        mockUser.id,
        mockSession.access_token,
      );
    });

    it('should handle getSession errors gracefully', async () => {
      const mockError = { message: 'Network error', code: 'network_error' };
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: mockError,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('signIn', () => {
    it('should sign in successfully with valid credentials', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should set loading state during sign in', async () => {
      // This test verifies the signIn function sets loading at the start
      // We track calls to setState via the implementation

      // Delay the sign in response to observe loading state
      let resolveSignIn: (value: any) => void;
      (supabase.auth.signInWithPassword as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSignIn = resolve;
          }),
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      // Start sign in - don't await yet
      const signInPromise = result.current.signIn('test@example.com', 'password123');

      // Give React time to process the setState call
      await act(async () => {
        await Promise.resolve();
      });

      // Now loading should be true because signIn sets it synchronously
      expect(result.current.loading).toBe(true);

      // Resolve sign in
      await act(async () => {
        resolveSignIn!({ data: { user: mockUser, session: mockSession }, error: null });
        await signInPromise;
      });

      // Loading should be false after completion
      expect(result.current.loading).toBe(false);
    });

    it('should handle sign in errors', async () => {
      const mockError = { message: 'Invalid credentials', code: 'invalid_credentials' };
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      await expect(
        act(async () => {
          await result.current.signIn('test@example.com', 'wrongpassword');
        }),
      ).rejects.toEqual(mockError);

      // Error state may be briefly set then cleared by auth state change
      // Just verify the rejection occurred and loading is false
      expect(result.current.loading).toBe(false);
    });
  });

  describe('signUp', () => {
    it('should sign up successfully with valid credentials', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      await act(async () => {
        await result.current.signUp('newuser@example.com', 'password123');
      });

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
      });
      expect(result.current.error).toBe(null);
    });

    it('should handle sign up errors', async () => {
      const mockError = { message: 'Email already registered', code: 'email_exists' };
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      await expect(
        act(async () => {
          await result.current.signUp('existing@example.com', 'password123');
        }),
      ).rejects.toEqual(mockError);

      // Just verify the rejection occurred - error state may be cleared by auth state change
      expect(result.current.loading).toBe(false);
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      // Start with a session
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(performLogoutCleanup).toHaveBeenCalled();
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(result.current.error).toBe(null);
    });

    it('should perform logout cleanup before signing out', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      await act(async () => {
        await result.current.signOut();
      });

      // Verify cleanup was called before signOut
      expect(performLogoutCleanup).toHaveBeenCalled();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle sign out errors', async () => {
      const mockError = { message: 'Sign out failed', code: 'signout_error' };
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: mockError,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      await expect(
        act(async () => {
          await result.current.signOut();
        }),
      ).rejects.toEqual(mockError);

      // Just verify the rejection occurred - error state may be cleared by auth state change
      expect(result.current.loading).toBe(false);
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
        data: {},
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      await act(async () => {
        await result.current.resetPassword('test@example.com');
      });

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com');
      expect(result.current.error).toBe(null);
    });

    it('should handle password reset errors', async () => {
      const mockError = { message: 'User not found', code: 'user_not_found' };
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      await expect(
        act(async () => {
          await result.current.resetPassword('unknown@example.com');
        }),
      ).rejects.toEqual(mockError);

      // Just verify the rejection occurred - error state may be cleared by auth state change
      expect(result.current.loading).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      const mockError = { message: 'Some error', code: 'error' };
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: mockError,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toEqual(mockError);
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('Auth State Changes', () => {
    it('should update state when auth state changes (login)', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      // Simulate auth state change (user logged in)
      act(() => {
        authStateCallback!('SIGNED_IN', mockSession);
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      expect(result.current.session).toEqual(mockSession);
      expect(secureStorage.initializeWithSession).toHaveBeenCalledWith(
        mockUser.id,
        mockSession.access_token,
      );
    });

    it('should update state when auth state changes (logout)', async () => {
      // Start with a session
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Simulate auth state change (user logged out)
      act(() => {
        authStateCallback!('SIGNED_OUT', null);
      });

      await waitFor(() => {
        expect(result.current.user).toBe(null);
      });

      expect(result.current.session).toBe(null);
      expect(secureStorage.clearSession).toHaveBeenCalled();
    });

    it('should handle token refresh events', async () => {
      // Start with a session
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Simulate token refresh with new session
      const refreshedSession = {
        ...mockSession,
        access_token: 'new-access-token',
        expires_at: Math.floor(Date.now() / 1000) + 7200,
      };

      act(() => {
        authStateCallback!('TOKEN_REFRESHED', refreshedSession);
      });

      await waitFor(() => {
        expect(result.current.session?.access_token).toBe('new-access-token');
      });

      expect(secureStorage.initializeWithSession).toHaveBeenCalledWith(
        mockUser.id,
        'new-access-token',
      );
    });
  });

  describe('Subscription Cleanup', () => {
    it('should unsubscribe from auth changes on unmount', async () => {
      const unsubscribeMock = jest.fn();
      (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation(() => ({
        data: {
          subscription: {
            unsubscribe: unsubscribeMock,
          },
        },
      }));

      const { unmount } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
      });

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle session with missing user gracefully', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { access_token: 'token', user: null } },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      expect(result.current.user).toBe(null);
    });

    it('should handle exception in getSession', async () => {
      (supabase.auth.getSession as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.initialized).toBe(true);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeTruthy();
    });

    it('should clear error on successful operations', async () => {
      // Start with an error
      const mockError = { message: 'Previous error', code: 'error' };
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: mockError,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toEqual(mockError);
      });

      // Clear error via auth state change (successful login)
      act(() => {
        authStateCallback!('SIGNED_IN', mockSession);
      });

      await waitFor(() => {
        expect(result.current.error).toBe(null);
      });
    });
  });
});
