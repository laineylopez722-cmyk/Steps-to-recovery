import React, { useState, useCallback, type ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface ScreenErrorBoundaryProps {
  children: ReactNode;
  /** Screen name used for logging context */
  screenName: string;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
}

/**
 * ScreenErrorBoundary — a per-screen error boundary wrapper.
 *
 * Wraps individual screens so that a crash in one screen does not
 * tear down the entire app. The `screenName` is forwarded to
 * Sentry / logger for triage.
 *
 * @example
 * ```tsx
 * <ScreenErrorBoundary screenName="JournalDetail">
 *   <JournalDetailScreen />
 * </ScreenErrorBoundary>
 * ```
 */
export function ScreenErrorBoundary({
  children,
  screenName,
  fallback,
}: ScreenErrorBoundaryProps): React.ReactElement {
  const [resetKey, setResetKey] = useState(0);

  const handleReset = useCallback((): void => {
    setResetKey((k) => k + 1);
  }, []);

  return (
    <ErrorBoundary
      key={resetKey}
      onReset={handleReset}
      boundary={screenName}
      fallback={fallback}
    >
      {children}
    </ErrorBoundary>
  );
}
