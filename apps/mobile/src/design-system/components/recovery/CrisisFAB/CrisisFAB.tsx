/**
 * CrisisFAB Component
 * Emergency Floating Action Button - always accessible, life-saving feature
 *
 * When `showSOSOverlay` is true (default), tapping the FAB opens the
 * SOSOverlay instead of firing `onPress`. Pass `showSOSOverlay={false}`
 * to retain the legacy callback behaviour.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, AccessibilityInfo, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Shield, Phone } from 'lucide-react-native';
import { COLORS, ANIMATION, DIMENSIONS, TYPOGRAPHY, SPACING } from '../constants';
import { SOSOverlay } from '../../../../features/emergency/components/SOSOverlay';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export interface CrisisFABProps {
  onPress: () => void;
  extended?: boolean;
  pulseOnMount?: boolean;
  reducedMotion?: boolean;
  testID?: string;
  /** When true, tapping the FAB opens the SOS overlay. Defaults to true. */
  showSOSOverlay?: boolean;
}

export function CrisisFAB({
  onPress,
  extended = false,
  pulseOnMount = true,
  reducedMotion = false,
  testID,
  showSOSOverlay = true,
}: CrisisFABProps): React.ReactElement {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [sosVisible, setSOSVisible] = useState(false);

  // Animation values
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);
  const pressScale = useSharedValue(1);

  const size = extended ? DIMENSIONS.crisisFABExtended : DIMENSIONS.crisisFABStandard;

  // Pulse animation on mount
  React.useEffect(() => {
    if (pulseOnMount && !reducedMotion) {
      // 3 pulses over 2 seconds
      pulseScale.value = withSequence(
        withDelay(500, withTiming(1.3, { duration: 500 })),
        withTiming(1, { duration: 500 }),
        withDelay(200, withTiming(1.3, { duration: 500 })),
        withTiming(1, { duration: 500 }),
        withDelay(200, withTiming(1.3, { duration: 500 })),
        withTiming(1, { duration: 500 }),
      );

      pulseOpacity.value = withSequence(
        withDelay(500, withTiming(0.3, { duration: 500 })),
        withTiming(0, { duration: 500 }),
        withDelay(200, withTiming(0.3, { duration: 500 })),
        withTiming(0, { duration: 500 }),
        withDelay(200, withTiming(0.3, { duration: 500 })),
        withTiming(0, { duration: 500 }),
      );
    }
  }, [pulseOnMount, reducedMotion]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  // Handle press
  const handlePress = useCallback(() => {
    if (!reducedMotion) {
      pressScale.value = withSequence(
        withTiming(0.9, { duration: ANIMATION.accelerated }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      );
    }

    // Strong haptic for emergency
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    // Announce for screen readers
    AccessibilityInfo.announceForAccessibility(
      'Opening safety kit. Emergency resources available.',
    );

    if (showSOSOverlay) {
      setSOSVisible(true);
    } else {
      onPress();
    }
  }, [onPress, reducedMotion, pressScale, showSOSOverlay]);

  // Accessibility label
  const accessibilityLabel = useMemo(() => {
    return extended ? 'Safety kit button. Tap for emergency resources.' : 'Crisis support button';
  }, [extended]);

  return (
    <View
      style={{
        position: 'absolute',
        right: SPACING.lg,
        bottom: SPACING.lg,
        zIndex: 9999,
        elevation: 9999,
      }}
      pointerEvents="box-none"
    >
      {/* Pulse effect */}
      {!reducedMotion && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: COLORS.secondary,
            },
            pulseStyle,
          ]}
        />
      )}

      {/* Main FAB */}
      <AnimatedTouchable
        onPress={handlePress}
        style={[
          {
            width: size,
            height: extended ? 56 : size,
            borderRadius: extended ? 28 : size / 2,
            backgroundColor: COLORS.secondary,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          },
          containerStyle,
        ]}
        accessible
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityHint="Tap to access emergency resources, breathing exercises, and crisis hotlines"
        testID={testID}
        hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
      >
        <Shield size={24} color={COLORS.white} />

        {extended && (
          <Text
            style={{
              fontSize: TYPOGRAPHY.labelLarge.fontSize,
              fontWeight: TYPOGRAPHY.labelLarge.fontWeight,
              color: COLORS.white,
              marginLeft: SPACING.sm,
            }}
          >
            Safety Kit
          </Text>
        )}
      </AnimatedTouchable>

      {/* Emergency indicator (small dot) */}
      <View
        className="absolute -top-1 -right-1 w-4 h-4 rounded-full items-center justify-center"
        style={{ backgroundColor: COLORS.error }}
      >
        <Phone size={8} color={COLORS.white} />
      </View>

      {/* SOS Overlay */}
      {showSOSOverlay && <SOSOverlay visible={sosVisible} onClose={() => setSOSVisible(false)} />}
    </View>
  );
}

// Alternative compact version for inline use
export interface CompactCrisisButtonProps {
  onPress: () => void;
  label?: string;
  reducedMotion?: boolean;
  testID?: string;
}

export function CompactCrisisButton({
  onPress,
  label = 'Get Help',
  reducedMotion = false,
  testID,
}: CompactCrisisButtonProps): React.ReactElement {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    if (!reducedMotion) {
      scale.value = withSequence(
        withTiming(0.95, { duration: ANIMATION.accelerated }),
        withTiming(1, { duration: ANIMATION.standard }),
      );
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [onPress, reducedMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      onPress={handlePress}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: COLORS.secondary,
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.md,
          borderRadius: DIMENSIONS.cornerRadius.large,
        },
        animatedStyle,
      ]}
      accessible
      accessibilityLabel={`${label}. Emergency support button`}
      accessibilityRole="button"
      accessibilityHint="Tap for immediate access to crisis resources"
      testID={testID}
    >
      <Phone size={20} color={COLORS.white} />
      <Text
        style={{
          fontSize: TYPOGRAPHY.labelLarge.fontSize,
          fontWeight: TYPOGRAPHY.labelLarge.fontWeight,
          color: COLORS.white,
          marginLeft: SPACING.sm,
        }}
      >
        {label}
      </Text>
    </AnimatedTouchable>
  );
}
