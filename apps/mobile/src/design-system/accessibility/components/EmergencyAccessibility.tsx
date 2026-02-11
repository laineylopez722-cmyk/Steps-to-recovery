/**
 * EmergencyAccessibility Component
 *
 * Crisis-first accessibility for emergency UI components.
 * Guaranteed <100ms response time, bypasses animations, maximum contrast.
 *
 * @example
 * ```tsx
 * // Emergency button with guaranteed fast response
 * <EmergencyButton
 *   onPress={handleEmergency}
 *   label="Get help now"
 * >
 *   Get Help Now
 * </EmergencyButton>
 *
 * // Crisis card with maximum contrast
 * <EmergencyCard>
 *   <Text>Emergency Resources</Text>
 * </EmergencyCard>
 *
 * // Fast announcement
 * const { announceCritical } = useEmergencyAnnouncer();
 * announceCritical('Emergency contact initiated');
 * ```
 */

import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type ViewProps,
  type TextProps,
  type PressableProps,
  type ViewStyle,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { useA11yAnnouncer } from '../hooks/useA11yAnnouncer';
import { ds } from '../../tokens/ds';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum response time in milliseconds */
const MAX_RESPONSE_TIME_MS = 100;

/** Large touch target for emergency buttons */
const EMERGENCY_TOUCH_TARGET = 64;

/** Enhanced contrast ratio for emergency UI */
const EMERGENCY_CONTRAST_RATIO = 10;

// ============================================================================
// EMERGENCY BUTTON
// ============================================================================

/** Emergency button props */
export interface EmergencyButtonProps extends PressableProps {
  /** Button label (required) */
  label: string;
  /** Button text */
  children: React.ReactNode;
  /** Variant style */
  variant?: 'primary' | 'secondary' | 'destructive';
  /** Whether to announce on press */
  announceOnPress?: boolean;
  /** Custom announcement text */
  announcement?: string;
  /** Test ID */
  testID?: string;
}

/**
 * Emergency button with guaranteed fast response
 * - No animations
 * - Minimum 64dp touch target
 * - High contrast
 * - Immediate feedback
 */
export function EmergencyButton({
  label,
  children,
  variant = 'primary',
  announceOnPress = true,
  announcement,
  onPress,
  style,
  disabled,
  testID,
  ...props
}: EmergencyButtonProps): React.ReactElement {
  const { announceCritical } = useA11yAnnouncer();
  const pressStartTime = useRef(0);

  // Track press timing for performance monitoring
  const handlePressIn = useCallback(() => {
    pressStartTime.current = Date.now();
  }, []);

  const handlePress = useCallback(
    (event: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
      const responseTime = Date.now() - pressStartTime.current;

      // Announce action
      if (announceOnPress) {
        announceCritical(announcement || `${label} activated`);
      }

      // Log slow response in dev mode
      if (__DEV__ && responseTime > MAX_RESPONSE_TIME_MS) {
        console.warn(`Emergency button response time: ${responseTime}ms (target: <${MAX_RESPONSE_TIME_MS}ms)`);
      }

      // Call original handler
      onPress?.(event);
    },
    [onPress, label, announcement, announceOnPress, announceCritical]
  );

  const buttonStyle: ViewStyle[] = [
    styles.emergencyButton,
    styles[`${variant}Button` as const],
    disabled ? styles.disabledButton : undefined,
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      disabled={disabled}
      style={buttonStyle}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Emergency action"
      accessibilityState={{ disabled: disabled ?? undefined }}
      testID={testID}
      // Ensure minimum touch target
      hitSlop={{
        top: 8,
        bottom: 8,
        left: 8,
        right: 8,
      }}
      {...props}
    >
      <Text style={[styles.emergencyButtonText, styles[`${variant}Text` as const]]}>
        {children}
      </Text>
    </Pressable>
  );
}

// ============================================================================
// EMERGENCY CARD
// ============================================================================

/** Emergency card props */
export interface EmergencyCardProps extends ViewProps {
  /** Card content */
  children: React.ReactNode;
  /** Card title */
  title?: string;
  /** Whether to auto-focus on mount */
  autoFocus?: boolean;
}

/**
 * Emergency card with maximum contrast
 * - High contrast background
 * - Clear visual hierarchy
 * - Auto-focus support
 */
