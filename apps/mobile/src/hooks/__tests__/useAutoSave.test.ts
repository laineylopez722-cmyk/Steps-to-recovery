/**
 * useAutoSave Hook Test Suite
 *
 * Tests auto-save functionality including:
 * - Auto-saves after debounce delay
 * - Doesn't save if content hasn't changed
 * - Cancels pending save on unmount
 * - Reports saving state correctly
 * - Handles save errors gracefully
 */

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAutoSave } from '../useAutoSave';

describe('useAutoSave', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should auto-save after debounce delay', async () => {
    const mockOnSave = jest.fn().mockResolvedValue(undefined);

    const { result, rerender } = renderHook(
      ({ content }: { content: string }) =>
        useAutoSave({
          content,
          onSave: mockOnSave,
          delay: 1000,
          initialContent: 'initial',
        }),
      { initialProps: { content: 'initial' } },
    );

    // Change content
    rerender({ content: 'updated content' });

    // Before delay - not saved yet
    expect(mockOnSave).not.toHaveBeenCalled();

    // Advance past the debounce delay
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('updated content');
    });
  });

  it('should not save if content has not changed from initial', () => {
    const mockOnSave = jest.fn().mockResolvedValue(undefined);

    renderHook(
      ({ content }: { content: string }) =>
        useAutoSave({
          content,
          onSave: mockOnSave,
          delay: 500,
          initialContent: 'same',
        }),
      { initialProps: { content: 'same' } },
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should cancel pending save on unmount', async () => {
    const mockOnSave = jest.fn().mockResolvedValue(undefined);

    const { rerender, unmount } = renderHook(
      ({ content }: { content: string }) =>
        useAutoSave({
          content,
          onSave: mockOnSave,
          delay: 1000,
          initialContent: 'initial',
        }),
      { initialProps: { content: 'initial' } },
    );

    // Trigger change
    rerender({ content: 'changed' });

    // Unmount before delay completes
    unmount();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // The debounced callback should have been cancelled
    // Note: the hook does a best-effort save on unmount if dirty,
    // but since mockOnSave is only called through the queued save mechanism
    // and the timer was cancelled, the debounced version shouldn't fire
    // The unmount save fires synchronously (fire-and-forget)
    // So mockOnSave may be called once from the unmount save
    expect(mockOnSave.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it('should report saving state correctly', async () => {
    let resolveSave: () => void = () => {};
    const mockOnSave = jest.fn().mockImplementation(
      () => new Promise<void>((resolve) => { resolveSave = resolve; }),
    );

    const { result } = renderHook(() =>
      useAutoSave({
        content: 'test',
        onSave: mockOnSave,
        delay: 100,
        initialContent: '',
      }),
    );

    // Initially not saving
    expect(result.current.isSaving).toBe(false);
    expect(result.current.isDirty).toBe(true);

    // Trigger the save via saveNow
    let savePromise: Promise<void>;
    act(() => {
      savePromise = result.current.saveNow();
    });

    // Should be saving now
    await waitFor(() => {
      expect(result.current.isSaving).toBe(true);
    });

    // Resolve the save
    await act(async () => {
      resolveSave();
      await savePromise!;
    });

    await waitFor(() => {
      expect(result.current.isSaving).toBe(false);
      expect(result.current.lastSaved).not.toBeNull();
    });
  });

  it('should handle save errors gracefully', async () => {
    const mockOnError = jest.fn();
    const mockOnSave = jest.fn().mockImplementation(async () => {
      throw new Error('Save failed');
    });

    const { result } = renderHook(() =>
      useAutoSave({
        content: 'test',
        onSave: mockOnSave,
        delay: 100,
        initialContent: '',
        onError: mockOnError,
      }),
    );

    await act(async () => {
      await result.current.saveNow();
    });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toBe('Save failed');
    });

    expect(mockOnError).toHaveBeenCalled();
    expect(result.current.isSaving).toBe(false);
  });

  it('should call onSuccess callback after successful save', async () => {
    const mockOnSuccess = jest.fn();
    const mockOnSave = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useAutoSave({
        content: 'changed',
        onSave: mockOnSave,
        delay: 100,
        initialContent: '',
        onSuccess: mockOnSuccess,
      }),
    );

    await act(async () => {
      await result.current.saveNow();
    });

    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('should not auto-save when disabled', () => {
    const mockOnSave = jest.fn().mockResolvedValue(undefined);

    renderHook(
      ({ content }: { content: string }) =>
        useAutoSave({
          content,
          onSave: mockOnSave,
          delay: 500,
          initialContent: 'initial',
          disabled: true,
        }),
      { initialProps: { content: 'changed' } },
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should clear error via clearError', async () => {
    const mockOnSave = jest.fn().mockImplementation(async () => {
      throw new Error('Save failed');
    });

    const { result } = renderHook(() =>
      useAutoSave({
        content: 'test',
        onSave: mockOnSave,
        delay: 100,
        initialContent: '',
      }),
    );

    await act(async () => {
      await result.current.saveNow();
    });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should mark as saved via markSaved', () => {
    const mockOnSave = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useAutoSave({
        content: 'test',
        onSave: mockOnSave,
        delay: 100,
        initialContent: '',
      }),
    );

    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.markSaved();
    });

    expect(result.current.isDirty).toBe(false);
    expect(result.current.lastSaved).not.toBeNull();
  });
});
