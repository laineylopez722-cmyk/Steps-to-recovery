/**
 * CircularProgressRing Component
 * 
 * Beautiful circular progress visualization for clean time tracking.
 * Uses SVG rings with glassmorphic styling and smooth animations.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { darkAccent, spacing, typography } from '../design-system/tokens/modern';

// ========================================
// Types
// ========================================

export interface CircularProgressRingProps {
  days: number;
  hours: number;
  minutes: number;
  isMilestone?: boolean;
  size?: number;
  accessibilityLabel?: string;
}

// ========================================
// Animated SVG Components
// ========================================

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ========================================
// Helper Functions
// ========================================

/**
 * Calculate stroke dash offset for progress
 */
function getStrokeDashoffset(progress: number, circumference: number): number {
  const offset = circumference - (progress / 100) * circumference;
  return offset;
}

/**
 * Get progress percentage for different time units
 */
function getDayProgress(days: number): number {
  // Progress toward 365 days (1 year)
  return Math.min((days / 365) * 100, 100);
}

function getHourProgress(hours: number): number {
  return (hours / 24) * 100;
}

function getMinuteProgress(minutes: number): number {
  return (minutes / 60) * 100;
}

// ========================================
// Component
// ========================================

export function CircularProgressRing({
  days,
  hours,
  minutes,
  isMilestone = false,
  size = 280,
  accessibilityLabel,
}: CircularProgressRingProps): React.ReactElement {
  // Ring dimensions
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Ring radii (outer → inner)
  const dayRadius = size / 2 - 20;
  const hourRadius = size / 2 - 50;
  const minuteRadius = size / 2 - 80;
  
  // Ring stroke widths
  const strokeWidth = 10;
  
  // Circumferences
  const dayCircumference = 2 * Math.PI * dayRadius;
  const hourCircumference = 2 * Math.PI * hourRadius;
  const minuteCircumference = 2 * Math.PI * minuteRadius;
  
  // Progress values (animated)
  const dayProgressValue = useSharedValue(0);
  const hourProgressValue = useSharedValue(0);
  const minuteProgressValue = useSharedValue(0);
  
  // Animate on mount and when values change
  useEffect(() => {
    dayProgressValue.value = withTiming(getDayProgress(days), {
      duration: 1500,
      easing: Easing.out(Easing.cubic),
    });
  }, [days]);
  
  useEffect(() => {
    hourProgressValue.value = withTiming(getHourProgress(hours), {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [hours]);
  
  useEffect(() => {
    minuteProgressValue.value = withTiming(getMinuteProgress(minutes), {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [minutes]);
  
  // Animated props for each ring
  const dayAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: getStrokeDashoffset(dayProgressValue.value, dayCircumference),
  }));
  
  const hourAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: getStrokeDashoffset(hourProgressValue.value, hourCircumference),
  }));
  
  const minuteAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: getStrokeDashoffset(minuteProgressValue.value, minuteCircumference),
  }));
  
  return (
    <View style={styles.container} accessible accessibilityLabel={accessibilityLabel}>
      <Svg width={size} height={size}>
        <Defs>
          {/* Day ring gradient */}
          <LinearGradient id="dayGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={darkAccent.primary} stopOpacity="1" />
            <Stop offset="100%" stopColor={darkAccent.secondary} stopOpacity="1" />
          </LinearGradient>
          
          {/* Hour ring gradient */}
          <LinearGradient id="hourGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={darkAccent.secondary} stopOpacity="0.8" />
            <Stop offset="100%" stopColor={darkAccent.accent} stopOpacity="0.8" />
          </LinearGradient>
          
          {/* Minute ring gradient */}
          <LinearGradient id="minuteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={darkAccent.accent} stopOpacity="0.6" />
            <Stop offset="100%" stopColor={darkAccent.primary} stopOpacity="0.6" />
          </LinearGradient>
        </Defs>
        
        <G rotation="-90" origin={`${centerX}, ${centerY}`}>
          {/* Day ring background */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={dayRadius}
            stroke="rgba(148, 163, 184, 0.1)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          
          {/* Day ring progress */}
          <AnimatedCircle
            cx={centerX}
            cy={centerY}
            r={dayRadius}
            stroke="url(#dayGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={dayCircumference}
            strokeLinecap="round"
            fill="none"
            animatedProps={dayAnimatedProps}
          />
          
          {/* Hour ring background */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={hourRadius}
            stroke="rgba(148, 163, 184, 0.1)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          
          {/* Hour ring progress */}
          <AnimatedCircle
            cx={centerX}
            cy={centerY}
            r={hourRadius}
            stroke="url(#hourGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={hourCircumference}
            strokeLinecap="round"
            fill="none"
            animatedProps={hourAnimatedProps}
          />
          
          {/* Minute ring background */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={minuteRadius}
            stroke="rgba(148, 163, 184, 0.1)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          
          {/* Minute ring progress */}
          <AnimatedCircle
            cx={centerX}
            cy={centerY}
            r={minuteRadius}
            stroke="url(#minuteGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={minuteCircumference}
            strokeLinecap="round"
            fill="none"
            animatedProps={minuteAnimatedProps}
          />
        </G>
      </Svg>
      
      {/* Center text */}
      <View style={styles.centerText}>
        <Text
          style={[styles.daysText, isMilestone && styles.milestoneGlow]}
          accessibilityLabel={`${days} days clean`}
          accessibilityRole="text"
        >
          {days}
        </Text>
        <Text style={styles.daysLabel}>
          {days === 1 ? 'DAY' : 'DAYS'}
        </Text>
        <Text
          style={styles.timeText}
          accessibilityLabel={`${hours} hours and ${minutes} minutes`}
        >
          {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
        </Text>
      </View>
    </View>
  );
}

// ========================================
// Styles
// ========================================

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysText: {
    fontSize: 72,
    fontWeight: '700',
    color: darkAccent.text.primary,
    letterSpacing: -2,
  },
  milestoneGlow: {
    textShadowColor: darkAccent.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  daysLabel: {
    ...typography.caption,
    fontSize: 14,
    fontWeight: '600',
    color: darkAccent.text.secondary,
    letterSpacing: 2,
    marginTop: -spacing[2],
    marginBottom: spacing[2],
  },
  timeText: {
    ...typography.body,
    fontSize: 18,
    fontWeight: '500',
    color: darkAccent.text.secondary,
    letterSpacing: 1,
  },
});
