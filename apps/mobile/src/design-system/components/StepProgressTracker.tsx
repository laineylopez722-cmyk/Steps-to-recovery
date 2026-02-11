/**
 * StepProgressTracker Component - Material Design 3
 *
 * 12-step progress tracker with horizontal scroll view.
 *
 * Features:
 * - 12 step nodes in horizontal scroll
 * - Nodes: 44dp circles
 *   - Completed: Green checkmark
 *   - Current: Outlined with primary color
 *   - Not started: Gray outline
 * - Connection lines: 2dp between steps
 * - Header showing progress percentage
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { md3LightColors, md3DarkColors } from '../tokens/md3-colors';
import {
  md3ElevationLight,
  md3ElevationDark,
  md3Shape,
  md3Typography,
  md3Motion,
} from '../tokens/md3-elevation';
import { useTheme } from '../hooks/useTheme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);

// ============================================================================
// TYPES
// ============================================================================

export type StepStatus = 'completed' | 'current' | 'not-started';

export interface Step {
  number: number;
  title: string;
  status: StepStatus;
}

export interface StepProgressTrackerProps {
  /** Array of 12 steps with their status */
  steps?: Step[];
  /** Current step number (1-12) */
  currentStep?: number;
  /** Completed step numbers */
  completedSteps?: number[];
  /** Called when a step is pressed */
  onStepPress?: (stepNumber: number) => void;
  /** Show step titles */
  showTitles?: boolean;
  /** Additional container styles */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
  /** Accessibility label override */
  accessibilityLabel?: string;
}

// ============================================================================
// DEFAULT STEPS
// ============================================================================

const DEFAULT_STEP_TITLES = [
  'Honesty',
  'Hope',
  'Faith',
  'Courage',
  'Integrity',
  'Willingness',
  'Humility',
  'Love',
  'Justice',
  'Perseverance',
  'Spiritual Growth',
  'Service',
];

function generateDefaultSteps(currentStep = 1, completedSteps: number[] = []): Step[] {
  return DEFAULT_STEP_TITLES.map((title, index) => {
    const stepNumber = index + 1;
    let status: StepStatus = 'not-started';

    if (completedSteps.includes(stepNumber) || stepNumber < currentStep) {
      status = 'completed';
    } else if (stepNumber === currentStep) {
      status = 'current';
    }

    return {
      number: stepNumber,
      title,
      status,
    };
  });
}

// ============================================================================
// STEP NODE COMPONENT
// ============================================================================

interface StepNodeProps {
  step: Step;
  isLast: boolean;
  onPress: () => void;
  colors: typeof md3LightColors | typeof md3DarkColors;
  isDark: boolean;
}

