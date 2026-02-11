/**
 * useAutoSave Hook Test Suite
 *
 * Tests auto-save functionality including:
 * - saveNow triggers save
 * - Doesn't save if content hasn't changed
 * - Reports saving state correctly
 * - Handles save errors gracefully
 * - markSaved / clearError actions
 */

// Mock the debounced callback to avoid timer complications
const mockDebouncedFn = jest.fn();
const mockCancelFn = jest.fn();

jest.mock('../useDebouncedValue', () => ({
  ...jest.requireActual('../useDebouncedValue'),
  useDebouncedCallback: jest.fn(() => [mockDebouncedFn, mockCancelFn]),
}));

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
  });

  it('should report isDirty when content differs from initial', () => {
    const mockOnSave = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useAutoSave({
        content: 'changed',
        onSave: mockOnSave,
        delay: 2000,
        initialContent: 'initial',
      }),
    );

    expect(result.current.isDirty).toBe(true);
  });

  it('should not report isDirty when content matches initial', () => {
    const mockOnSave = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useAutoSave({
        content: 'same',
        onSave: mockOnSave,
        delay: 2000,
        initialContent: 'same',
      }),
    );

    expect(result.current.isDirty).toBe(false);
  });

  it('should save immediately via saveNow', async () => {
    const mockOnSave = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useAutoSave({
        content: 'new content',
        onSave: mockOnSave,
        delay: 2000,
        initialContent: '',
      }),
    );

    await act(async () => {
      await result.current.saveNow();
    });

    expect(mockOnSave).toHaveBeenCalledWith('new content');
    expect(result.current.isSaving).toBe(false);
    expect(result.current.lastSaved).not.toBeNull();
    expect(result.current.isDirty).toBe(false);
  });

  it('should cancel debounced save when saveNow is called', async () => {
    const mockOnSave = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useAutoSave({
        content: 'test',
        onSave: mockOnSave,
        delay: 2000,
        initialContent: '',
      }),
    );

    await act(async () => {
      await result.current.saveNow();
    });

    expect(mockCancelFn).toHaveBeenCalled();
  });

  it('should not save via saveNow if content matches saved content', async () => {
    const mockOnSave = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useAutoSave({
        content: 'same',
        onSave: mockOnSave,
        delay: 2000,
        initialContent: 'same',
      }),
    );

    await act(async () => {
      await result.current.saveNow();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should report saving state correctly', async () => {
    let resolveSave: () => void = () => {};
    const mockOnSave = jest.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        }),
    );

    const { result } = renderHook(() =>
      useAutoSave({
        content: 'test',
        onSave: mockOnSave,
        delay: 2000,
        initialContent: '',
      }),
    );

    expect(result.current.isSaving).toBe(false);

    let savePromise: Promise<void>;
    act(() => {
      savePromise = result.current.saveNow();
    });

    await waitFor(() => {
      expect(result.current.isSaving).toBe(true);
    });

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
        delay: 2000,
        initialContent: '',
        onError: mockOnError,
      }),
    );

    await act(async () => {
      await result.current.saveNow();
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('Save failed');
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
        delay: 2000,
        initialContent: '',
        onSuccess: mockOnSuccess,
      }),
    );

    await act(async () => {
      await result.current.saveNow();
    });

    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('should clear error via clearError', async () => {
    const mockOnSave = jest.fn().mockImplementation(async () => {
      throw new Error('Save failed');
    });

    const { result } = renderHook(() =>
      useAutoSave({
        content: 'test',
        onSave: mockOnSave,
        delay: 2000,
        initialContent: '',
      }),
    );

    await act(async () => {
      await result.current.saveNow();
    });

    expect(result.current.error).not.toBeNull();

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
        delay: 2000,
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

  it('should handle non-Error exceptions as "Save failed"', async () => {
    const mockOnSave = jest.fn().mockImplementation(async () => {
      // eslint-disable-next-line no-throw-literal
      throw 'string error';
    });

    const { result } = renderHook(() =>
      useAutoSave({
        content: 'test',
        onSave: mockOnSave,
        delay: 2000,
        initialContent: '',
      }),
    );

    await act(async () => {
      await result.current.saveNow();
    });

    expect(result.current.error?.message).toBe('Save failed');
  });

  it('should trigger debounced save when content changes', () => {
    const mockOnSave = jest.fn().mockResolvedValue(undefined);

    const { rerender } = renderHook(
      ({ content }: { content: string }) =>
        useAutoSave({
          content,
          onSave: mockOnSave,
          delay: 2000,
          initialContent: 'initial',
        }),
      { initialProps: { content: 'initial' } },
    );

    mockDebouncedFn.mockClear();

    rerender({ content: 'changed' });

    expect(mockDebouncedFn).toHaveBeenCalled();
  });
});
