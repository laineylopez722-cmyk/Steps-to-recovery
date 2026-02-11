/**
 * AccessibilityErrorBoundary Component
 *
 * Error boundary for animation components with graceful degradation.
 * Falls back to static/no-animation state if Reanimated fails.
 *
 * @example
 * ```tsx
 * <AccessibilityErrorBoundary fallback={<StaticButton />}>
 *   <AnimatedButton />
 * </AccessibilityErrorBoundary>
 *
 * // With custom fallback
 * <AccessibilityErrorBoundary
 *   fallback={<Text>Button (animations disabled)</Text>}
 *   onError={(error) => logError(error)}
 * >
 *   <CelebrationAnimation />
 * </AccessibilityErrorBoundary>
 * ```
 */

import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useA11yAnnouncer } from '../../accessibility/hooks/useA11yAnnouncer';

// ============================================================================
// TYPES
// ============================================================================

/** Error boundary props */
interface AccessibilityErrorBoundaryProps {
  /** Children to render */
  children: ReactNode;
  /** Fallback UI when error occurs */
  fallback?: ReactNode;
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to announce errors to screen reader */
  announceErrors?: boolean;
  /** Test ID for testing */
  testID?: string;
}

/** Error boundary state */
interface AccessibilityErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error that occurred */
  error: Error | null;
}

// ============================================================================
// STATIC FALLBACK COMPONENT
// ============================================================================

/**
 * Default fallback UI when animations fail
 */
function DefaultFallback({ children }: { children?: ReactNode }): React.ReactElement {
  return (
    <View style={styles.fallbackContainer}>
      {children || (
        <Text style={styles.fallbackText} accessibilityRole="text">
          Content available without animations
        </Text>
      )}
    </View>
  );
}

// ============================================================================
// ERROR BOUNDARY CLASS
// ============================================================================

/**
 * Error boundary that catches Reanimated/render errors
 * and falls back to static content
 */
export class AccessibilityErrorBoundary extends Component<
  AccessibilityErrorBoundaryProps,
  AccessibilityErrorBoundaryState
> {
  constructor(props: AccessibilityErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AccessibilityErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, announceErrors } = this.props;

    // Log error
    if (__DEV__) {
      console.warn('AccessibilityErrorBoundary caught error:', error);
      console.warn('Component stack:', errorInfo.componentStack);
    }

    // Call error handler
    onError?.(error, errorInfo);

    // Announce to screen reader if enabled
    if (announceErrors) {
      // Use setTimeout to avoid state updates during render
      setTimeout(() => {
        const { AccessibilityInfo } = require('react-native');
        AccessibilityInfo.announceForAccessibility(
          'Animations disabled due to an error. Content is still accessible.',
        );
      }, 0);
    }
  }

  render(): ReactNode {
    const { hasError } = this.state;
    const { children, fallback, testID } = this.props;

    if (hasError) {
      return (
        <View testID={testID} accessibilityRole="alert">
          {fallback || <DefaultFallback />}
        </View>
      );
    }

    return children;
  }
}

// ============================================================================
// HOOK-BASED ERROR HANDLING
// ============================================================================

/**
 * Hook to handle animation errors gracefully
 * @returns Error state and reset function
 */
export function useAnimationError(): {
  hasError: boolean;
  error: Error | null;
  resetError: () => void;
  handleError: (error: Error) => void;
} {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((err: Error) => {
    setError(err);

    if (__DEV__) {
      console.warn('Animation error caught:', err);
    }
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    hasError: error !== null,
    error,
    resetError,
    handleError,
  };
}

// ============================================================================
// SAFE ANIMATION WRAPPER
// ============================================================================

export interface SafeAnimationProps {
  children: ReactNode;
  /** Animation component to render */
  animation: ReactNode;
  /** Static fallback */
  staticFallback: ReactNode;
  /** Whether to disable animations */
  disableAnimation?: boolean;
}

/**
 * Wrapper that safely renders animations with fallback
 */
export function SafeAnimation({
  animation,
  staticFallback,
  disableAnimation = false,
}: SafeAnimationProps): React.ReactElement {
  // If animations are disabled, show static fallback
  if (disableAnimation) {
    return <>{staticFallback}</>;
  }

  // Otherwise wrap in error boundary
  return (
    <AccessibilityErrorBoundary fallback={staticFallback} announceErrors>
      {animation}
    </AccessibilityErrorBoundary>
  );
}

// ============================================================================
// ANIMATION DISABLED BANNER
// ============================================================================

/**
 * Banner shown when animations are disabled
 */
export function AnimationDisabledBanner(): React.ReactElement {
  return (
    <View
      style={styles.banner}
      accessibilityRole="alert"
      accessibilityLabel="Animations disabled for accessibility"
    >
      <Text style={styles.bannerText}>Animations disabled</Text>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  fallbackContainer: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  fallbackText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  banner: {
    backgroundColor: '#FFF3CD',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  bannerText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export default AccessibilityErrorBoundary;
