/**
 * Security Settings Screen
 *
 * Allows users to configure biometric app lock, PIN fallback,
 * and background lock timeout.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { ScrollView, View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Toggle } from '../../../design-system/components/Toggle';
import { Text } from '../../../design-system/components/Text';
import { Modal } from '../../../design-system';
import { MotionTransitions } from '../../../design-system/tokens/motion';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import { useBiometricLock } from '../../../hooks/useBiometricLock';
import { useQuickEscape } from '../../../hooks/useQuickEscape';
import { usePinEntry } from '../../../hooks/usePinEntry';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { useAuth } from '../../../contexts/AuthContext';
import {
  rotateEncryptionKey,
  shouldRotateKey,
  getKeyMetadata,
} from '../../../services/keyRotationService';
import type { KeyRotationProgress } from '../../../services/keyRotationService';
import { logger } from '../../../utils/logger';

const TIMEOUT_OPTIONS = [
  { label: 'Immediately', value: 0 },
  { label: '1 minute', value: 60 },
  { label: '5 minutes', value: 300 },
] as const;

export function SecuritySettingsScreen(): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const {
    isAvailable,
    settings,
    biometricType,
    hasPinSet,
    enable,
    disable,
    updateSettings,
    setPin,
  } = useBiometricLock();

  const { isEnabled: quickEscapeEnabled, setEnabled: setQuickEscapeEnabled } = useQuickEscape();

  const { db, isReady: dbReady } = useDatabase();
  const { user } = useAuth();

  const [showSetPin, setShowSetPin] = useState(false);
  const [showTimeoutPicker, setShowTimeoutPicker] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');
  const [pinError, setPinError] = useState('');

  // Key rotation state
  const [keyAgeDays, setKeyAgeDays] = useState<number | null>(null);
  const [keyCreatedAt, setKeyCreatedAt] = useState<string>('');
  const [showRotateConfirm, setShowRotateConfirm] = useState(false);
  const [rotationProgress, setRotationProgress] = useState<KeyRotationProgress | null>(null);
  const [rotationSuggested, setRotationSuggested] = useState(false);

  // Load key metadata on mount
  useEffect(() => {
    const loadKeyInfo = async (): Promise<void> => {
      try {
        const metadata = await getKeyMetadata();
        if (metadata) {
          setKeyAgeDays(metadata.ageDays);
          setKeyCreatedAt(metadata.createdAt);
        }
        const needsRotation = await shouldRotateKey();
        setRotationSuggested(needsRotation);
      } catch {
        // Non-critical
      }
    };
    loadKeyInfo();
  }, []);

  const handleRotateKey = useCallback(async (): Promise<void> => {
    if (!db || !dbReady || !user?.id) return;

    setShowRotateConfirm(false);
    setRotationProgress({
      totalRecords: 0,
      processedRecords: 0,
      currentTable: '',
      status: 'in_progress',
    });

    const success = await rotateEncryptionKey(db, user.id, (progress) => {
      setRotationProgress(progress);
    });

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      logger.info('Encryption key rotated via settings');
      // Refresh key metadata
      const metadata = await getKeyMetadata();
      if (metadata) {
        setKeyAgeDays(metadata.ageDays);
        setKeyCreatedAt(metadata.createdAt);
      }
      setRotationSuggested(false);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  }, [db, dbReady, user]);

  const handleToggleLock = useCallback(
    async (value: boolean): Promise<void> => {
      if (value) {
        const success = await enable();
        if (success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          logger.info('Biometric lock enabled via settings');
        }
      } else {
        await disable();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        logger.info('Biometric lock disabled via settings');
      }
    },
    [enable, disable],
  );

  const handleToggleBackground = useCallback(
    async (value: boolean): Promise<void> => {
      await updateSettings({ lockOnBackground: value });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    },
    [updateSettings],
  );

  const handleSelectTimeout = useCallback(
    async (value: number): Promise<void> => {
      await updateSettings({ lockTimeout: value });
      setShowTimeoutPicker(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    },
    [updateSettings],
  );

  const handleToggleQuickEscape = useCallback(
    async (value: boolean): Promise<void> => {
      await setQuickEscapeEnabled(value);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      logger.info('Quick escape toggled via settings', { enabled: value });
    },
    [setQuickEscapeEnabled],
  );

  const handleSetPin = useCallback(
    async (enteredPin: string): Promise<void> => {
      if (pinStep === 'enter') {
        setNewPin(enteredPin);
        setPinStep('confirm');
        setPinError('');
      } else {
        if (enteredPin === newPin) {
          await setPin(enteredPin);
          setShowSetPin(false);
          setPinStep('enter');
          setNewPin('');
          setPinError('');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        } else {
          setPinError('PINs do not match. Try again.');
          setPinStep('enter');
          setNewPin('');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        }
      }
    },
    [pinStep, newPin, setPin],
  );

  const getTimeoutLabel = (): string => {
    const option = TIMEOUT_OPTIONS.find((o) => o.value === settings.lockTimeout);
    return option?.label ?? 'Immediately';
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={MotionTransitions.screenEnter()} style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">
              Privacy & Security
            </Text>
            <Text style={styles.subtitle}>
              Protect your recovery data with biometric authentication
            </Text>
          </Animated.View>

          {/* Biometric Lock Toggle */}
          <Animated.View entering={MotionTransitions.cardEnter(1)}>
            <Text style={styles.sectionHeader}>APP LOCK</Text>
            <View style={styles.cardGroup}>
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <View
                    style={[
                      styles.settingIcon,
                      { backgroundColor: ds.semantic.intent.primary.muted },
                    ]}
                  >
                    <Feather
                      name={biometricType === 'Face ID' ? 'eye' : 'smartphone'}
                      size={20}
                      color={ds.semantic.intent.primary.solid}
                    />
                  </View>
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>{biometricType} Lock</Text>
                    <Text style={styles.settingSubtitle}>
                      {isAvailable
                        ? `Require ${biometricType} to open the app`
                        : 'Biometrics not available on this device'}
                    </Text>
                  </View>
                </View>
                <Toggle
                  value={settings.enabled}
                  onValueChange={handleToggleLock}
                  disabled={!isAvailable}
                  accessibilityLabel={`Enable ${biometricType} lock`}
                  accessibilityHint={`Toggle ${biometricType} requirement to open the app`}
                />
              </View>
            </View>
          </Animated.View>

          {/* Lock Options - Only show when lock is enabled */}
          {settings.enabled ? (
            <Animated.View entering={MotionTransitions.cardEnter(2)}>
              <Text style={styles.sectionHeader}>LOCK OPTIONS</Text>
              <View style={styles.cardGroup}>
                {/* Lock on background */}
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <View
                      style={[
                        styles.settingIcon,
                        { backgroundColor: ds.semantic.intent.secondary.muted },
                      ]}
                    >
                      <Feather
                        name="minimize-2"
                        size={20}
                        color={ds.semantic.intent.secondary.solid}
                      />
                    </View>
                    <View style={styles.settingText}>
                      <Text style={styles.settingTitle}>Lock When Backgrounded</Text>
                      <Text style={styles.settingSubtitle}>Re-lock when you leave the app</Text>
                    </View>
                  </View>
                  <Toggle
                    value={settings.lockOnBackground}
                    onValueChange={handleToggleBackground}
                    accessibilityLabel="Lock when app is backgrounded"
                    accessibilityHint="Require re-authentication when returning to the app"
                  />
                </View>

                <View style={styles.divider} />

                {/* Timeout */}
                <Pressable
                  onPress={() => setShowTimeoutPicker(true)}
                  style={styles.settingItem}
                  disabled={!settings.lockOnBackground}
                  accessibilityLabel={`Lock timeout: ${getTimeoutLabel()}`}
                  accessibilityRole="button"
                  accessibilityHint="Choose how long before the app re-locks after going to the background"
                  accessibilityState={{ disabled: !settings.lockOnBackground }}
                >
                  <View style={styles.settingInfo}>
                    <View
                      style={[
                        styles.settingIcon,
                        { backgroundColor: ds.semantic.intent.secondary.muted },
                      ]}
                    >
                      <Feather name="clock" size={20} color={ds.semantic.intent.secondary.solid} />
                    </View>
                    <View style={styles.settingText}>
                      <Text
                        style={[
                          styles.settingTitle,
                          !settings.lockOnBackground && styles.disabledText,
                        ]}
                      >
                        Lock Timeout
                      </Text>
                      <Text
                        style={[
                          styles.settingSubtitle,
                          !settings.lockOnBackground && styles.disabledText,
                        ]}
                      >
                        {getTimeoutLabel()}
                      </Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={18} color={ds.semantic.text.muted} />
                </Pressable>

                <View style={styles.divider} />

                {/* PIN Fallback */}
                <Pressable
                  onPress={() => {
                    setPinStep('enter');
                    setNewPin('');
                    setPinError('');
                    setShowSetPin(true);
                  }}
                  style={styles.settingItem}
                  accessibilityLabel={hasPinSet ? 'Change PIN' : 'Set up PIN'}
                  accessibilityRole="button"
                  accessibilityHint="Set a backup PIN to unlock when biometrics fail"
                >
                  <View style={styles.settingInfo}>
                    <View
                      style={[
                        styles.settingIcon,
                        { backgroundColor: ds.semantic.intent.secondary.muted },
                      ]}
                    >
                      <Feather name="hash" size={20} color={ds.semantic.intent.secondary.solid} />
                    </View>
                    <View style={styles.settingText}>
                      <Text style={styles.settingTitle}>PIN Fallback</Text>
                      <Text style={styles.settingSubtitle}>
                        {hasPinSet ? 'PIN is set — tap to change' : 'Set a backup PIN'}
                      </Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={18} color={ds.semantic.text.muted} />
                </Pressable>
              </View>
            </Animated.View>
          ) : null}

          {/* Quick Escape */}
          <Animated.View entering={MotionTransitions.cardEnter(3)}>
            <Text style={styles.sectionHeader}>SAFETY</Text>
            <View style={styles.cardGroup}>
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <View
                    style={[
                      styles.settingIcon,
                      { backgroundColor: ds.semantic.intent.primary.muted },
                    ]}
                  >
                    <Feather
                      name="zap"
                      size={20}
                      color={ds.semantic.intent.primary.solid}
                    />
                  </View>
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Quick Escape</Text>
                    <Text style={styles.settingSubtitle}>
                      Triple-tap the top of the screen to instantly lock the app
                    </Text>
                  </View>
                </View>
                <Toggle
                  value={quickEscapeEnabled}
                  onValueChange={handleToggleQuickEscape}
                  accessibilityLabel="Enable quick escape"
                  accessibilityHint="Triple-tap the top of the screen to instantly lock the app and require re-authentication"
                />
              </View>
            </View>
          </Animated.View>

          {/* Encryption Key */}
          <Animated.View entering={MotionTransitions.cardEnter(4)}>
            <Text style={styles.sectionHeader}>ENCRYPTION KEY</Text>
            <View style={styles.cardGroup}>
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <View
                    style={[
                      styles.settingIcon,
                      {
                        backgroundColor: rotationSuggested
                          ? ds.semantic.intent.alert.muted
                          : ds.semantic.intent.secondary.muted,
                      },
                    ]}
                  >
                    <Feather
                      name="key"
                      size={20}
                      color={
                        rotationSuggested
                          ? ds.semantic.intent.alert.solid
                          : ds.semantic.intent.secondary.solid
                      }
                    />
                  </View>
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Key Age</Text>
                    <Text style={styles.settingSubtitle}>
                      {keyAgeDays !== null
                        ? keyCreatedAt === 'unknown'
                          ? 'Created before tracking was enabled'
                          : `Created ${keyAgeDays} day${keyAgeDays !== 1 ? 's' : ''} ago`
                        : 'Loading...'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <Pressable
                onPress={() => setShowRotateConfirm(true)}
                style={styles.settingItem}
                disabled={rotationProgress?.status === 'in_progress'}
                accessibilityLabel="Rotate encryption key"
                accessibilityRole="button"
                accessibilityHint="Generate a new encryption key and re-encrypt all data"
                accessibilityState={{
                  disabled: rotationProgress?.status === 'in_progress',
                }}
              >
                <View style={styles.settingInfo}>
                  <View
                    style={[
                      styles.settingIcon,
                      { backgroundColor: ds.semantic.intent.secondary.muted },
                    ]}
                  >
                    <Feather
                      name="refresh-cw"
                      size={20}
                      color={ds.semantic.intent.secondary.solid}
                    />
                  </View>
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Rotate Key</Text>
                    <Text style={styles.settingSubtitle}>
                      {rotationSuggested
                        ? 'Recommended — key is over 90 days old'
                        : 'Re-encrypt all data with a new key'}
                    </Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={18} color={ds.semantic.text.muted} />
              </Pressable>
            </View>

            {/* Progress indicator during rotation */}
            {rotationProgress?.status === 'in_progress' ? (
              <View style={styles.rotationProgress}>
                <Text style={styles.rotationProgressText}>
                  Re-encrypting {rotationProgress.currentTable || 'data'}...{' '}
                  {rotationProgress.totalRecords > 0
                    ? `${rotationProgress.processedRecords}/${rotationProgress.totalRecords}`
                    : ''}
                </Text>
                {rotationProgress.totalRecords > 0 ? (
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.round(
                            (rotationProgress.processedRecords / rotationProgress.totalRecords) * 100,
                          )}%`,
                          backgroundColor: ds.semantic.intent.primary.solid,
                        },
                      ]}
                    />
                  </View>
                ) : null}
                <Text style={styles.rotationWarning}>
                  Don&apos;t close the app during rotation.
                </Text>
              </View>
            ) : null}

            {rotationProgress?.status === 'completed' ? (
              <View style={styles.rotationProgress}>
                <Text
                  style={[
                    styles.rotationProgressText,
                    { color: ds.semantic.intent.primary.solid },
                  ]}
                >
                  ✓ Key rotated successfully
                </Text>
              </View>
            ) : null}

            {rotationProgress?.status === 'failed' ? (
              <View style={styles.rotationProgress}>
                <Text
                  style={[
                    styles.rotationProgressText,
                    { color: ds.semantic.intent.alert.solid },
                  ]}
                >
                  Rotation failed: {rotationProgress.error || 'Unknown error'}. Your data is safe
                  — the old key was preserved.
                </Text>
              </View>
            ) : null}
          </Animated.View>

          {/* Privacy Info */}
          <Animated.View entering={MotionTransitions.cardEnter(5)} style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Feather name="shield" size={20} color={ds.semantic.intent.secondary.solid} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Your Data is Protected</Text>
              <Text style={styles.infoText}>
                All journal entries and step work are encrypted with AES-256. Biometric lock adds an
                extra layer of protection to prevent unauthorized access.
              </Text>
            </View>
          </Animated.View>

          <View style={{ height: ds.space[20] }} />
        </ScrollView>
      </SafeAreaView>

      {/* Timeout Picker Modal */}
      <Modal
        visible={showTimeoutPicker}
        onClose={() => setShowTimeoutPicker(false)}
        title="Lock Timeout"
        message="Choose how long before the app re-locks"
        variant="center"
        actions={TIMEOUT_OPTIONS.map((option) => ({
          title: option.label,
          onPress: () => handleSelectTimeout(option.value),
          variant: option.value === settings.lockTimeout ? 'primary' : 'outline',
        }))}
        dismissable
      />

      {/* Rotate Key Confirmation Modal */}
      <Modal
        visible={showRotateConfirm}
        onClose={() => setShowRotateConfirm(false)}
        title="Rotate Encryption Key?"
        message="This will generate a new encryption key and re-encrypt all your data. This may take a few minutes depending on how much data you have. Don't close the app during rotation."
        variant="center"
        actions={[
          {
            title: 'Rotate Key',
            onPress: handleRotateKey,
            variant: 'primary',
          },
          {
            title: 'Cancel',
            onPress: () => setShowRotateConfirm(false),
            variant: 'outline',
          },
        ]}
        dismissable
      />

      {/* Set PIN Modal */}
      <Modal
        visible={showSetPin}
        onClose={() => {
          setShowSetPin(false);
          setPinStep('enter');
          setNewPin('');
          setPinError('');
        }}
        title={pinStep === 'enter' ? 'Set PIN' : 'Confirm PIN'}
        message={
          pinError ||
          (pinStep === 'enter'
            ? 'Enter a 4-digit PIN as backup unlock method'
            : 'Re-enter your PIN to confirm')
        }
        variant="center"
        actions={[
          {
            title: 'Cancel',
            onPress: () => {
              setShowSetPin(false);
              setPinStep('enter');
              setNewPin('');
              setPinError('');
            },
            variant: 'outline',
          },
        ]}
        dismissable
      >
        <PinSetupInput onComplete={handleSetPin} />
      </Modal>
    </View>
  );
}

/** Inline PIN setup component for the modal */
function PinSetupInput({
  onComplete,
}: {
  onComplete: (pin: string) => Promise<void>;
}): React.ReactElement {
  const styles = useThemedStyles(createPinStyles);
  const ds = useDs();

  const { pin, handleDigit, handleBackspace, clear } = usePinEntry({
    onSuccess: () => {},
    validator: async (enteredPin: string): Promise<boolean> => {
      await onComplete(enteredPin);
      clear();
      return true;
    },
    requiredLength: 4,
  });

  return (
    <View style={styles.pinSetup}>
      <View
        style={styles.pinDots}
        accessibilityLabel={`PIN entry, ${pin.length} of 4 digits entered`}
        accessibilityRole="text"
      >
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled]} />
        ))}
      </View>
      <View style={styles.miniPad}>
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
          ['', '0', '⌫'],
        ].map((row, rowIdx) => (
          <View key={rowIdx} style={styles.miniPadRow}>
            {row.map((d) => {
              if (d === '') return <View key="empty" style={styles.miniBtn} />;
              if (d === '⌫') {
                return (
                  <Pressable
                    key="del"
                    style={styles.miniBtn}
                    onPress={handleBackspace}
                    accessibilityLabel="Delete"
                    accessibilityRole="button"
                  >
                    <Feather name="delete" size={18} color={ds.semantic.text.secondary} />
                  </Pressable>
                );
              }
              return (
                <Pressable
                  key={d}
                  style={({ pressed }) => [styles.miniBtn, pressed && styles.miniBtnPressed]}
                  onPress={() => handleDigit(d)}
                  accessibilityLabel={`Digit ${d}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.miniBtnText}>{d}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const createPinStyles = (ds: DS) => ({
  pinSetup: {
    alignItems: 'center' as const,
    paddingVertical: ds.space[4],
  },
  pinDots: {
    flexDirection: 'row' as const,
    gap: ds.space[3],
    marginBottom: ds.space[4],
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: ds.semantic.text.muted,
  },
  dotFilled: {
    backgroundColor: ds.semantic.intent.primary.solid,
    borderColor: ds.semantic.intent.primary.solid,
  },
  miniPad: {
    gap: ds.space[1],
  },
  miniPadRow: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: ds.space[2],
  },
  miniBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  miniBtnPressed: {
    backgroundColor: ds.colors.borderStrong,
  },
  miniBtnText: {
    fontSize: 22,
    fontWeight: '300' as const,
    color: ds.semantic.text.primary,
  },
});

const createStyles = (ds: DS) => ({
  container: {
    flex: 1,
    backgroundColor: ds.semantic.surface.app,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: ds.semantic.layout.screenPadding,
  },

  // Header
  header: {
    paddingTop: ds.space[6],
    paddingBottom: ds.space[4],
  },
  title: {
    fontSize: 34,
    fontWeight: '700' as const,
    color: ds.semantic.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...ds.typography.caption,
    color: ds.semantic.text.tertiary,
    marginTop: ds.space[1],
  },

  // Section Header
  sectionHeader: {
    ...ds.typography.caption,
    color: ds.semantic.text.tertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginTop: ds.space[6],
    marginBottom: ds.space[2],
    marginLeft: ds.space[1],
  },

  // Card Group
  cardGroup: {
    backgroundColor: ds.semantic.surface.card,
    borderRadius: ds.radius.lg,
    overflow: 'hidden' as const,
  },

  // Setting Item
  settingItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: ds.space[4],
    paddingHorizontal: ds.space[4],
    minHeight: 64,
  },
  settingInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    marginRight: ds.space[3],
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: ds.radius.sm,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  settingText: {
    flex: 1,
    marginLeft: ds.space[3],
  },
  settingTitle: {
    ...ds.typography.body,
    color: ds.semantic.text.primary,
  },
  settingSubtitle: {
    ...ds.typography.caption,
    color: ds.semantic.text.tertiary,
    marginTop: 1,
  },
  disabledText: {
    opacity: 0.4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: ds.colors.divider,
    marginLeft: 36 + ds.space[4] + ds.space[3],
  },

  // Info Card
  infoCard: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    backgroundColor: ds.semantic.intent.secondary.muted,
    borderRadius: ds.radius.lg,
    padding: ds.space[4],
    marginTop: ds.space[6],
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ds.semantic.intent.secondary.subtle,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  infoContent: {
    flex: 1,
    marginLeft: ds.space[3],
  },
  infoTitle: {
    ...ds.typography.body,
    fontWeight: '600' as const,
    color: ds.semantic.intent.secondary.solid,
  },
  infoText: {
    ...ds.typography.caption,
    color: ds.semantic.text.secondary,
    marginTop: ds.space[1],
    lineHeight: 18,
  },

  // Rotation progress
  rotationProgress: {
    paddingHorizontal: ds.space[4],
    paddingVertical: ds.space[3],
  },
  rotationProgressText: {
    ...ds.typography.caption,
    color: ds.semantic.text.secondary,
  },
  rotationWarning: {
    ...ds.typography.caption,
    color: ds.semantic.text.tertiary,
    marginTop: ds.space[1],
    fontStyle: 'italic' as const,
  },
  progressBar: {
    height: 4,
    backgroundColor: ds.colors.borderStrong,
    borderRadius: 2,
    marginTop: ds.space[2],
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%' as const,
    borderRadius: 2,
  },
});
