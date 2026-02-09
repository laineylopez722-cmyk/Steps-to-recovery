import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/hooks/useAuth';
import { usePinEntry } from '../../lib/hooks/usePinEntry';
import { PinKeypad } from '../../components/auth/PinKeypad';
import { PinIndicators } from '../../components/auth/PinIndicators';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  FadeIn,
  ZoomIn,
  SlideInDown,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

export default function LockScreen() {
  const router = useRouter();
  const {
    authenticate,
    authenticateWithPin,
    hasPin,
    checkBiometricSupport,
  } = useAuth();

  const [showPinInput, setShowPinInput] = useState(false);
  const [hasPinSet, setHasPinSet] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // Shared Values for Animation
  const shakeX = useSharedValue(0);

  const triggerShake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    shakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const {
    pin,
    error,
    handleDigit,
    handleBackspace,
    clear,
  } = usePinEntry({
    onSuccess: () => router.replace('/(tabs)'),
    onFailure: () => {
      triggerShake();
      setTimeout(clear, 500); // Clear after a moment so user sees the error state
    },
    validator: async (code) => {
      return await authenticateWithPin(code);
    },
  });

  useEffect(() => {
    checkCapabilities();
  }, []);

  const checkCapabilities = async () => {
    const biometric = await checkBiometricSupport();
    setBiometricAvailable(biometric);

    const pinExists = await hasPin();
    setHasPinSet(pinExists);

    // Auto-trigger biometrics if available
    if (biometric) {
      handleBiometricAuth();
    } else if (!pinExists) {
      // No security set up, go straight through
      router.replace('/(tabs)');
    } else {
      setShowPinInput(true);
    }
  };

  const handleBiometricAuth = async () => {
    const success = await authenticate();
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } else {
      // Biometric failed, show PIN if available
      if (hasPinSet) {
        setShowPinInput(true);
      }
    }
  };

  const shakeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shakeX.value }],
    };
  });

  return (
    <View className="flex-1 bg-navy-950 relative">
      {/* Background Ambience */}
      <View className="absolute top-0 left-0 right-0 h-full overflow-hidden">
        <View className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-primary-900/20 rounded-full blur-3xl" />
        <View className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-secondary-900/20 rounded-full blur-3xl" />
      </View>

      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center px-8">
          {/* Logo */}
          <Animated.View
            entering={ZoomIn.duration(800).springify()}
            className="mb-10"
          >
            <BlurView intensity={20} tint="light" className="w-28 h-28 rounded-3xl items-center justify-center overflow-hidden bg-white/5 border border-white/10">
              <Text className="text-6xl">🌱</Text>
            </BlurView>
          </Animated.View>

          {/* Title */}
          <Animated.View
            entering={FadeIn.delay(300).duration(800)}
            className="items-center"
          >
            <Text className="text-3xl font-bold text-white text-center mb-2 tracking-tight">
              Recovery Companion
            </Text>
            <Text className="text-surface-400 text-center mb-12 text-lg">
              Your journey is private and secure
            </Text>
          </Animated.View>

          {/* PIN Input Area */}
          {showPinInput ? (
            <Animated.View
              entering={SlideInDown.springify().damping(20)}
              style={[shakeStyle]}
              className="w-full items-center"
            >
              <PinIndicators
                length={4}
                filledCount={pin.length}
                error={!!error}
              />

              {error ? (
                <Animated.Text
                  entering={FadeIn}
                  className="text-danger-400 mb-6 font-medium"
                >
                  {error}
                </Animated.Text>
              ) : (
                <Text className="text-surface-500 mb-6 font-medium">Enter your PIN</Text>
              )}

              <PinKeypad
                onDigitPress={handleDigit}
                onBackspacePress={handleBackspace}
              />

              {/* Biometric option */}
              {biometricAvailable && (
                <TouchableOpacity
                  onPress={handleBiometricAuth}
                  className="mt-2 py-3 px-6 rounded-full bg-white/5 active:bg-white/10"
                >
                  <Text className="text-primary-300 text-base font-medium">
                    Use {Platform.OS === 'ios' ? 'Face ID' : 'Biometrics'}
                  </Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          ) : (
            <Animated.View
              entering={FadeIn.delay(500)}
              className="items-center w-full px-8"
            >
              {/* Unlock Button (Biometric) */}
              <TouchableOpacity
                onPress={handleBiometricAuth}
                className="w-full bg-primary-600 active:bg-primary-700 rounded-2xl py-4 flex-row items-center justify-center gap-3 mb-6 shadow-lg shadow-primary-900/50"
              >
                <Text className="text-2xl">
                  {Platform.OS === 'ios' ? 'Face ID' : '👆'}
                </Text>
                <Text className="text-white text-lg font-bold">
                  Unlock
                </Text>
              </TouchableOpacity>

              {hasPinSet && (
                <TouchableOpacity
                  onPress={() => setShowPinInput(true)}
                  className="py-2"
                >
                  <Text className="text-surface-400 font-medium">Use PIN instead</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          )}
        </View>

        {/* Footer */}
        <Animated.View
          entering={FadeIn.delay(1000)}
          className="px-8 pb-8"
        >
          <Text className="text-surface-600 text-center text-xs">
            100% Encrypted • Offline First
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

