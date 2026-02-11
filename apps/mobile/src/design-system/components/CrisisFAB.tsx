/**
 * CrisisFAB Component - Material Design 3
 * 
 * Emergency Floating Action Button with pulse animation.
 * 
 * Features:
 * - 56dp standard or 96dp extended size
 * - Secondary amber color (#D4A574)
 * - Subtle pulse animation
 * - Accessibility support for emergency context
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  type ViewStyle,
  type TextStyle,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  Extrapolation,
  cancelAnimation,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { md3LightColors, md3DarkColors, amber } from '../tokens/md3-colors';
import { md3ElevationLight, md3ElevationDark, md3Shape, md3Typography, md3Motion } from '../tokens/md3-elevation';
import { useTheme } from '../hooks/useTheme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// ============================================================================
// TYPES
// ============================================================================

export type CrisisFABVariant = 'standard' | 'extended';
export type CrisisFABSize = 'default' | 'large';

export interface CrisisFABProps {
  /** Button variant */
  variant?: CrisisFABVariant;
  /** Button size */
  size?: CrisisFABSize;
  /** Called when button is pressed */
  onPress: () => void;
  /** Label for extended variant */
  label?: string;
  /** Icon name (Feather) */
  icon?: keyof typeof Feather.glyphMap;
  /** Additional container styles */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
  /** Accessibility label override */
  accessibilityLabel?: string;
  /** Whether pulse animation is active */
  pulsing?: boolean;
  /** Pulse animation intensity */
  pulseIntensity?: 'subtle' | 'medium' | 'strong';
  /** Lower elevation (use when on colored backgrounds) */
  lowered?: boolean;
  /** Custom background color */
  backgroundColor?: string;
  /** Position style (absolute positioning) */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'custom';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SIZE_MAP = {
  standard: {
    default: { width: 56, height: 56, iconSize: 24 },
    large: { width: 64, height: 64, iconSize: 28 },
  },
  extended: {
    default: { width: 'auto' as const, height: 56, iconSize: 24, minWidth: 96 },
    large: { width: 'auto' as const, height: 64, iconSize: 28, minWidth: 120 },
  },
};

const POSITION_STYLES: Record<string, ViewStyle> = {
  'bottom-right': { position: 'absolute', bottom: 24, right: 24 },
  'bottom-left': { position: 'absolute', bottom: 24, left: 24 },
  'top-right': { position: 'absolute', top: 24, right: 24 },
  'top-left': { position: 'absolute', top: 24, left: 24 },
  'custom': {},
};

// ============================================================================
// PULSE RING COMPONENT
// ============================================================================

interface PulseRingProps {
  isActive: boolean;
  intensity: 'subtle' | 'medium' | 'strong';
  baseSize: number;
  color: string;
}

