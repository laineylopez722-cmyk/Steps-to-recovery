/**
 * StepProgressTracker Component
 * Horizontal progress tracker for 12-step recovery program
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  AccessibilityInfo,
  useColorScheme,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { COLORS, ANIMATION, DIMENSIONS, TYPOGRAPHY, SPACING } from '../constants';
import type { StepData, StepStatus } from '../types';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export interface StepProgressTrackerProps {
  steps: StepData[];
  currentStep: number;
  onStepPress?: (step: StepData) => void;
  reducedMotion?: boolean;
  testID?: string;
}

export function StepProgressTracker({
  steps,
  currentStep,
  onStepPress,
  reducedMotion = false,
  testID,
}: StepProgressTrackerProps): React.ReactElement {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Animation values
  const headerScale = useSharedValue(0.95);
  const progressFill = useSharedValue(0);

  // Calculate progress
  const completedCount = useMemo(() => {
    return steps.filter((s) => s.status === 'completed').length;
  }, [steps]);

  const progressPercent = useMemo(() => {
    return Math.round((completedCount / 12) * 100);
  }, [completedCount]);

  // Initial animation
  React.useEffect(() => {
    if (!reducedMotion) {
      headerScale.value = withSpring(1, { damping: 12, stiffness: 100 });
      progressFill.value = withTiming(progressPercent / 100, {
        duration: ANIMATION.emphasized,
      });
    } else {
      headerScale.value = 1;
      progressFill.value = progressPercent / 100;
    }
  }, [progressPercent, reducedMotion]);

  // Header animated style
  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
  }));

  // Handle step press
  const handleStepPress = useCallback(
    (step: StepData) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Announce step status
      const statusText =
        step.status === 'completed'
          ? 'completed'
          : step.status === 'current'
          ? 'current step'
          : 'not started';
      AccessibilityInfo.announceForAccessibility(
        `Step ${step.number}: ${step.title}. ${statusText}`
      );

      onStepPress?.(step);
    },
    [onStepPress]
  );

  return (
    <View
      className="p-4 rounded-2xl"
      style={{
        backgroundColor: isDark ? COLORS.darkSurface : COLORS.surface,
      }}
      testID={testID}
    >
      {/* Header */}
      <AnimatedView style={headerStyle}>
        <View className="flex-row justify-between items-center mb-2">
          <Text
            style={{
              fontSize: TYPOGRAPHY.headingMedium.fontSize,
              fontWeight: TYPOGRAPHY.headingMedium.fontWeight,
              color: isDark ? COLORS.white : COLORS.gray900,
            }}
          >
            Step Progress
          </Text>
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: `${COLORS.primary}15` }}
          >
            <Text
              style={{
                fontSize: TYPOGRAPHY.labelLarge.fontSize,
                fontWeight: TYPOGRAPHY.labelLarge.fontWeight,
                color: COLORS.primary,
              }}
            >
              {completedCount}/12
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View className="mb-4">
          <View
            className="h-2 rounded-full overflow-hidden"
            style={{
              backgroundColor: isDark ? COLORS.gray700 : COLORS.surfaceVariant,
            }}
          >
            <Animated.View
              className="h-full rounded-full"
              style={{
                backgroundColor: COLORS.primary,
                width: `${progressPercent}%`,
              }}
            />
          </View>
          <Text
            style={{
              fontSize: TYPOGRAPHY.bodyMedium.fontSize,
              color: isDark ? COLORS.gray400 : COLORS.gray500,
              marginTop: SPACING.xs,
            }}
          >
            {progressPercent}% complete
          </Text>
        </View>
      </AnimatedView>

      {/* Step nodes - horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: SPACING.sm }}
      >
        <View className="flex-row items-center">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              {/* Connection line */}
              {index > 0 && (
                <ConnectionLine
                  prevStatus={steps[index - 1].status}
                  currentStatus={step.status}
                  reducedMotion={reducedMotion}
                />
              )}
              {/* Step node */}
              <StepNode
                step={step}
                isCurrent={step.number === currentStep}
                onPress={() => handleStepPress(step)}
                reducedMotion={reducedMotion}
              />
            </React.Fragment>
          ))}
        </View>
      </ScrollView>

      {/* Current step indicator */}
      <View
        className="mt-4 p-3 rounded-xl"
        style={{
          backgroundColor: isDark ? COLORS.darkSurfaceVariant : COLORS.surfaceVariant,
        }}
      >
        <Text
          style={{
            fontSize: TYPOGRAPHY.labelSmall.fontSize,
            color: isDark ? COLORS.gray400 : COLORS.gray500,
            marginBottom: SPACING.xs,
          }}
        >
          Current Step
        </Text>
        <Text
          style={{
            fontSize: TYPOGRAPHY.bodyLarge.fontSize,
            fontWeight: '600',
            color: isDark ? COLORS.white : COLORS.gray900,
          }}
        >
          Step {currentStep}: {steps.find((s) => s.number === currentStep)?.title || 'Loading...'}
        </Text>
      </View>
    </View>
  );
}

