/**
 * Biometric Lock Screen
 *
 * Full-screen overlay displayed when the app is locked.
 * Shows app logo, biometric auth button, PIN fallback, and emergency bypass.
 *
 * @module components/BiometricLockScreen
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemedStyles, type DS } from '../design-system/hooks/useThemedStyles';
import { useDs } from '../design-system/DsProvider';
import { darkAccent, gradients, spacing, typography } from '../design-system/tokens/modern';
import { Text } from '../design-system/components/Text';
import { usePinEntry } from '../hooks/usePinEntry';
import { logger } from '../utils/logger';
import type { BiometricType } from '../hooks/useBiometricLock';

interface BiometricLockScreenProps {
  onAuthenticate: () => Promise<boolean>;
  onPinValidate: (pin: string) => Promise<boolean>;
  onEmergencyAccess: () => void;
  biometricType: BiometricType;
  hasPinSet: boolean;
}

export function BiometricLockScreen({
  onAuthenticate,
  onPinValidate,
  onEmergencyAccess,
  biometricType,
  hasPinSet,
}: BiometricLockScreenProps): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const pulse = useSharedValue(1);
  const fadeIn = useSharedValue(0);

  const {
    pin,
    error: pinError,
    isValidating,
    handleDigit,
    handleBackspace,
    clear: clearPin,
  } = usePinEntry({
    onSuccess: () => {
      logger.info('PIN unlock successful');
    },
    onFailure: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    },
    validator: onPinValidate,
    requiredLength: 4,
  });

  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 400 });
    pulse.value = withRepeat(withTiming(1.15, { duration: 1200 }), -1, true);
  }, [fadeIn, pulse]);

  // Auto-trigger biometric on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      handleBiometricAuth();
    }, 500);
    return () => clearTimeout(timer);
    // Intentionally run only on mount
  }, []);

  const handleBiometricAuth = useCallback(async (): Promise<void> => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    try {
      await onAuthenticate();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Lock screen auth error', { error: message });
    } finally {
      setIsAuthenticating(false);
    }
  }, [isAuthenticating, onAuthenticate]);

  const handleEmergency = useCallback((): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    onEmergencyAccess();
  }, [onEmergencyAccess]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.15], [0.6, 0.2]),
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
  }));

  const biometricIcon = biometricType === 'Face ID' ? 'face' : 'fingerprint';

  if (showPinEntry) {
    return (
      <View style={styles.fullScreen}>
        <LinearGradient
          colors={[darkAccent.background, ds.colors.bgTertiary]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.pinContainer}>
            <Text style={styles.pinTitle} accessibilityRole="header">
              Enter PIN
            </Text>
            <Text style={styles.pinSubtitle}>Enter your 4-digit PIN to unlock</Text>

            {/* PIN Dots */}
            <View
              style={styles.pinDots}
              accessibilityLabel={`PIN entry, ${pin.length} of 4 digits entered`}
              accessibilityRole="text"
            >
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={[styles.pinDot, i < pin.length && styles.pinDotFilled]} />
              ))}
            </View>

            {pinError ? (
              <Text style={styles.pinError} accessibilityRole="alert">
                {pinError}
              </Text>
            ) : null}

            {/* Number Pad */}
            <View style={styles.numPad}>
              {[
                ['1', '2', '3'],
                ['4', '5', '6'],
                ['7', '8', '9'],
                ['', '0', 'delete'],
              ].map((row, rowIndex) => (
                <View key={rowIndex} style={styles.numPadRow}>
                  {row.map((digit) => {
                    if (digit === '') {
                      return <View key="empty" style={styles.numPadButton} />;
                    }
                    if (digit === 'delete') {
                      return (
                        <Pressable
                          key="delete"
                          style={styles.numPadButton}
                          onPress={handleBackspace}
                          accessibilityLabel="Delete last digit"
                          accessibilityRole="button"
                        >
                          <MaterialIcons
                            name="backspace"
                            size={24}
                            color={ds.semantic.text.secondary}
                          />
                        </Pressable>
                      );
                    }
                    return (
                      <Pressable
                        key={digit}
                        style={({ pressed }) => [
                          styles.numPadButton,
                          pressed && styles.numPadButtonPressed,
                        ]}
                        onPress={() => handleDigit(digit)}
                        disabled={isValidating}
                        accessibilityLabel={`Digit ${digit}`}
                        accessibilityRole="button"
                      >
                        <Text style={styles.numPadDigit}>{digit}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Back to biometric */}
            <Pressable
              onPress={() => {
                clearPin();
                setShowPinEntry(false);
              }}
              style={styles.switchMethod}
              accessibilityLabel={`Use ${biometricType} instead`}
              accessibilityRole="button"
            >
              <Text style={styles.switchMethodText}>Use {biometricType}</Text>
            </Pressable>
          </View>

          {/* Emergency access */}
          <Pressable
            onPress={handleEmergency}
            style={styles.emergencyButton}
            accessibilityLabel="Emergency access to crisis resources"
            accessibilityRole="button"
            accessibilityHint="Bypasses lock to access emergency helplines and safety plan"
          >
            <MaterialIcons name="emergency" size={16} color={ds.semantic.intent.alert.solid} />
            <Text style={styles.emergencyText}>Emergency</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.fullScreen}>
      <LinearGradient
        colors={[darkAccent.background, ds.colors.bgTertiary]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.mainContent, containerStyle]}>
          {/* App Icon */}
          <View style={styles.iconArea}>
            <Animated.View style={[styles.pulseRing, pulseStyle]} />
            <LinearGradient colors={gradients.primary} style={styles.appIconGradient}>
              <MaterialIcons name="self-improvement" size={48} color={ds.semantic.text.onDark} />
            </LinearGradient>
          </View>

          <Text style={styles.appName} accessibilityRole="header">
            Steps to Recovery
          </Text>
          <Text style={styles.lockMessage}>Tap to unlock</Text>

          {/* Biometric Button */}
          <Pressable
            onPress={handleBiometricAuth}
            style={({ pressed }) => [styles.authButton, pressed && styles.authButtonPressed]}
            disabled={isAuthenticating}
            accessibilityLabel={`Unlock app with ${biometricType}`}
            accessibilityRole="button"
            accessibilityState={{ disabled: isAuthenticating, busy: isAuthenticating }}
            accessibilityHint={`Authenticates using ${biometricType} to unlock the app`}
          >
            <LinearGradient
              colors={isAuthenticating ? gradients.success : gradients.primary}
              style={styles.authButtonGradient}
            >
              <MaterialIcons name={biometricIcon} size={36} color={ds.semantic.text.onDark} />
            </LinearGradient>
          </Pressable>

          <Text style={styles.authHint}>
            {isAuthenticating ? `Scanning ${biometricType}...` : `Secure with ${biometricType}`}
          </Text>

          {/* PIN Fallback */}
          {hasPinSet ? (
            <Pressable
              onPress={() => setShowPinEntry(true)}
              style={styles.pinFallback}
              accessibilityLabel="Enter PIN instead"
              accessibilityRole="button"
              accessibilityHint="Switch to PIN entry to unlock the app"
            >
              <Text style={styles.pinFallbackText}>Enter PIN</Text>
            </Pressable>
          ) : null}
        </Animated.View>

        {/* Emergency access - always visible */}
        <Pressable
          onPress={handleEmergency}
          style={styles.emergencyButton}
          accessibilityLabel="Emergency access to crisis resources"
          accessibilityRole="button"
          accessibilityHint="Bypasses lock to access emergency helplines and safety plan"
        >
          <MaterialIcons name="emergency" size={16} color={ds.semantic.intent.alert.solid} />
          <Text style={styles.emergencyText}>Emergency</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (ds: DS) => ({
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  } as const,
  safeArea: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  mainContent: {
    alignItems: 'center' as const,
    flex: 1,
    justifyContent: 'center' as const,
  },

  // App icon area
  iconArea: {
    width: 120,
    height: 120,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: spacing[4],
  },
  pulseRing: {
    position: 'absolute' as const,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: darkAccent.success,
  },
  appIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  appName: {
    ...typography.h2,
    color: darkAccent.text,
    marginBottom: spacing[1],
  },
  lockMessage: {
    ...typography.body,
    color: darkAccent.textMuted,
    marginBottom: spacing[6],
  },

  // Auth button
  authButton: {
    marginBottom: spacing[3],
  },
  authButtonPressed: {
    opacity: 0.8,
  },
  authButtonGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  authHint: {
    ...typography.bodySmall,
    color: darkAccent.textSubtle,
    marginBottom: spacing[4],
  },

  // PIN fallback
  pinFallback: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    minHeight: 48,
    justifyContent: 'center' as const,
  },
  pinFallbackText: {
    ...typography.body,
    color: ds.semantic.intent.primary.solid,
  },

  // Emergency button
  emergencyButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
    minHeight: 48,
    gap: spacing[1],
  },
  emergencyText: {
    ...typography.bodySmall,
    color: ds.semantic.intent.alert.solid,
  },

  // PIN Entry Screen
  pinContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing[6],
  },
  pinTitle: {
    ...typography.h2,
    color: darkAccent.text,
    marginBottom: spacing[1],
  },
  pinSubtitle: {
    ...typography.body,
    color: darkAccent.textMuted,
    marginBottom: spacing[6],
  },
  pinDots: {
    flexDirection: 'row' as const,
    gap: spacing[4],
    marginBottom: spacing[4],
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: ds.semantic.text.muted,
  },
  pinDotFilled: {
    backgroundColor: ds.semantic.intent.primary.solid,
    borderColor: ds.semantic.intent.primary.solid,
  },
  pinError: {
    ...typography.bodySmall,
    color: ds.semantic.intent.alert.solid,
    marginBottom: spacing[2],
  },

  // Number pad
  numPad: {
    width: '100%' as const,
    maxWidth: 280,
    gap: spacing[2],
  },
  numPadRow: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: spacing[4],
  },
  numPadButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  numPadButtonPressed: {
    backgroundColor: ds.colors.borderStrong,
  },
  numPadDigit: {
    fontSize: 28,
    fontWeight: '300' as const,
    color: darkAccent.text,
  },

  // Switch method
  switchMethod: {
    marginTop: spacing[4],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    minHeight: 48,
    justifyContent: 'center' as const,
  },
  switchMethodText: {
    ...typography.body,
    color: ds.semantic.intent.primary.solid,
  },
});
