/**
 * NotificationContext Test Suite
 *
 * Tests notification management including:
 * - Permission status checking and requesting
 * - Notification handler registration
 * - Push token retrieval
 * - Web platform behavior (notifications unavailable)
 * - Hook usage outside provider
 */

import React from 'react';
import { Platform } from 'react-native';
import { renderHook, act, waitFor } from '@testing-library/react-native';

// Mock dependencies BEFORE imports
jest.mock('../../lib/notifications', () => ({
  requestNotificationPermissions: jest.fn(),
  getNotificationPermissionStatus: jest.fn(),
  registerNotificationHandlers: jest.fn(),
  getLastNotificationResponse: jest.fn(),
}));

jest.mock('../../navigation/navigationRef', () => ({
  navigateFromNotification: jest.fn(),
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));
import {
  requestNotificationPermissions,
  getNotificationPermissionStatus,
  registerNotificationHandlers,
  getLastNotificationResponse,
} from '../../lib/notifications';
import { navigateFromNotification } from '../../navigation/navigationRef';
import { NotificationProvider, useNotifications } from '../NotificationContext';

describe('NotificationContext', () => {
  // Cleanup function returned by registerNotificationHandlers
  const mockCleanup = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Reset Platform to iOS for most tests
    (Platform as { OS: string }).OS = 'ios';

    // Default mock implementations
    (getNotificationPermissionStatus as jest.Mock).mockResolvedValue('undetermined');
    (registerNotificationHandlers as jest.Mock).mockReturnValue(mockCleanup);
    (getLastNotificationResponse as jest.Mock).mockResolvedValue(null);
    (requestNotificationPermissions as jest.Mock).mockResolvedValue({
      status: 'granted',
      canAskAgain: false,
      expoPushToken: 'ExponentPushToken[mock-token]',
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  // Wrapper component for testing hooks
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>{children}</NotificationProvider>
  );

  describe('useNotifications hook', () => {
    it('should throw error when used outside NotificationProvider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useNotifications());
      }).toThrow('useNotifications must be used within NotificationProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Initial State', () => {
    it('should start with loading state and undetermined permission', async () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.expoPushToken).toBe(null);
      expect(result.current.notificationsEnabled).toBe(true);
    });

    it('should check permission status on mount', async () => {
      (getNotificationPermissionStatus as jest.Mock).mockResolvedValue('granted');

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(getNotificationPermissionStatus).toHaveBeenCalled();
      expect(result.current.permissionStatus).toBe('granted');
    });

    it('should register notification handlers on mount', async () => {
      renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(registerNotificationHandlers).toHaveBeenCalled();
      });

      const handlerArg = (registerNotificationHandlers as jest.Mock).mock.calls[0][0];
      expect(handlerArg).toHaveProperty('onNotificationReceived');
      expect(handlerArg).toHaveProperty('onNotificationResponse');
    });
  });

  describe('Permission Requests', () => {
    it('should request permissions and return true when granted', async () => {
      (requestNotificationPermissions as jest.Mock).mockResolvedValue({
        status: 'granted',
        canAskAgain: false,
        expoPushToken: 'ExponentPushToken[test-token]',
      });

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let granted: boolean | undefined;
      await act(async () => {
        granted = await result.current.requestPermissions();
      });

      expect(granted).toBe(true);
      expect(result.current.permissionStatus).toBe('granted');
      expect(result.current.expoPushToken).toBe('ExponentPushToken[test-token]');
    });

    it('should return false when permission is denied', async () => {
      (requestNotificationPermissions as jest.Mock).mockResolvedValue({
        status: 'denied',
        canAskAgain: false,
      });

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let granted: boolean | undefined;
      await act(async () => {
        granted = await result.current.requestPermissions();
      });

      expect(granted).toBe(false);
      expect(result.current.permissionStatus).toBe('denied');
      expect(result.current.expoPushToken).toBe(null);
    });

    it('should handle permission request error gracefully', async () => {
      (requestNotificationPermissions as jest.Mock).mockImplementation(async () => {
        throw new Error('Permission request failed');
      });

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let granted: boolean | undefined;
      await act(async () => {
        granted = await result.current.requestPermissions();
      });

      // Should return false on error, not throw
      expect(granted).toBe(false);
    });
  });

  describe('Check Permission Status', () => {
    it('should update permission status when checked', async () => {
      (getNotificationPermissionStatus as jest.Mock).mockResolvedValue('undetermined');

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Now change the mock to return 'granted'
      (getNotificationPermissionStatus as jest.Mock).mockResolvedValue('granted');

      await act(async () => {
        await result.current.checkPermissionStatus();
      });

      expect(result.current.permissionStatus).toBe('granted');
    });

    it('should handle check permission error gracefully', async () => {
      (getNotificationPermissionStatus as jest.Mock)
        .mockResolvedValueOnce('undetermined') // Initial check
        .mockImplementation(async () => {
          throw new Error('Check failed');
        });

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should not throw
      await act(async () => {
        await result.current.checkPermissionStatus();
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Notification Preferences', () => {
    it('should default to notifications enabled', async () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      expect(result.current.notificationsEnabled).toBe(true);
    });

    it('should allow toggling notifications enabled state', async () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setNotificationsEnabled(false);
      });

      expect(result.current.notificationsEnabled).toBe(false);

      act(() => {
        result.current.setNotificationsEnabled(true);
      });

      expect(result.current.notificationsEnabled).toBe(true);
    });
  });

  describe('Web Platform Behavior', () => {
    beforeEach(() => {
      (Platform as { OS: string }).OS = 'web';
    });

    it('should set permission status to unavailable on web', async () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.permissionStatus).toBe('unavailable');
    });

    it('should not register notification handlers on web', async () => {
      renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        // Wait for effects to run
        expect(registerNotificationHandlers).not.toHaveBeenCalled();
      });
    });

    it('should not check permission status on web', async () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(getNotificationPermissionStatus).not.toHaveBeenCalled();
    });
  });

  describe('Cold Start Notification Handling', () => {
    it('should handle notification that launched the app', async () => {
      const mockResponse = {
        notification: {
          request: {
            content: {
              title: 'Morning Check-in',
              data: {
                screen: 'Home.MorningIntention' as const,
                type: 'morning-checkin' as const,
              },
            },
          },
        },
        actionIdentifier: 'default',
      };

      (getLastNotificationResponse as jest.Mock).mockResolvedValue(mockResponse);

      renderHook(() => useNotifications(), { wrapper });

      // Advance past the 1-second delay for initial notification handling
      await act(async () => {
        jest.advanceTimersByTime(1500);
      });

      await waitFor(() => {
        expect(navigateFromNotification).toHaveBeenCalledWith(
          mockResponse.notification.request.content.data,
        );
      });
    });

    it('should not navigate when no launch notification exists', async () => {
      (getLastNotificationResponse as jest.Mock).mockResolvedValue(null);

      renderHook(() => useNotifications(), { wrapper });

      await act(async () => {
        jest.advanceTimersByTime(1500);
      });

      // navigateFromNotification should NOT be called when there's no response
      await waitFor(() => {
        expect(getLastNotificationResponse).toHaveBeenCalled();
      });

      // Only the initial call check, no navigation call
      expect(navigateFromNotification).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup notification handlers on unmount', async () => {
      const { unmount } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(registerNotificationHandlers).toHaveBeenCalled();
      });

      unmount();

      expect(mockCleanup).toHaveBeenCalled();
    });
  });
});