// Step node component
interface StepNodeProps {
  step: StepData;
  isCurrent: boolean;
  onPress: () => void;
  reducedMotion: boolean;
}

function StepNode({ step, isCurrent, onPress, reducedMotion }: StepNodeProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const scale = useSharedValue(1);
  const checkScale = useSharedValue(0);

  React.useEffect(() => {
    if (step.status === 'completed' && !reducedMotion) {
      checkScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    } else {
      checkScale.value = step.status === 'completed' ? 1 : 0;
    }
  }, [step.status, reducedMotion]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  const handlePress = () => {
    if (!reducedMotion) {
      scale.value = withSequence(
        withTiming(0.9, { duration: ANIMATION.accelerated }),
        withSpring(1, { damping: 12, stiffness: 100 })
      );
    }
    onPress();
  };

  // Get node styles based on status
  const getNodeStyles = () => {
    switch (step.status) {
      case 'completed':
        return {
          backgroundColor: COLORS.success,
          borderColor: COLORS.success,
          borderWidth: 0,
        };
      case 'current':
        return {
          backgroundColor: isDark ? COLORS.darkSurface : COLORS.white,
          borderColor: COLORS.primary,
          borderWidth: 3,
        };
      default:
        return {
          backgroundColor: isDark ? COLORS.gray700 : COLORS.surfaceVariant,
          borderColor: isDark ? COLORS.gray600 : COLORS.outlineVariant,
          borderWidth: 1,
        };
    }
  };

  const nodeStyles = getNodeStyles();
  const size = DIMENSIONS.stepNodeSize;

  const accessibilityLabel = `Step ${step.number}${isCurrent ? ', current step' : ''}. ${
    step.status === 'completed' ? 'Completed' : step.status === 'current' ? 'In progress' : 'Not started'
  }. ${step.title}`;

  return (
    <AnimatedTouchable
      onPress={handlePress}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          ...nodeStyles,
        },
        containerStyle,
      ]}
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityHint="Tap to view step details"
    >
      {step.status === 'completed' ? (
        <Animated.View style={checkStyle}>
          <Check size={24} color={COLORS.white} strokeWidth={3} />
        </Animated.View>
      ) : (
        <Text
          style={{
            fontSize: TYPOGRAPHY.labelLarge.fontSize,
            fontWeight: TYPOGRAPHY.labelLarge.fontWeight,
            color:
              step.status === 'current'
                ? COLORS.primary
                : isDark
                ? COLORS.gray400
                : COLORS.gray500,
          }}
        >
          {step.number}
        </Text>
      )}

      {/* Current indicator ring */}
      {isCurrent && (
        <View
          className="absolute -inset-1 rounded-full border-2 border-dashed"
          style={{ borderColor: `${COLORS.primary}50` }}
          pointerEvents="none"
        />
      )}
    </AnimatedTouchable>
  );
}

// Connection line between steps
interface ConnectionLineProps {
  prevStatus: StepStatus;
  currentStatus: StepStatus;
  reducedMotion: boolean;
}

function ConnectionLine({ prevStatus }: ConnectionLineProps) {
  const isCompleted = prevStatus === 'completed';

  return (
    <View
      className="h-0.5 w-4 mx-1"
      style={{
        backgroundColor: isCompleted ? COLORS.success : COLORS.outlineVariant,
        opacity: isCompleted ? 1 : 0.5,
      }}
    />
  );
}

export default StepProgressTracker;
