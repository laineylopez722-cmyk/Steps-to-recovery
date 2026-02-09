import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeContext } from '../design-system/context/ThemeContext';
import { logger } from '../utils/logger';
import { captureException } from '../lib/sentry';
import { ds } from '../design-system/tokens/ds';

interface Props {
  children: ReactNode;
  onReset?: () => void;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary - React Class Component for catching JavaScript errors
 *
 * Features:
 * - Catches errors in child component tree
 * - Displays user-friendly error UI
 * - Logs errors to Sentry
 * - Allows app reset/recovery
 * - Shows error details in development
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary onReset={() => setResetKey(k => k + 1)}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console/logger
    logger.error('ErrorBoundary caught error', { error, errorInfo });

    // Log to Sentry
    captureException(error, {
      componentStack: errorInfo.componentStack,
    });

    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * ErrorFallback - Default error UI component
 */
interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
}

const FALLBACK_COLORS = {
  background: ds.colors.bgPrimary,
  danger: ds.semantic.intent.alert.solid,
  primary: ds.colors.info,
  text: ds.semantic.text.onDark,
  textSecondary: ds.colors.textTertiary,
} as const;

function ErrorFallback({ error, errorInfo, onReset }: ErrorFallbackProps): React.ReactElement {
  // Error fallback must work even when upstream providers fail to mount.
  const theme = React.useContext(ThemeContext);
  const colors = theme?.colors ?? FALLBACK_COLORS;
  const [showDetails, setShowDetails] = React.useState(false);

  const isDev = __DEV__;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Error Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${colors.danger}20` }]}>
          <MaterialIcons name="error-outline" size={64} color={colors.danger} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>Something went wrong</Text>

        {/* Description */}
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          We apologize for the inconvenience. The app encountered an unexpected error.
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={onReset}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <MaterialIcons name="refresh" size={20} color={ds.semantic.text.onDark} />
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>

        {/* Error Details Toggle (Dev Only) */}
        {isDev && (
          <TouchableOpacity
            style={styles.detailsToggle}
            onPress={() => setShowDetails(!showDetails)}
            accessibilityRole="button"
            accessibilityLabel={showDetails ? 'Hide error details' : 'Show error details'}
          >
            <Text style={[styles.detailsToggleText, { color: colors.primary }]}>
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Text>
            <MaterialIcons
              name={showDetails ? 'expand-less' : 'expand-more'}
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        )}

        {/* Error Details (Dev Only) */}
        {isDev && showDetails && (
          <ScrollView style={styles.detailsContainer}>
            <Text style={[styles.detailsTitle, { color: colors.danger }]}>Error:</Text>
            <Text style={[styles.detailsText, { color: colors.text }]}>{error?.toString()}</Text>

            <Text style={[styles.detailsTitle, { color: colors.danger, marginTop: 16 }]}>
              Component Stack:
            </Text>
            <Text style={[styles.detailsText, { color: colors.text }]}>
              {errorInfo?.componentStack}
            </Text>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    gap: 8,
    minWidth: 160,
    justifyContent: 'center',
  },
  buttonText: {
    color: ds.semantic.text.onDark,
    fontSize: 16,
    fontWeight: '600',
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    padding: 8,
  },
  detailsToggleText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  detailsContainer: {
    width: '100%',
    maxHeight: 300,
    marginTop: 16,
    padding: 16,
    backgroundColor: ds.colors.bgSecondary,
    borderRadius: 12,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});

/**
 * Hook to use ErrorBoundary reset functionality
 * Useful for programmatic error recovery
 */
export function useErrorBoundary() {
  const [resetKey, setResetKey] = React.useState(0);

  const reset = React.useCallback(() => {
    setResetKey((k) => k + 1);
  }, []);

  return { resetKey, reset };
}