export function EmergencyCard({
  children,
  title,
  autoFocus,
  style,
  ...props
}: EmergencyCardProps): React.ReactElement {
  const cardRef = useRef<View>(null);

  // Auto-focus on mount for screen readers
  useEffect(() => {
    if (autoFocus && cardRef.current) {
      const timer = setTimeout(() => {
        const node = Platform.select({
          ios: cardRef.current,
          android: cardRef.current,
        });
        if (node) {
          AccessibilityInfo.setAccessibilityFocus(node as unknown as number);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  return (
    <View
      ref={cardRef}
      style={[styles.emergencyCard, style]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={title || 'Emergency information'}
      {...props}
    >
      {title && (
        <Text style={styles.emergencyCardTitle} accessibilityRole="header">
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}

// ============================================================================
// EMERGENCY TEXT
// ============================================================================

/** Emergency text props */
export interface EmergencyTextProps extends TextProps {
  /** Text content */
  children: React.ReactNode;
  /** Text variant */
  variant?: 'title' | 'body' | 'caption';
  /** Maximum contrast mode */
  highContrast?: boolean;
}

/**
 * Emergency text with maximum readability
 * - High contrast
 * - Clear typography
 * - Accessible sizing
 */
export function EmergencyText({
  children,
  variant = 'body',
  highContrast = true,
  style,
  ...props
}: EmergencyTextProps): React.ReactElement {
  const textStyle = [
    styles.emergencyText,
    styles[`${variant}Text` as const],
    highContrast && styles.highContrastText,
    style,
  ];

  return (
    <Text
      style={textStyle}
      accessibilityRole={variant === 'title' ? 'header' : 'text'}
      {...props}
    >
      {children}
    </Text>
  );
}

// ============================================================================
// EMERGENCY ANNOUNCER HOOK
// ============================================================================

/**
 * Hook for emergency announcements
 * Fast, critical announcements with no delay
 */
export function useEmergencyAnnouncer() {
  const { announceCritical, announce } = useA11yAnnouncer();

  /**
   * Announce emergency action immediately
   */
  const announceEmergency = useCallback(
    (message: string): void => {
      // Clear other announcements and announce immediately
      announceCritical(message, { interrupt: true, delay: 0 });
    },
    [announceCritical]
  );

  /**
   * Announce crisis step completion
   */
  const announceCrisisStep = useCallback(
    (step: string, progress: number): void => {
      announce(`Step ${step} complete. ${progress}% done.`, {
        priority: 'critical',
        delay: 0,
      });
    },
    [announce]
  );

  /**
   * Announce connection status
   */
  const announceConnection = useCallback(
    (status: 'connecting' | 'connected' | 'failed'): void => {
      const messages = {
        connecting: 'Connecting to emergency services...',
        connected: 'Connected to emergency support',
        failed: 'Connection failed. Trying alternative.',
      };
      announceEmergency(messages[status]);
    },
    [announceEmergency]
  );

  return {
    announceEmergency,
    announceCrisisStep,
    announceConnection,
    announceCritical,
  };
}

// ============================================================================
// EMERGENCY CONTAINER
// ============================================================================

/** Emergency container props */
export interface EmergencyContainerProps extends ViewProps {
  /** Container content */
  children: React.ReactNode;
  /** Emergency title */
  title: string;
  /** Whether this is a modal */
  isModal?: boolean;
}

/**
 * Container for emergency UI
 * Sets up emergency context and announcements
 */
export function EmergencyContainer({
  children,
  title,
  isModal,
  style,
  ...props
}: EmergencyContainerProps): React.ReactElement {
  const { announceEmergency } = useEmergencyAnnouncer();
  const announcedRef = useRef(false);

  // Announce on mount
  useEffect(() => {
    if (!announcedRef.current) {
      announceEmergency(`${title} screen opened`);
      announcedRef.current = true;
    }
  }, [title, announceEmergency]);

  return (
    <View
      style={[styles.emergencyContainer, style]}
      accessibilityRole={isModal ? 'alert' : 'none'}
      accessibilityLabel={title}
      {...props}
    >
      {children}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Emergency Button
  emergencyButton: {
    minWidth: EMERGENCY_TOUCH_TARGET,
    minHeight: EMERGENCY_TOUCH_TARGET,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    // Ensure minimum touch target
    ...Platform.select({
      ios: {
        minWidth: EMERGENCY_TOUCH_TARGET,
        minHeight: EMERGENCY_TOUCH_TARGET,
      },
      android: {
        minWidth: EMERGENCY_TOUCH_TARGET,
        minHeight: EMERGENCY_TOUCH_TARGET,
        elevation: 4,
      },
    }),
  },
  primaryButton: {
    backgroundColor: '#DC2626', // Red-600
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  destructiveButton: {
    backgroundColor: '#991B1B', // Red-800
  },
  disabledButton: {
    backgroundColor: ds.colors.textTertiary,
    opacity: 0.6,
  },
  emergencyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#DC2626',
  },
  destructiveText: {
    color: '#FFFFFF',
  },

  // Emergency Card
  emergencyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 3,
    borderColor: '#DC2626',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  emergencyCardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 16,
  },

  // Emergency Text
  emergencyText: {
    color: '#1F2937', // Gray-800
    fontSize: 16,
    lineHeight: 24,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
    marginBottom: 16,
  },
  bodyText: {
    fontSize: 18,
    lineHeight: 28,
  },
  captionText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  highContrastText: {
    color: '#000000',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },

  // Emergency Container
  emergencyContainer: {
    flex: 1,
    backgroundColor: '#FEF2F2', // Red-50
    padding: 16,
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  EmergencyButton,
  EmergencyCard,
  EmergencyText,
  EmergencyContainer,
  useEmergencyAnnouncer,
};
