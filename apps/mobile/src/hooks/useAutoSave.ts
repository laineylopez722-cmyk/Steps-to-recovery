/**
 * Auto Save Hook
 *
 * Automatically saves content after a debounced delay.
 * Tracks save status and provides manual save trigger.
 *
 * **Use Cases**:
 * - Journal entry auto-save
 * - Step work answer persistence
 * - Form draft saving
 *
 * @example
 * ```ts
 * const { isSaving, lastSaved, saveNow, isDirty } = useAutoSave({
 *   content: journalText,
 *   onSave: async (text) => {
 *     await saveJournalEntry(entryId, text);
 *   },
 *   delay: 2000,
 * });
 *
 * // Shows: "Saving..." or "Saved at 3:45 PM"
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useDebouncedCallback } from './useDebouncedValue';
import { logger } from '../utils/logger';

interface AutoSaveOptions<T> {
  /** Content to auto-save */
  content: T;
  /** Save function (receives content) */
  onSave: (content: T) => Promise<void>;
  /** Debounce delay in ms (default: 2000) */
  delay?: number;
  /** Only save if content has changed from initial */
  initialContent?: T;
  /** Disable auto-save (still allows manual save) */
  disabled?: boolean;
  /** Called when save succeeds */
  onSuccess?: () => void;
  /** Called when save fails */
  onError?: (error: Error) => void;
  /** Compare function for content equality (default: ===) */
  isEqual?: (a: T, b: T) => boolean;
}

interface AutoSaveState {
  /** Currently saving */
  isSaving: boolean;
  /** Last successful save timestamp */
  lastSaved: Date | null;
  /** Last save error */
  error: Error | null;
  /** Content has unsaved changes */
  isDirty: boolean;
  /** Human-readable status text */
  statusText: string;
}

interface AutoSaveActions {
  /** Save immediately (bypasses debounce) */
  saveNow: () => Promise<void>;
  /** Mark as saved (e.g., after external save) */
  markSaved: () => void;
  /** Clear error state */
  clearError: () => void;
}

export function useAutoSave<T>(options: AutoSaveOptions<T>): AutoSaveState & AutoSaveActions {
  const {
    content,
    onSave,
    delay = 2000,
    initialContent,
    disabled = false,
    onSuccess,
    onError,
    isEqual = (a, b) => a === b,
  } = options;

  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    error: null,
    isDirty: false,
    statusText: '',
  });

  const contentRef = useRef<T>(content);
  const savedContentRef = useRef<T | undefined>(initialContent);
  const mountedRef = useRef(true);

  // Update content ref
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Track dirty state
  useEffect(() => {
    const isDirty =
      savedContentRef.current !== undefined && !isEqual(content, savedContentRef.current);
    setState((prev) => {
      if (prev.isDirty !== isDirty) {
        return { ...prev, isDirty };
      }
      return prev;
    });
  }, [content, isEqual]);

  // Update status text
  useEffect(() => {
    let statusText = '';

    if (state.isSaving) {
      statusText = 'Saving...';
    } else if (state.error) {
      statusText = 'Save failed';
    } else if (state.isDirty) {
      statusText = 'Unsaved changes';
    } else if (state.lastSaved) {
      const timeStr = state.lastSaved.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      });
      statusText = `Saved at ${timeStr}`;
    }

    setState((prev) => {
      if (prev.statusText !== statusText) {
        return { ...prev, statusText };
      }
      return prev;
    });
  }, [state.isSaving, state.error, state.isDirty, state.lastSaved]);

  const performSave = useCallback(async (): Promise<void> => {
    // Don't save if nothing changed
    if (
      savedContentRef.current !== undefined &&
      isEqual(contentRef.current, savedContentRef.current)
    ) {
      return;
    }

    setState((prev) => ({ ...prev, isSaving: true, error: null }));

    try {
      await onSave(contentRef.current);

      if (!mountedRef.current) return;

      savedContentRef.current = contentRef.current;
      const now = new Date();

      setState((prev) => ({
        ...prev,
        isSaving: false,
        lastSaved: now,
        isDirty: false,
        error: null,
      }));

      onSuccess?.();
      logger.info('Auto-save successful');
    } catch (error) {
      if (!mountedRef.current) return;

      const err = error instanceof Error ? error : new Error('Save failed');
      setState((prev) => ({
        ...prev,
        isSaving: false,
        error: err,
      }));

      onError?.(err);
      logger.error('Auto-save failed', error);
    }
  }, [onSave, onSuccess, onError, isEqual]);

  // Debounced save
  const [debouncedSave, cancelSave] = useDebouncedCallback(performSave, delay);

  // Auto-save on content change
  useEffect(() => {
    if (disabled) return;

    // Don't save if content matches saved content
    if (savedContentRef.current !== undefined && isEqual(content, savedContentRef.current)) {
      return;
    }

    debouncedSave();

    return () => {
      cancelSave();
    };
  }, [content, disabled, debouncedSave, cancelSave, isEqual]);

  const saveNow = useCallback(async (): Promise<void> => {
    cancelSave();
    await performSave();
  }, [cancelSave, performSave]);

  const markSaved = useCallback(() => {
    savedContentRef.current = contentRef.current;
    setState((prev) => ({
      ...prev,
      isDirty: false,
      lastSaved: new Date(),
    }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Save on unmount if dirty (best effort)
  useEffect(() => {
    return () => {
      if (state.isDirty && !disabled) {
        // Fire and forget - component is unmounting
        void performSave();
      }
    };
  }, [state.isDirty, disabled, performSave]);

  return {
    ...state,
    saveNow,
    markSaved,
    clearError,
  };
}

/**
 * Simplified auto-save for string content
 */
export function useAutoSaveText(options: {
  text: string;
  onSave: (text: string) => Promise<void>;
  delay?: number;
  disabled?: boolean;
}): AutoSaveState & AutoSaveActions {
  return useAutoSave<string>({
    content: options.text,
    onSave: options.onSave,
    delay: options.delay,
    disabled: options.disabled,
    isEqual: (a, b) => a === b,
  });
}
