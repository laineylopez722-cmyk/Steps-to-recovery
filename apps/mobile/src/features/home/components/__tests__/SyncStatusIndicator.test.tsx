import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SyncStatusIndicator } from '../SyncStatusIndicator';
import { useSync } from '../../../../contexts/SyncContext';
import { useIsOnline } from '../../../../providers/QueryProvider';
import {
  useHasPendingMutations,
  useSyncPendingMutations,
} from '../../../../hooks/useOfflineMutation';

jest.mock('../../../../contexts/SyncContext', () => ({
  useSync: jest.fn(),
}));

jest.mock('../../../../providers/QueryProvider', () => ({
  useIsOnline: jest.fn(),
}));

jest.mock('../../../../hooks/useOfflineMutation', () => ({
  useHasPendingMutations: jest.fn(),
  useSyncPendingMutations: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

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

type SyncContextState = ReturnType<typeof useSync>;

const mockUseSync = useSync as jest.MockedFunction<typeof useSync>;
const mockUseIsOnline = useIsOnline as jest.MockedFunction<typeof useIsOnline>;
const mockUseHasPendingMutations = useHasPendingMutations as jest.MockedFunction<
  typeof useHasPendingMutations
>;
const mockUseSyncPendingMutations = useSyncPendingMutations as jest.MockedFunction<
  typeof useSyncPendingMutations
>;

function createSyncState(overrides: Partial<SyncContextState> = {}): SyncContextState {
  return {
    isSyncing: false,
    lastSyncTime: null,
    pendingCount: 0,
    error: null,
    isOnline: true,
    triggerSync: jest.fn(async (): Promise<void> => undefined),
    clearError: jest.fn(),
    ...overrides,
  };
}

describe('SyncStatusIndicator', () => {
  const mockSyncPendingMutations = jest.fn(async (): Promise<number> => 0);

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSync.mockReturnValue(createSyncState());
    mockUseIsOnline.mockReturnValue(true);
    mockUseHasPendingMutations.mockReturnValue(false);
    mockUseSyncPendingMutations.mockReturnValue(mockSyncPendingMutations);
  });

  it('shows offline paused state when device is offline with no pending items', () => {
    mockUseIsOnline.mockReturnValue(false);

    const { getByText } = render(<SyncStatusIndicator />);

    expect(getByText('Offline')).toBeTruthy();
    expect(getByText('Sync paused')).toBeTruthy();
  });

  it('shows queued count when offline with pending items', () => {
    mockUseIsOnline.mockReturnValue(false);
    mockUseHasPendingMutations.mockReturnValue(true);
    mockUseSync.mockReturnValue(createSyncState({ pendingCount: 2 }));

    const { getByText } = render(<SyncStatusIndicator />);

    expect(getByText('3 items queued')).toBeTruthy();
  });

  it('shows syncing state with remaining count', () => {
    mockUseHasPendingMutations.mockReturnValue(true);
    mockUseSync.mockReturnValue(createSyncState({ isSyncing: true, pendingCount: 2 }));

    const { getByText } = render(<SyncStatusIndicator />);

    expect(getByText('Syncing...')).toBeTruthy();
    expect(getByText('3 items remaining')).toBeTruthy();
  });

  it('shows pending state and CTA when not syncing', () => {
    mockUseHasPendingMutations.mockReturnValue(true);
    mockUseSync.mockReturnValue(createSyncState({ pendingCount: 2 }));

    const { getByText } = render(<SyncStatusIndicator />);

    expect(getByText('3 Pending')).toBeTruthy();
    expect(getByText('Tap to sync now')).toBeTruthy();
  });

  it('shows synced fallback text when no sync timestamp exists', () => {
    const { getByText } = render(<SyncStatusIndicator />);
    expect(getByText('All caught up')).toBeTruthy();
  });

  it('formats last sync time as relative minutes', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-06T12:05:00Z'));
    mockUseSync.mockReturnValue(
      createSyncState({ lastSyncTime: new Date('2026-02-06T12:00:00Z') }),
    );

    const { getByText } = render(<SyncStatusIndicator />);
    expect(getByText('5m ago')).toBeTruthy();

    jest.useRealTimers();
  });

  it('triggers both legacy sync and pending mutation sync on press', async () => {
    const triggerSync = jest.fn(async (): Promise<void> => undefined);
    const syncPending = jest.fn(async (): Promise<number> => 1);

    mockUseSync.mockReturnValue(createSyncState({ triggerSync }));
    mockUseSyncPendingMutations.mockReturnValue(syncPending);

    const { getByTestId } = render(<SyncStatusIndicator />);
    fireEvent.press(getByTestId('sync-completed-indicator'));

    await waitFor(() => {
      expect(triggerSync).toHaveBeenCalledTimes(1);
      expect(syncPending).toHaveBeenCalledTimes(1);
    });
  });

  it('does not trigger sync while offline', () => {
    const triggerSync = jest.fn(async (): Promise<void> => undefined);
    mockUseIsOnline.mockReturnValue(false);
    mockUseSync.mockReturnValue(createSyncState({ triggerSync }));

    const { getByTestId } = render(<SyncStatusIndicator />);
    fireEvent.press(getByTestId('sync-offline-indicator'));

    expect(triggerSync).not.toHaveBeenCalled();
    expect(mockSyncPendingMutations).not.toHaveBeenCalled();
  });

  it('exposes disabled accessibility state when sync is unavailable', () => {
    mockUseIsOnline.mockReturnValue(false);
    const { getByTestId } = render(<SyncStatusIndicator />);
    expect(getByTestId('sync-offline-indicator').props.accessibilityState.disabled).toBe(true);
  });
});