function PulseRing({ isActive, intensity, baseSize, color }: PulseRingProps): React.ReactElement | null {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  
  const intensityConfig = {
    subtle: { scale: 1.3, opacity: 0.3, duration: 2000 },
    medium: { scale: 1.5, opacity: 0.4, duration: 1500 },
    strong: { scale: 1.7, opacity: 0.5, duration: 1000 },
  };
  
  const config = intensityConfig[intensity];
  
  useEffect(() => {
    if (isActive) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 0 }),
          withTiming(config.scale, { duration: config.duration, easing: Easing.out(Easing.ease) })
        ),
        -1,
        false
      );
      
      opacity.value = withRepeat(
        withSequence(
          withTiming(config.opacity, { duration: config.duration * 0.3 }),
          withTiming(0, { duration: config.duration * 0.7, easing: Easing.out(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      scale.value = withTiming(1, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
    
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [isActive, intensity]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    width: baseSize,
    height: baseSize,
    borderRadius: baseSize / 2,
  }));
  
  return (
    <Animated.View 
      style={[
        styles.pulseRing,
        { backgroundColor: color },
        animatedStyle,
      ]} 
    />
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CrisisFAB({
  variant = 'standard',
  size = 'default',
  onPress,
  label = 'Safety Kit',
  icon = 'shield',
  style,
  testID,
  accessibilityLabel,
  pulsing = true,
  pulseIntensity = 'subtle',
  lowered = false,
  backgroundColor,
  position = 'bottom-right',
}: CrisisFABProps): React.ReactElement {
  const theme = useTheme();
  const isDark = theme?.isDark ?? false;
  const colors = isDark ? md3DarkColors : md3LightColors;
  const elevation = isDark ? md3ElevationDark : md3ElevationLight;
  
  // Amber secondary color from MD3
  const amberColor = backgroundColor || amber[80];
  const onAmberColor = amber[20];
  
  const sizeConfig = SIZE_MAP[variant][size];
  const baseSize = typeof sizeConfig.height === 'number' ? sizeConfig.height : 56;
  
  // Animation values
  const scale = useSharedValue(1);
  const elevationValue = useSharedValue(lowered ? 2 : 4);
  
  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.95, { duration: 100 });
    elevationValue.value = withTiming(lowered ? 1 : 2, { duration: 100 });
  }, [lowered]);
  
  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, md3Motion.spring.quick);
    elevationValue.value = withTiming(lowered ? 2 : 4, { duration: 200 });
  }, [lowered]);
  
  const handlePress = useCallback(() => {
    // Announce for accessibility
    AccessibilityInfo.announceForAccessibility('Opening Safety Kit');
    onPress();
  }, [onPress]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const positionStyle = POSITION_STYLES[position];
  
  const a11yLabel = accessibilityLabel || 
    `Safety Kit. ${pulsing ? 'Active emergency support available' : ''}. Double tap to open.`;
  
  return (
    <View style={[styles.container, positionStyle, style]}>
      {/* Pulse rings */}
      {pulsing && (
        <>
          <PulseRing 
            isActive={pulsing} 
            intensity={pulseIntensity} 
            baseSize={baseSize}
            color={amberColor}
          />
          <PulseRing 
            isActive={pulsing} 
            intensity={pulseIntensity} 
            baseSize={baseSize}
            color={amberColor}
          />
        </>
      )}
      
      {/* Main Button */}
      <AnimatedTouchable
        style={[
          styles.button,
          variant === 'standard' && {
            width: sizeConfig.width,
            height: sizeConfig.height,
            borderRadius: baseSize / 2,
          },
          variant === 'extended' && {
            height: sizeConfig.height,
            minWidth: 'minWidth' in sizeConfig ? sizeConfig.minWidth : 96,
            paddingHorizontal: 20,
            borderRadius: baseSize / 2,
          },
          {
            backgroundColor: amberColor,
          },
          lowered ? elevation.level2 : elevation.level4,
          animatedStyle,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        testID={testID}
        accessible
        accessibilityLabel={a11yLabel}
        accessibilityRole="button"
        accessibilityHint="Opens the safety kit with emergency resources"
        accessibilityState={{ selected: pulsing }}
      >
        <Feather 
          name={icon} 
          size={sizeConfig.iconSize} 
          color={onAmberColor} 
        />
        {variant === 'extended' && (
          <Text style={[styles.label, { color: onAmberColor }]}>
            {label}
          </Text>
        )}
      </AnimatedTouchable>
    </View>
  );
}

// ============================================================================
// CRISIS BUTTON GROUP
// ============================================================================

export interface CrisisButtonGroupProps {
  /** Primary action */
  onPrimaryPress: () => void;
  /** Secondary action (optional) */
  onSecondaryPress?: () => void;
  /** Primary button label */
  primaryLabel?: string;
  /** Secondary button label */
  secondaryLabel?: string;
  style?: ViewStyle;
}

export function CrisisButtonGroup({
  onPrimaryPress,
  onSecondaryPress,
  primaryLabel = 'Get Help Now',
  secondaryLabel = 'Safety Plan',
  style,
}: CrisisButtonGroupProps): React.ReactElement {
  const theme = useTheme();
  const isDark = theme?.isDark ?? false;
  const colors = isDark ? md3DarkColors : md3LightColors;
  
  return (
    <View style={[styles.buttonGroup, style]}>
      <TouchableOpacity
        style={[
          styles.groupButton,
          styles.primaryButton,
          { backgroundColor: amber[80] },
        ]}
        onPress={onPrimaryPress}
        accessible
        accessibilityLabel={primaryLabel}
        accessibilityRole="button"
      >
        <Feather name="phone" size={20} color={amber[20]} />
        <Text style={[styles.groupButtonText, { color: amber[20] }]}>
          {primaryLabel}
        </Text>
      </TouchableOpacity>
      
      {onSecondaryPress && (
        <TouchableOpacity
          style={[
            styles.groupButton,
            styles.secondaryButton,
            { 
              backgroundColor: colors.surfaceContainerHighest,
              borderColor: colors.outline,
            },
          ]}
          onPress={onSecondaryPress}
          accessible
          accessibilityLabel={secondaryLabel}
          accessibilityRole="button"
        >
          <Feather name="file-text" size={20} color={colors.onSurface} />
          <Text style={[styles.groupButtonText, { color: colors.onSurface }]}>
            {secondaryLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  pulseRing: {
    position: 'absolute',
    opacity: 0,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 2,
  },
  label: {
    ...md3Typography.labelLarge,
    fontWeight: '600',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  groupButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: md3Shape.full,
  },
  primaryButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  groupButtonText: {
    ...md3Typography.labelLarge,
    fontWeight: '600',
  },
});
