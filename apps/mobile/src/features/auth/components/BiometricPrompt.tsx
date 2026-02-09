import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  interpolate,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as LocalAuthentication from 'expo-local-authentication';
import { GlassCard } from '../../../design-system/components/GlassCard';
import { GradientButton } from '../../../design-system/components/GradientButton';
import { darkAccent, gradients, spacing, typography } from '../../../design-system/tokens/modern';
import { LinearGradient } from 'expo-linear-gradient';
import { ds } from '../../../design-system/tokens/ds';

interface BiometricPromptProps {
  isVisible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  onFallback: () => void;
}

export function BiometricPrompt({
  isVisible,
  onSuccess,
  onCancel,
  onFallback,
}: BiometricPromptProps): React.ReactElement | null {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const pulse = useSharedValue(1);
  const [authType, setAuthType] = React.useState<string>('Biometric');
  const [isScanning, setIsScanning] = React.useState(false);

  useEffect(() => {
    checkAuthType();
  }, []);

  useEffect(() => {
    if (isVisible) {
      scale.value = withSpring(1, { damping: 15 });
      opacity.value = withTiming(1);
      pulse.value = withRepeat(withTiming(1.2, { duration: 1000 }), -1, true);
      attemptAuth();
    } else {
      scale.value = withTiming(0);
      opacity.value = withTiming(0);
    }
  }, [isVisible]);

  const checkAuthType = async () => {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      setAuthType('Face ID');
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      setAuthType('Touch ID');
    }
  };

  const attemptAuth = async () => {
    setIsScanning(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Authenticate with ${authType}`,
        fallbackLabel: 'Use Passcode',
      });
      if (result.success) onSuccess();
      else setIsScanning(false);
    } catch {
      setIsScanning(false);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.2], [0.8, 0.3]),
  }));

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <BlurView intensity={50} style={StyleSheet.absoluteFill} tint="dark" />
      <Animated.View style={[styles.container, animatedStyle]}>
        <GlassCard intensity="heavy" style={styles.card}>
          <View style={styles.iconContainer}>
            <Animated.View style={[styles.pulseRing, pulseStyle]} />
            <LinearGradient
              colors={isScanning ? gradients.success : gradients.primary}
              style={styles.iconGradient}
            >
              <MaterialIcons
                name={authType === 'Face ID' ? 'face' : 'fingerprint'}
                size={48}
                color="#FFF"
              />
            </LinearGradient>
          </View>
          <Text style={styles.title}>{authType}</Text>
          <Text style={styles.description}>
            {isScanning
              ? `Scanning ${authType}...`
              : `Use ${authType} to unlock your recovery data`}
          </Text>
          <View style={styles.buttons}>
            <GradientButton
              title={`Use ${authType}`}
              variant="primary"
              size="lg"
              fullWidth
              onPress={attemptAuth}
              loading={isScanning}
            />
            <GradientButton
              title="Use Passcode"
              variant="ghost"
              size="md"
              fullWidth
              onPress={onFallback}
            />
            <GradientButton title="Cancel" variant="ghost" size="sm" fullWidth onPress={onCancel} />
          </View>
        </GlassCard>
      </Animated.View>
    </View>
  );
}

// App Lock Screen
interface AppLockScreenProps {
  onUnlock: () => void;
}

export function AppLockScreen({ onUnlock }: AppLockScreenProps): React.ReactElement {
  const [authType, setAuthType] = React.useState<string>('Biometric');
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);

  React.useEffect(() => {
    checkAuthType();
  }, []);

  const checkAuthType = async () => {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION))
      setAuthType('Face ID');
    else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT))
      setAuthType('Touch ID');
  };

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Steps to Recovery',
      });
      if (result.success) onUnlock();
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <View style={styles.lockContainer}>
      <LinearGradient colors={[darkAccent.background, ds.colors.bgTertiary]} style={StyleSheet.absoluteFill} />
      <View style={styles.lockContent}>
        <View style={styles.appIcon}>
          <LinearGradient colors={gradients.primary} style={styles.appIconGradient}>
            <MaterialIcons name="self-improvement" size={48} color="#FFF" />
          </LinearGradient>
        </View>
        <Text style={styles.appName}>Steps to Recovery</Text>
        <Text style={styles.lockMessage}>Tap to unlock</Text>
        <Pressable
          onPress={handleAuthenticate}
          style={styles.lockButton}
          disabled={isAuthenticating}
        >
          <LinearGradient
            colors={isAuthenticating ? gradients.success : gradients.primary}
            style={styles.lockButtonGradient}
          >
            <MaterialIcons
              name={authType === 'Face ID' ? 'face' : 'fingerprint'}
              size={32}
              color="#FFF"
            />
          </LinearGradient>
        </Pressable>
        <Text style={styles.lockHint}>Secure with {authType}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ds.colors.bgOverlay,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: { width: '100%', maxWidth: 320 },
  card: { padding: spacing[4], alignItems: 'center' },
  iconContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: darkAccent.success,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.h2, color: darkAccent.text, marginBottom: spacing[2] },
  description: {
    ...typography.body,
    color: darkAccent.textMuted,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  buttons: { width: '100%', gap: spacing[2] },
  lockContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lockContent: { alignItems: 'center' },
  appIcon: { marginBottom: spacing[4] },
  appIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: { ...typography.h2, color: darkAccent.text, marginBottom: spacing[1] },
  lockMessage: { ...typography.body, color: darkAccent.textMuted, marginBottom: spacing[6] },
  lockButton: { marginBottom: spacing[3] },
  lockButtonGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockHint: { ...typography.bodySmall, color: darkAccent.textSubtle },
});
