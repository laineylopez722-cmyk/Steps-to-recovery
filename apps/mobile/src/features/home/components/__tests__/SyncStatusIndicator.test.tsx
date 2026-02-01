import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SyncStatusIndicator } from '../SyncStatusIndicator';
import { useSync } from '../../../../contexts/SyncContext';

/**
 * @typedef {Object} MockSyncState
 * @property {boolean} isSyncing
 * @property {Date | null} lastSyncTime
 * @property {number} pendingCount
 * @property {Error | null} error
 * @property {boolean} isOnline
 * @property {jest.Mock} triggerSync
 * @property {jest.Mock} clearError
 */

// Mock the useSync hook
jest.mock('../../../../contexts/SyncContext', () => ({
  useSync: jest.fn(),
}));

// Mock MaterialCommunityIcons
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

// Mock useTheme hook - inline mock colors to avoid scope issues
jest.mock('../../../../design-system/hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      surface: '#FFFFFF',
      primary: '#007AFF',
      danger: '#FF3B30',
      warning: '#FF9500',
      success: '#34C759',
      muted: '#8E8E93',
      textSecondary: '#3C3C43',
    },
    typography: {
      subheadline: { fontSize: 15, lineHeight: 20 },
      caption1: { fontSize: 12, lineHeight: 16 },
    },
  }),
}));

const mockUseSync = useSync as jest.MockedFunction<typeof useSync>;

// Mock colors for test assertions
const mockColors = {
  surface: '#FFFFFF',
  primary: '#007AFF',
  danger: '#FF3B30',
  warning: '#FF9500',
  success: '#34C759',
  muted: '#8E8E93',
  textSecondary: '#3C3C43',
};

/**
 * Helper function to create mock sync state
 */
function createMockSyncState(overrides: Partial<MockSyncState> = {}): MockSyncState {
  return {
    isSyncing: false,
    lastSyncTime: null,
    pendingCount: 0,
    error: null,
    isOnline: true,
    triggerSync: jest.fn(),
    clearError: jest.fn(),
    ...overrides,
  };
}