function StepNode({
  step,
  isLast,
  onPress,
  colors,
  isDark: _isDark,
}: StepNodeProps): React.ReactElement {
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  // Pulse animation for current step
  useEffect(() => {
    if (step.status === 'current') {
      pulseScale.value = withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      );

      // Repeat pulse
      const interval = setInterval(() => {
        pulseScale.value = withSequence(
          withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        );
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [step.status]);

  const handlePressIn = () => {
    scale.value = withTiming(0.9, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, md3Motion.spring.quick);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { scale: step.status === 'current' ? pulseScale.value : 1 },
    ],
  }));

  // Determine colors based on status
  const getNodeColors = () => {
    switch (step.status) {
      case 'completed':
        return {
          background: colors.primary,
          border: colors.primary,
          text: colors.onPrimary,
        };
      case 'current':
        return {
          background: 'transparent',
          border: colors.primary,
          text: colors.primary,
        };
      case 'not-started':
      default:
        return {
          background: 'transparent',
          border: colors.outline,
          text: colors.onSurfaceVariant,
        };
    }
  };

  const nodeColors = getNodeColors();

  return (
    <View style={styles.stepWrapper}>
      <AnimatedTouchable
        style={[
          styles.node,
          {
            backgroundColor: nodeColors.background,
            borderColor: nodeColors.border,
            borderWidth: step.status === 'completed' ? 0 : 2,
          },
          animatedStyle,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessible
        accessibilityLabel={`Step ${step.number}: ${step.title}. Status: ${step.status}`}
        accessibilityRole="button"
        accessibilityState={{
          selected: step.status === 'current',
          disabled: step.status === 'not-started',
        }}
      >
        {step.status === 'completed' ? (
          <Feather name="check" size={20} color={nodeColors.text} />
        ) : (
          <Text style={[styles.nodeNumber, { color: nodeColors.text }]}>{step.number}</Text>
        )}
      </AnimatedTouchable>

      {/* Step Title */}
      <Text
        style={[
          styles.stepTitle,
          {
            color: step.status === 'completed' ? colors.onSurface : colors.onSurfaceVariant,
          },
        ]}
        numberOfLines={1}
      >
        {step.title}
      </Text>

      {/* Connector Line */}
      {!isLast && (
        <View
          style={[
            styles.connector,
            {
              backgroundColor: step.status === 'completed' ? colors.primary : colors.outlineVariant,
            },
          ]}
        />
      )}
    </View>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StepProgressTracker({
  steps: propSteps,
  currentStep = 1,
  completedSteps = [],
  onStepPress,
  showTitles: _showTitles = true,
  style,
  testID,
  accessibilityLabel,
}: StepProgressTrackerProps): React.ReactElement {
  const theme = useTheme();
  const isDark = theme?.isDark ?? false;
  const colors = isDark ? md3DarkColors : md3LightColors;
  const elevation = isDark ? md3ElevationDark : md3ElevationLight;

  const scrollViewRef = useRef<ScrollView>(null);

  // Generate or use provided steps
  const steps = propSteps || generateDefaultSteps(currentStep, completedSteps);

  // Calculate progress
  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const progressPercent = Math.round((completedCount / 12) * 100);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
    headerTranslateY.value = withSpring(0, md3Motion.spring.gentle);
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  // Scroll to current step
  useEffect(() => {
    const currentIndex = steps.findIndex((s) => s.status === 'current');
    if (currentIndex > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: currentIndex * 80 - 100,
          animated: true,
        });
      }, 500);
    }
  }, [steps]);

  const a11yLabel =
    accessibilityLabel ||
    `Step progress: ${completedCount} of 12 steps completed. ${progressPercent} percent complete.`;

  return (
    <AnimatedView
      style={[
        styles.container,
        elevation.level1,
        { backgroundColor: colors.surfaceContainerLow },
        style,
      ]}
      testID={testID}
      accessible
      accessibilityLabel={a11yLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 12,
        now: completedCount,
      }}
    >
      {/* Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryContainer }]}>
            <Feather name="list" size={18} color={colors.onPrimaryContainer} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.onSurface }]}>12-Step Progress</Text>
            <Text style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
              {completedCount}/12 Steps ({progressPercent}%)
            </Text>
          </View>
        </View>

        {/* Progress Ring */}
        <View style={styles.progressRing}>
          <View style={[styles.progressCircle, { borderColor: colors.primary }]}>
            <Text style={[styles.progressText, { color: colors.primary }]}>{progressPercent}%</Text>
          </View>
        </View>
      </Animated.View>

      {/* Steps ScrollView */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        accessibilityLabel="Scroll through the 12 steps"
      >
        {steps.map((step, index) => (
          <StepNode
            key={step.number}
            step={step}
            isLast={index === steps.length - 1}
            onPress={() => onStepPress?.(step.number)}
            colors={colors}
            isDark={isDark}
          />
        ))}
      </ScrollView>
    </AnimatedView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    borderRadius: md3Shape.large,
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: md3Shape.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...md3Typography.titleMedium,
    fontSize: 16,
  } as TextStyle,
  headerSubtitle: {
    ...md3Typography.bodySmall,
    marginTop: 2,
  },
  progressRing: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircle: {
    width: 48,
    height: 48,
    borderRadius: md3Shape.full,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    ...md3Typography.labelMedium,
    fontSize: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 0,
  },
  stepWrapper: {
    alignItems: 'center',
    width: 64,
    marginRight: 16,
  },
  node: {
    width: 44,
    height: 44,
    borderRadius: md3Shape.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  nodeNumber: {
    ...md3Typography.titleMedium,
    fontSize: 16,
  },
  stepTitle: {
    ...md3Typography.labelSmall,
    fontSize: 9,
    textAlign: 'center',
    width: 64,
  },
  connector: {
    position: 'absolute',
    left: 44,
    top: 22,
    width: 32,
    height: 2,
  },
});
