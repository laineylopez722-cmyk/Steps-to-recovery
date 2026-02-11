import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeContext } from '../design-system/context/ThemeContext';
import { logger } from '../utils/logger';
import { captureException } from '../lib/sentry';
import { ds } from '../design-system/tokens/ds';

// ============================================================================
// Types
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
  fallback?: ReactNode;
  /** Boundary label for distinguishing multiple boundaries in logs */
  boundary?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
  boundary?: string;
}

interface ErrorMessage {
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

// ============================================================================
// Constants
// ============================================================================

const CRISIS_PHONE = '1-800-662-4357';
const CRISIS_TEXT_LINE = '741741';

interface FallbackColors {
  background: string;
  danger: string;
  primary: string;
  text: string;
  textSecondary: string;
  accent: string;
  emergency: string;
  emergencyMuted: string;
}

const FALLBACK_COLORS: FallbackColors = {
  background: ds.colors.bgPrimary,
  danger: ds.semantic.intent.alert.solid,
  primary: ds.colors.info,
  text: ds.semantic.text.onDark,
  textSecondary: ds.colors.textTertiary,
  accent: ds.colors.accent,
  emergency: ds.semantic.emergency.calm,
  emergencyMuted: ds.semantic.emergency.calmMuted,
};

// ============================================================================
// Error Classification
// ============================================================================

/**
 * Determines user-friendly messaging based on the error type.
 * Avoids exposing technical details to users who may be in a vulnerable state.
 */
function getErrorMessage(error: Error | null): ErrorMessage {
  if (!error) {
    return {
      title: 'Something unexpected happened',
      description:
        'The app ran into a small hiccup. Your data is safe — let\u2019s get you back on track.',
      icon: 'refresh',
    };
  }

  const msg = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // Network / connectivity errors
  if (
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('timeout') ||
    name === 'networkerror'
  ) {
    return {
      title: 'Connection issue',
      description:
        'It looks like the connection dropped. Your entries are safely stored on your device. Try again when you\u2019re ready.',
      icon: 'wifi-off',
    };
  }

  // Database / storage errors
  if (
    msg.includes('database') ||
    msg.includes('sqlite') ||
    msg.includes('storage') ||
    msg.includes('indexeddb')
  ) {
    return {
      title: 'Storage issue',
      description:
        'There was a problem accessing your local data. Restarting usually fixes this. Your data is still safe.',
      icon: 'storage',
    };
  }

  // Encryption / security errors
  if (
    msg.includes('encrypt') ||
    msg.includes('decrypt') ||
    msg.includes('key') ||
    msg.includes('crypto')
  ) {
    return {
      title: 'Security check needed',
      description:
        'The app needs to verify your security settings. Please try again — if this keeps happening, signing out and back in should help.',
      icon: 'lock-outline',
    };
  }

  // Auth errors
  if (
    msg.includes('auth') ||
    msg.includes('session') ||
    msg.includes('token') ||
    msg.includes('login') ||
    msg.includes('unauthorized')
  ) {
    return {
      title: 'Session expired',
      description:
        'Your session may have timed out. Let\u2019s get you signed back in safely.',
      icon: 'person-outline',
    };
  }

  // Rendering / component errors (generic React errors)
  return {
    title: 'Something unexpected happened',
    description:
      'The app ran into a small hiccup. Your data is safe — let\u2019s get you back on track.',
    icon: 'refresh',
  };
}

// ============================================================================
// ErrorBoundary Class Component
// ============================================================================

/**
 * ErrorBoundary — catches JavaScript errors anywhere in the child component tree.
 *
 * Features:
 * - Recovery-themed, non-scary fallback UI
 * - Contextual messages for different error types
 * - Emergency contact info (SAMHSA helpline & Crisis Text Line)
 * - Sentry reporting with sanitised context
 * - Dev-mode error details
 * - Reset / retry mechanism
 *
 * @example
 * ```tsx
 * <ErrorBoundary onReset={() => setResetKey(k => k + 1)}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const label = this.props.boundary ?? 'root';

    logger.error(`ErrorBoundary [${label}] caught error`, { error, errorInfo });

    captureException(error, {
      boundary: label,
      componentStack: errorInfo.componentStack,
    });

    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          boundary={this.props.boundary}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Error Fallback UI
// ============================================================================

function ErrorFallback({
  error,
  errorInfo,
  onReset,
}: ErrorFallbackProps): React.ReactElement {
  const theme = React.useContext(ThemeContext);
  const [showDetails, setShowDetails] = React.useState(false);

  // Extract a flat color map regardless of whether the theme is available.
  // ThemeContext.colors is a ColorPalette with nested semantic keys;
  // FALLBACK_COLORS is our flat fallback used when themes have not mounted.
  const colors: FallbackColors = theme
    ? {
        background: theme.colors.background,
        danger: theme.colors.danger,
        primary: theme.colors.primary,
        text: theme.colors.text,
        textSecondary: theme.colors.textSecondary,
        accent: theme.colors.primary,
        emergency: theme.colors.semantic.emergency.calm,
        emergencyMuted: theme.colors.semantic.emergency.calmMuted,
      }
    : FALLBACK_COLORS;

  const isDev = __DEV__;
  const { title, description, icon } = getErrorMessage(error);

  const handleCallCrisisLine = (): void => {
    Linking.openURL(`tel:${CRISIS_PHONE}`).catch(() => {
      // Silently fail — phone dialer may not be available
    });
  };

  const handleTextCrisisLine = (): void => {
    Linking.openURL(`sms:${CRISIS_TEXT_LINE}?body=HOME`).catch(() => {
      // Silently fail — SMS may not be available
    });
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      accessibilityRole="alert"
      accessibilityLabel={`Error: ${title}. ${description}`}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: colors.emergencyMuted }]}>
            <MaterialIcons name={icon} size={56} color={colors.accent} />
          </View>

          {/* Title */}
          <Text
            style={[styles.title, { color: colors.text }]}
            accessibilityRole="header"
          >
            {title}
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {description}
          </Text>

          {/* Try Again Button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.accent }]}
            onPress={onReset}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            accessibilityHint="Resets the current error and reloads the screen"
            activeOpacity={0.8}
          >
            <MaterialIcons name="refresh" size={20} color={ds.palette.black} />
            <Text style={[styles.buttonText, { color: ds.palette.black }]}>Try Again</Text>
          </TouchableOpacity>

          {/* Emergency Contact Section */}
          <View style={[styles.emergencyCard, { backgroundColor: colors.emergencyMuted }]}>
            <Text style={[styles.emergencyTitle, { color: colors.emergency }]}>
              Need to talk to someone?
            </Text>
            <Text style={[styles.emergencyBody, { color: colors.textSecondary }]}>
              You are not alone. Reach out any time, 24/7.
            </Text>

            <TouchableOpacity
              style={styles.emergencyLink}
              onPress={handleCallCrisisLine}
              accessibilityRole="button"
              accessibilityLabel={`Call SAMHSA helpline at ${CRISIS_PHONE}`}
              accessibilityHint="Opens your phone dialer to call the helpline"
            >
              <MaterialIcons name="phone" size={18} color={colors.emergency} />
              <Text style={[styles.emergencyLinkText, { color: colors.emergency }]}>
                SAMHSA Helpline: {CRISIS_PHONE}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.emergencyLink}
              onPress={handleTextCrisisLine}
              accessibilityRole="button"
              accessibilityLabel={`Text HOME to ${CRISIS_TEXT_LINE} for the Crisis Text Line`}
              accessibilityHint="Opens your messaging app to text the crisis line"
            >
              <MaterialIcons name="chat" size={18} color={colors.emergency} />
              <Text style={[styles.emergencyLinkText, { color: colors.emergency }]}>
                Crisis Text Line: text HOME to {CRISIS_TEXT_LINE}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Dev-Only Error Details */}
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

          {isDev && showDetails && (
            <View style={styles.detailsContainer}>
              <Text style={[styles.detailsTitle, { color: colors.danger }]}>Error:</Text>
              <Text style={[styles.detailsText, { color: colors.text }]}>
                {error?.toString()}
              </Text>

              {errorInfo?.componentStack ? (
                <>
                  <Text
                    style={[styles.detailsTitle, { color: colors.danger, marginTop: 16 }]}
                  >
                    Component Stack:
                  </Text>
                  <Text style={[styles.detailsText, { color: colors.text }]}>
                    {errorInfo.componentStack}
                  </Text>
                </>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ds.space[6],
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 112,
    height: 112,
    borderRadius: ds.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ds.space[6],
  },
  title: {
    ...ds.typography.h2,
    textAlign: 'center',
    marginBottom: ds.space[3],
  },
  description: {
    ...ds.typography.body,
    textAlign: 'center',
    marginBottom: ds.space[8],
    paddingHorizontal: ds.space[4],
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: ds.space[8],
    borderRadius: ds.radius.md,
    gap: ds.space[2],
    minWidth: 180,
    minHeight: ds.sizes.touchMin,
  },
  buttonText: {
    ...ds.typography.body,
    fontWeight: ds.fontWeight.semibold,
  },
  emergencyCard: {
    width: '100%',
    marginTop: ds.space[10],
    padding: ds.space[5],
    borderRadius: ds.radius.lg,
    alignItems: 'center',
  },
  emergencyTitle: {
    ...ds.typography.bodySm,
    fontWeight: ds.fontWeight.semibold,
    marginBottom: ds.space[1],
  },
  emergencyBody: {
    ...ds.typography.caption,
    textAlign: 'center',
    marginBottom: ds.space[4],
  },
  emergencyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[2],
    paddingVertical: ds.space[2],
    minHeight: ds.sizes.touchMin,
  },
  emergencyLinkText: {
    ...ds.typography.bodySm,
    fontWeight: ds.fontWeight.medium,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: ds.space[8],
    padding: ds.space[2],
    minHeight: ds.sizes.touchMin,
  },
  detailsToggleText: {
    ...ds.typography.caption,
    fontWeight: ds.fontWeight.semibold,
    marginRight: ds.space[1],
  },
  detailsContainer: {
    width: '100%',
    maxHeight: 260,
    marginTop: ds.space[4],
    padding: ds.space[4],
    backgroundColor: ds.colors.bgSecondary,
    borderRadius: ds.radius.md,
  },
  detailsTitle: {
    ...ds.typography.caption,
    fontWeight: ds.fontWeight.bold,
    marginBottom: ds.space[2],
  },
  detailsText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to manage ErrorBoundary reset key.
 * Increment the key to force a full remount and clear the error.
 */
export function useErrorBoundary(): { resetKey: number; reset: () => void } {
  const [resetKey, setResetKey] = React.useState(0);

  const reset = React.useCallback(() => {
    setResetKey((k) => k + 1);
  }, []);

  return { resetKey, reset };
}