describe('SyncStatusIndicator', () => {
  const mockTriggerSync = jest.fn();
  const mockClearError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Visual States', () => {
    describe('Offline State', () => {
      beforeEach(() => {
        mockUseSync.mockReturnValue(
          createMockSyncState({
            isSyncing: false,
            lastSyncTime: null,
            pendingCount: 0,
            error: null,
            isOnline: false,
            triggerSync: mockTriggerSync,
            clearError: mockClearError,
          }),
        );
      });

      it('should render offline state with gray cloud icon', () => {
        const { getByText, UNSAFE_getByType } = render(<SyncStatusIndicator />);

        expect(getByText('Offline')).toBeTruthy();
        expect(getByText('Sync paused')).toBeTruthy();

        // Verify icon props
        const icon = UNSAFE_getByType('MaterialCommunityIcons' as any);
        expect(icon.props.name).toBe('cloud-off-outline');
        expect(icon.props.color).toBe(mockColors.muted); // Gray
      });

      it('should display correct label with gray color', () => {
        const { getByText } = render(<SyncStatusIndicator />);

        const label = getByText('Offline');
        expect(label.props.style).toEqual(
          expect.arrayContaining([expect.objectContaining({ color: mockColors.muted })]),
        );
      });

      it('should show "Sync paused" as subtext', () => {
        const { getByText } = render(<SyncStatusIndicator />);
        expect(getByText('Sync paused')).toBeTruthy();
      });
    });

    describe('Syncing State', () => {
      beforeEach(() => {
        mockUseSync.mockReturnValue(
          createMockSyncState({
            isSyncing: true,
            lastSyncTime: null,
            pendingCount: 3,
            error: null,
            isOnline: true,
            triggerSync: mockTriggerSync,
            clearError: mockClearError,
          }),
        );
      });

      it('should render syncing state with spinner', () => {
        const { getByText, UNSAFE_getByType } = render(<SyncStatusIndicator />);

        expect(getByText('Syncing...')).toBeTruthy();
        expect(getByText('3 items')).toBeTruthy();

        // Verify ActivityIndicator is rendered (not icon when syncing)
        const spinner = UNSAFE_getByType('ActivityIndicator' as any);
        expect(spinner.props.size).toBe(20);
        expect(spinner.props.color).toBe(mockColors.primary); // Blue
      });

      it('should display correct label with blue color', () => {
        const { getByText } = render(<SyncStatusIndicator />);

        const label = getByText('Syncing...');
        expect(label.props.style).toEqual(
          expect.arrayContaining([expect.objectContaining({ color: mockColors.primary })]),
        );
      });

      it('should show item count as subtext', () => {
        const { getByText } = render(<SyncStatusIndicator />);
        expect(getByText('3 items')).toBeTruthy();
      });

      it('should use singular "item" when pendingCount is 1', () => {
        mockUseSync.mockReturnValue(
          createMockSyncState({
            isSyncing: true,
            lastSyncTime: null,
            pendingCount: 1,
            error: null,
            isOnline: true,
            triggerSync: mockTriggerSync,
            clearError: mockClearError,
          }),
        );

        const { getByText } = render(<SyncStatusIndicator />);
        expect(getByText('1 item')).toBeTruthy();
      });
    });

    describe('Error State', () => {
      beforeEach(() => {
        mockUseSync.mockReturnValue(
          createMockSyncState({
            isSyncing: false,
            lastSyncTime: null,
            pendingCount: 0,
            error: new Error('Sync failed'),
            isOnline: true,
            triggerSync: mockTriggerSync,
            clearError: mockClearError,
          }),
        );
      });

      it('should render error state with red alert icon', () => {
        const { getByText, UNSAFE_getByType } = render(<SyncStatusIndicator />);

        expect(getByText('Sync Error')).toBeTruthy();
        expect(getByText('Tap to retry')).toBeTruthy();

        // Verify icon props
        const icon = UNSAFE_getByType('MaterialCommunityIcons' as any);
        expect(icon.props.name).toBe('cloud-alert');
        expect(icon.props.color).toBe(mockColors.danger); // Red
      });

      it('should display correct label with red color', () => {
        const { getByText } = render(<SyncStatusIndicator />);

        const label = getByText('Sync Error');
        expect(label.props.style).toEqual(
          expect.arrayContaining([expect.objectContaining({ color: mockColors.danger })]),
        );
      });

      it('should show "Tap to retry" as subtext', () => {
        const { getByText } = render(<SyncStatusIndicator />);
        expect(getByText('Tap to retry')).toBeTruthy();
      });
    });

    describe('Pending State', () => {
      beforeEach(() => {
        mockUseSync.mockReturnValue(
          createMockSyncState({
            isSyncing: false,
            lastSyncTime: null,
            pendingCount: 5,
            error: null,
            isOnline: true,
            triggerSync: mockTriggerSync,
            clearError: mockClearError,
          }),
        );
      });

      it('should render pending state with orange upload icon', () => {
        const { getByText, UNSAFE_getByType } = render(<SyncStatusIndicator />);

        expect(getByText('5 Pending')).toBeTruthy();
        expect(getByText('Tap to sync')).toBeTruthy();

        // Verify icon props
        const icon = UNSAFE_getByType('MaterialCommunityIcons' as any);
        expect(icon.props.name).toBe('cloud-upload-outline');
        expect(icon.props.color).toBe(mockColors.warning); // Orange
      });

      it('should display correct label with orange color', () => {
        const { getByText } = render(<SyncStatusIndicator />);

        const label = getByText('5 Pending');
        expect(label.props.style).toEqual(
          expect.arrayContaining([expect.objectContaining({ color: mockColors.warning })]),
        );
      });

      it('should show "Tap to sync" as subtext', () => {
        const { getByText } = render(<SyncStatusIndicator />);
        expect(getByText('Tap to sync')).toBeTruthy();
      });

      it('should show singular "1 Pending"', () => {
        mockUseSync.mockReturnValue(
          createMockSyncState({
            isSyncing: false,
            lastSyncTime: null,
            pendingCount: 1,
            error: null,
            isOnline: true,
            triggerSync: mockTriggerSync,
            clearError: mockClearError,
          }),
        );

        const { getByText } = render(<SyncStatusIndicator />);
        expect(getByText('1 Pending')).toBeTruthy();
      });
    });

    describe('Synced State', () => {
      beforeEach(() => {
        mockUseSync.mockReturnValue(
          createMockSyncState({
            isSyncing: false,
            lastSyncTime: new Date('2025-12-31T12:00:00Z'),
            pendingCount: 0,
            error: null,
            isOnline: true,
            triggerSync: mockTriggerSync,
            clearError: mockClearError,
          }),
        );
      });

      it('should render synced state with green check icon', () => {
        const { getByText, UNSAFE_getByType } = render(<SyncStatusIndicator />);

        expect(getByText('Synced')).toBeTruthy();

        // Verify icon props
        const icon = UNSAFE_getByType('MaterialCommunityIcons' as any);
        expect(icon.props.name).toBe('cloud-check');
        expect(icon.props.color).toBe(mockColors.success); // Green
      });

      it('should display correct label with green color', () => {
        const { getByText } = render(<SyncStatusIndicator />);

        const label = getByText('Synced');
        expect(label.props.style).toEqual(
          expect.arrayContaining([expect.objectContaining({ color: mockColors.success })]),
        );
      });

      it('should show last sync time as subtext', () => {
        // Freeze time for consistent testing
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2025-12-31T12:05:00Z')); // 5 minutes after last sync

        const { getByText } = render(<SyncStatusIndicator />);
        expect(getByText('5m ago')).toBeTruthy();

        jest.useRealTimers();
      });

      it('should show "Never" when lastSyncTime is null', () => {
        mockUseSync.mockReturnValue(
          createMockSyncState({
            isSyncing: false,
            lastSyncTime: null,
            pendingCount: 0,
            error: null,
            isOnline: true,
            triggerSync: mockTriggerSync,
            clearError: mockClearError,
          }),
        );

        const { getByText } = render(<SyncStatusIndicator />);
        expect(getByText('Never')).toBeTruthy();
      });
    });
  });

  describe('Time Formatting', () => {
    const setupSyncedState = (lastSyncTime: Date | null) => {
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: false,
          lastSyncTime,
          pendingCount: 0,
          error: null,
          isOnline: true,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );
    };

    beforeEach(() => {
      // Freeze current time so formatSyncTime() is deterministic
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-12-31T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should display "Just now" for < 1 minute', () => {
      // 30 seconds ago
      setupSyncedState(new Date('2025-12-31T11:59:30Z'));
      const { getByText } = render(<SyncStatusIndicator />);
      expect(getByText('Just now')).toBeTruthy();
    });

    it('should display "Just now" for exactly 0 seconds', () => {
      // Current time (0 seconds ago)
      setupSyncedState(new Date('2025-12-31T12:00:00Z'));
      const { getByText } = render(<SyncStatusIndicator />);
      expect(getByText('Just now')).toBeTruthy();
    });

    it('should display "Just now" for 59 seconds', () => {
      // 59 seconds ago
      setupSyncedState(new Date('2025-12-31T11:59:01Z'));
      const { getByText } = render(<SyncStatusIndicator />);
      expect(getByText('Just now')).toBeTruthy();
    });

    it('should display "1m ago" for exactly 1 minute', () => {
      setupSyncedState(new Date('2025-12-31T11:59:00Z'));
      const { getByText } = render(<SyncStatusIndicator />);
      expect(getByText('1m ago')).toBeTruthy();
    });

    it('should display "5m ago" for 5 minutes', () => {
      setupSyncedState(new Date('2025-12-31T11:55:00Z'));
      const { getByText } = render(<SyncStatusIndicator />);
      expect(getByText('5m ago')).toBeTruthy();
    });

    it('should display "30m ago" for 30 minutes', () => {
      setupSyncedState(new Date('2025-12-31T11:30:00Z'));
      const { getByText } = render(<SyncStatusIndicator />);
      expect(getByText('30m ago')).toBeTruthy();
    });

    it('should display "59m ago" for 59 minutes', () => {
      setupSyncedState(new Date('2025-12-31T11:01:00Z'));
      const { getByText } = render(<SyncStatusIndicator />);
      expect(getByText('59m ago')).toBeTruthy();
    });

    it('should display "1h ago" for exactly 1 hour', () => {
      setupSyncedState(new Date('2025-12-31T11:00:00Z'));
      const { getByText } = render(<SyncStatusIndicator />);
      expect(getByText('1h ago')).toBeTruthy();
    });

    it('should display "2h ago" for 2 hours', () => {
      setupSyncedState(new Date('2025-12-31T10:00:00Z'));
      const { getByText } = render(<SyncStatusIndicator />);
      expect(getByText('2h ago')).toBeTruthy();
    });

    it('should display "12h ago" for 12 hours', () => {
      setupSyncedState(new Date('2025-12-31T00:00:00Z'));
      const { getByText } = render(<SyncStatusIndicator />);
      expect(getByText('12h ago')).toBeTruthy();
    });

    it('should display "23h ago" for 23 hours', () => {
      setupSyncedState(new Date('2025-12-30T13:00:00Z'));
      const { getByText } = render(<SyncStatusIndicator />);
      expect(getByText('23h ago')).toBeTruthy();
    });

    it('should display "1d ago" for exactly 1 day', () => {
      setupSyncedState(new Date('2025-12-30T12:00:00Z'));
      const { getByText } = render(<SyncStatusIndicator />);
      expect(getByText('1d ago')).toBeTruthy();
    });

    it('should display "3d ago" for 3 days', () => {
      setupSyncedState(new Date('2025-12-28T12:00:00Z'));
      const { getByText } = render(<SyncStatusIndicator />);
      expect(getByText('3d ago')).toBeTruthy();
    });

    it('should display "7d ago" for 7 days', () => {
      setupSyncedState(new Date('2025-12-24T12:00:00Z'));
      const { getByText } = render(<SyncStatusIndicator />);
      expect(getByText('7d ago')).toBeTruthy();
    });

    it('should display "Never" when lastSyncTime is null', () => {
      setupSyncedState(null);
      const { getByText } = render(<SyncStatusIndicator />);
      expect(getByText('Never')).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('should trigger sync when tapping online and not syncing', () => {
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: false,
          lastSyncTime: null,
          pendingCount: 0,
          error: null,
          isOnline: true,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      const { getByTestId } = render(<SyncStatusIndicator />);
      const touchable = getByTestId('sync-status-indicator');

      fireEvent.press(touchable);

      expect(mockTriggerSync).toHaveBeenCalledTimes(1);
    });

    it('should not trigger sync when tapping offline', () => {
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: false,
          lastSyncTime: null,
          pendingCount: 0,
          error: null,
          isOnline: false,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      const { getByTestId } = render(<SyncStatusIndicator />);
      const touchable = getByTestId('sync-status-indicator');

      fireEvent.press(touchable);

      expect(mockTriggerSync).not.toHaveBeenCalled();
    });

    it('should not trigger sync when already syncing', () => {
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: true,
          lastSyncTime: null,
          pendingCount: 2,
          error: null,
          isOnline: true,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      const { getByTestId } = render(<SyncStatusIndicator />);
      const touchable = getByTestId('sync-status-indicator');

      fireEvent.press(touchable);

      expect(mockTriggerSync).not.toHaveBeenCalled();
    });

    it('should trigger sync from error state', () => {
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: false,
          lastSyncTime: null,
          pendingCount: 0,
          error: new Error('Sync failed'),
          isOnline: true,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      const { getByTestId } = render(<SyncStatusIndicator />);
      const touchable = getByTestId('sync-status-indicator');

      fireEvent.press(touchable);

      expect(mockTriggerSync).toHaveBeenCalledTimes(1);
    });

    it('should trigger sync from pending state', () => {
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: false,
          lastSyncTime: null,
          pendingCount: 3,
          error: null,
          isOnline: true,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      const { getByTestId } = render(<SyncStatusIndicator />);
      const touchable = getByTestId('sync-status-indicator');

      fireEvent.press(touchable);

      expect(mockTriggerSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have disabled state when offline', () => {
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: false,
          lastSyncTime: null,
          pendingCount: 0,
          error: null,
          isOnline: false,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      const { getByTestId } = render(<SyncStatusIndicator />);
      const touchable = getByTestId('sync-status-indicator');

      // Check accessibilityState for disabled status
      expect(touchable.props.accessibilityState?.disabled).toBe(true);
    });

    it('should have disabled state when syncing', () => {
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: true,
          lastSyncTime: null,
          pendingCount: 1,
          error: null,
          isOnline: true,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      const { getByTestId } = render(<SyncStatusIndicator />);
      const touchable = getByTestId('sync-status-indicator');

      expect(touchable.props.accessibilityState?.disabled).toBe(true);
    });

    it('should not be disabled when online and not syncing', () => {
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: false,
          lastSyncTime: new Date(),
          pendingCount: 0,
          error: null,
          isOnline: true,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      const { getByTestId } = render(<SyncStatusIndicator />);
      const touchable = getByTestId('sync-status-indicator');

      expect(touchable.props.accessibilityState?.disabled).toBe(false);
    });

    it('should not be disabled when online with pending items', () => {
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: false,
          lastSyncTime: null,
          pendingCount: 5,
          error: null,
          isOnline: true,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      const { getByTestId } = render(<SyncStatusIndicator />);
      const touchable = getByTestId('sync-status-indicator');

      expect(touchable.props.accessibilityState?.disabled).toBe(false);
    });

    it('should not be disabled when online with error', () => {
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: false,
          lastSyncTime: null,
          pendingCount: 0,
          error: new Error('Sync failed'),
          isOnline: true,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      const { getByTestId } = render(<SyncStatusIndicator />);
      const touchable = getByTestId('sync-status-indicator');

      expect(touchable.props.accessibilityState?.disabled).toBe(false);
    });

    it('should render touchable component correctly', () => {
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: false,
          lastSyncTime: null,
          pendingCount: 0,
          error: null,
          isOnline: true,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      const { getByTestId } = render(<SyncStatusIndicator />);
      const touchable = getByTestId('sync-status-indicator');

      // Verify the touchable component is rendered
      // Note: activeOpacity is a visual property that may not be exposed in test props
      expect(touchable).toBeTruthy();
    });
  });

  describe('Pending Count', () => {
    it('should show "1 Pending" for singular count', () => {
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: false,
          lastSyncTime: null,
          pendingCount: 1,
          error: null,
          isOnline: true,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      const { getByText } = render(<SyncStatusIndicator />);
      expect(getByText('1 Pending')).toBeTruthy();
    });

    it('should show "5 Pending" for plural count', () => {
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: false,
          lastSyncTime: null,
          pendingCount: 5,
          error: null,
          isOnline: true,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      const { getByText } = render(<SyncStatusIndicator />);
      expect(getByText('5 Pending')).toBeTruthy();
    });

    it('should show "Synced" when pendingCount is 0 and online', () => {
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: false,
          lastSyncTime: null,
          pendingCount: 0,
          error: null,
          isOnline: true,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      const { getByText } = render(<SyncStatusIndicator />);
      expect(getByText('Synced')).toBeTruthy();
    });

    it('should show "100 Pending" for large counts', () => {
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: false,
          lastSyncTime: null,
          pendingCount: 100,
          error: null,
          isOnline: true,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      const { getByText } = render(<SyncStatusIndicator />);
      expect(getByText('100 Pending')).toBeTruthy();
    });
  });

  describe('Real-time Updates', () => {
    it('should update when pendingCount changes', () => {
      // Initial state: 0 pending
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: false,
          lastSyncTime: null,
          pendingCount: 0,
          error: null,
          isOnline: true,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      const { getByText, rerender } = render(<SyncStatusIndicator />);
      expect(getByText('Synced')).toBeTruthy();

      // Update to 3 pending
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: false,
          lastSyncTime: null,
          pendingCount: 3,
          error: null,
          isOnline: true,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      rerender(<SyncStatusIndicator />);
      expect(getByText('3 Pending')).toBeTruthy();
    });

    it('should update when isOnline changes', () => {
      // Initial state: online
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: false,
          lastSyncTime: null,
          pendingCount: 0,
          error: null,
          isOnline: true,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      const { getByText, rerender, UNSAFE_getByType } = render(<SyncStatusIndicator />);
      expect(getByText('Synced')).toBeTruthy();

      // Update to offline
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: false,
          lastSyncTime: null,
          pendingCount: 0,
          error: null,
          isOnline: false,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      rerender(<SyncStatusIndicator />);
      expect(getByText('Offline')).toBeTruthy();

      const icon = UNSAFE_getByType('MaterialCommunityIcons' as any);
      expect(icon.props.name).toBe('cloud-off-outline');
      expect(icon.props.color).toBe(mockColors.muted);
    });

    it('should update when isSyncing changes', () => {
      // Initial state: not syncing
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: false,
          lastSyncTime: null,
          pendingCount: 2,
          error: null,
          isOnline: true,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      const { getByText, rerender, UNSAFE_queryByType } = render(<SyncStatusIndicator />);
      expect(getByText('2 Pending')).toBeTruthy();

      // Update to syncing
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: true,
          lastSyncTime: null,
          pendingCount: 2,
          error: null,
          isOnline: true,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      rerender(<SyncStatusIndicator />);
      expect(getByText('Syncing...')).toBeTruthy();
      expect(UNSAFE_queryByType('ActivityIndicator' as any)).toBeTruthy();
    });

    it('should update when error state changes', () => {
      // Initial state: no error
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: false,
          lastSyncTime: null,
          pendingCount: 0,
          error: null,
          isOnline: true,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      const { getByText, rerender } = render(<SyncStatusIndicator />);
      expect(getByText('Synced')).toBeTruthy();

      // Update to error
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: false,
          lastSyncTime: null,
          pendingCount: 0,
          error: new Error('Network error'),
          isOnline: true,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      rerender(<SyncStatusIndicator />);
      expect(getByText('Sync Error')).toBeTruthy();
      expect(getByText('Tap to retry')).toBeTruthy();
    });

    it('should update when lastSyncTime changes', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-12-31T12:00:00Z'));

      // Initial state: never synced
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: false,
          lastSyncTime: null,
          pendingCount: 0,
          error: null,
          isOnline: true,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      const { getByText, rerender } = render(<SyncStatusIndicator />);
      expect(getByText('Never')).toBeTruthy();

      // Update to recently synced
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: false,
          lastSyncTime: new Date('2025-12-31T11:55:00Z'), // 5 minutes ago
          pendingCount: 0,
          error: null,
          isOnline: true,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      rerender(<SyncStatusIndicator />);
      expect(getByText('5m ago')).toBeTruthy();

      jest.useRealTimers();
    });
  });

  describe('State Priority', () => {
    it('should prioritize offline over all other states', () => {
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: true,
          lastSyncTime: null,
          pendingCount: 5,
          error: new Error('Some error'),
          isOnline: false, // Offline takes priority
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      const { getByText } = render(<SyncStatusIndicator />);
      expect(getByText('Offline')).toBeTruthy();
    });

    it('should prioritize syncing over error and pending when online', () => {
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: true, // Syncing takes priority
          lastSyncTime: null,
          pendingCount: 5,
          error: new Error('Some error'),
          isOnline: true,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      const { getByText } = render(<SyncStatusIndicator />);
      expect(getByText('Syncing...')).toBeTruthy();
    });

    it('should prioritize error over pending when not syncing', () => {
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: false,
          lastSyncTime: null,
          pendingCount: 5,
          error: new Error('Some error'), // Error takes priority over pending
          isOnline: true,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      const { getByText } = render(<SyncStatusIndicator />);
      expect(getByText('Sync Error')).toBeTruthy();
    });

    it('should prioritize pending over synced when items exist', () => {
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: false,
          lastSyncTime: new Date(),
          pendingCount: 3, // Pending takes priority over synced
          error: null,
          isOnline: true,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      const { getByText } = render(<SyncStatusIndicator />);
      expect(getByText('3 Pending')).toBeTruthy();
    });

    it('should show synced as fallback state', () => {
      mockUseSync.mockReturnValue(
        createMockSyncState({
          isSyncing: false,
          lastSyncTime: new Date(),
          pendingCount: 0,
          error: null,
          isOnline: true,
          triggerSync: mockTriggerSync,
          clearError: mockClearError,
        }),
      );

      const { getByText } = render(<SyncStatusIndicator />);
      expect(getByText('Synced')).toBeTruthy();
    });
  });
});
