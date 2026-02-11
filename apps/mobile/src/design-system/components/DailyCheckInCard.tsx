/**
 * DailyCheckInCard Component - Material Design 3
 *
 * Two-section layout (morning | evening) with progress indicators.
 * States: Incomplete → One done → Both done.
 *
 * Features:
 * - 160dp height card
 * - Two-section layout (morning | evening)
 * - State transitions with visual feedback
 * - CTA badge for incomplete check-ins
 * - Progress indicators for each section
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
  Extrapolation,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { md3LightColors, md3DarkColors } from '../tokens/md3-colors';
import {
  md3ElevationLight,
  md3ElevationDark,
  md3Shape,
  md3Motion,
  md3Typography,
} from '../tokens/md3-elevation';
import { useTheme } from '../hooks/useTheme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// ============================================================================
// TYPES
// ============================================================================

export type CheckInSection = 'morning' | 'evening';

export interface CheckInState {
  morning: boolean;
  evening: boolean;
}

export interface DailyCheckInCardProps {
  /** Current check-in state */
  state: CheckInState;
  /** Called when a section is pressed */
  onSectionPress: (section: CheckInSection) => void;
  /** Morning section label */
  morningLabel?: string;
  /** Evening section label */
  eveningLabel?: string;
  /** Additional container styles */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
  /** Accessibility label override */
  accessibilityLabel?: string;
}

// ============================================================================
// SECTION COMPONENT
// ============================================================================

interface CheckInSectionProps {
  type: CheckInSection;
  isComplete: boolean;
  label: string;
  onPress: () => void;
  colors: typeof md3LightColors | typeof md3DarkColors;
  isDark: boolean;
}

function CheckInSectionComponent({
  type,
  isComplete,
  label,
  onPress,
  colors,
  isDark,
}: CheckInSectionProps): React.ReactElement {
  const iconName = type === 'morning' ? 'sunrise' : 'sunset';
  const scaleValue = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const handlePressIn = () => {
    scaleValue.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    scaleValue.value = withSpring(1, md3Motion.spring.quick);
  };

  return (
    <AnimatedTouchable
      style={[
        styles.section,
        {
          backgroundColor: isComplete ? colors.primaryContainer : colors.surfaceContainerHigh,
          borderWidth: isComplete ? 0 : 1,
          borderColor: isComplete ? 'transparent' : colors.outlineVariant,
        },
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
      accessible
      accessibilityLabel={`${label}: ${isComplete ? 'Complete' : 'Incomplete'}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isComplete }}
    >
      <View style={styles.sectionHeader}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isComplete ? colors.primary : colors.surfaceContainerHighest,
            },
          ]}
        >
          <Feather
            name={iconName}
            size={16}
            color={isComplete ? colors.onPrimary : colors.onSurfaceVariant}
          />
        </View>
        {isComplete && (
          <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
            <Feather name="check" size={12} color={colors.onPrimary} />
          </View>
        )}
      </View>

      <Text
        style={[
          styles.sectionLabel,
          { color: isComplete ? colors.onPrimaryContainer : colors.onSurfaceVariant },
        ]}
      >
        {label}
      </Text>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: isDark ? colors.surfaceContainerHighest : colors.outlineVariant },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: isComplete ? colors.primary : colors.outline,
                width: isComplete ? '100%' : '0%',
              },
            ]}
          />
        </View>
      </View>
    </AnimatedTouchable>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DailyCheckInCard({
  state,
  onSectionPress,
  morningLabel = 'Morning',
  eveningLabel = 'Evening',
  style,
  testID,
  accessibilityLabel,
}: DailyCheckInCardProps): React.ReactElement {
  const theme = useTheme();
  const isDark = theme?.isDark ?? false;
  const colors = isDark ? md3DarkColors : md3LightColors;
  const elevation = isDark ? md3ElevationDark : md3ElevationLight;

  const { morning, evening } = state;
  const completedCount = (morning ? 1 : 0) + (evening ? 1 : 0);
  const isFullyComplete = completedCount === 2;

  // Animation values
  const cardScale = useSharedValue(0.95);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    cardScale.value = withSpring(1, md3Motion.spring.gentle);
    cardOpacity.value = withTiming(1, { duration: 400 });
  }, []);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  // Determine card background based on completion
  const cardBackground = isFullyComplete ? colors.primaryContainer : colors.surfaceContainerLow;

  // CTA badge text
  const ctaText =
    completedCount === 0 ? 'Complete today' : completedCount === 1 ? 'One more to go' : 'All done!';

  const a11yLabel =
    accessibilityLabel ||
    `Daily check-in. ${morning ? 'Morning complete.' : 'Morning pending.'} ${evening ? 'Evening complete.' : 'Evening pending.'}`;

  return (
    <Animated.View
      style={[
        styles.container,
        elevation.level2,
        { backgroundColor: cardBackground },
        cardAnimatedStyle,
        style,
      ]}
      testID={testID}
      accessible
      accessibilityLabel={a11yLabel}
      accessibilityRole="summary"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.headerIcon,
              { backgroundColor: isFullyComplete ? colors.primary : colors.secondaryContainer },
            ]}
          >
            <Feather
              name="check-circle"
              size={18}
              color={isFullyComplete ? colors.onPrimary : colors.onSecondaryContainer}
            />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Daily Check-In</Text>
            <Text style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
              {completedCount}/2 completed
            </Text>
          </View>
        </View>

        {/* CTA Badge */}
        <View
          style={[
            styles.ctaBadge,
            {
              backgroundColor: isFullyComplete ? colors.primary : colors.secondaryContainer,
            },
          ]}
        >
          <Text
            style={[
              styles.ctaText,
              {
                color: isFullyComplete ? colors.onPrimary : colors.onSecondaryContainer,
              },
            ]}
          >
            {ctaText}
          </Text>
        </View>
      </View>

      {/* Sections */}
      <View style={styles.sectionsContainer}>
        <CheckInSectionComponent
          type="morning"
          isComplete={morning}
          label={morningLabel}
          onPress={() => onSectionPress('morning')}
          colors={colors}
          isDark={isDark}
        />

        <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

        <CheckInSectionComponent
          type="evening"
          isComplete={evening}
          label={eveningLabel}
          onPress={() => onSectionPress('evening')}
          colors={colors}
          isDark={isDark}
        />
      </View>

      {/* Overall progress bar */}
      <View style={styles.overallProgressContainer}>
        <View
          style={[
            styles.overallProgressTrack,
            { backgroundColor: isDark ? colors.surfaceContainerHighest : colors.outlineVariant },
          ]}
        >
          <Animated.View
            style={[
              styles.overallProgressFill,
              {
                backgroundColor: isFullyComplete ? colors.primary : colors.secondary,
                width: `${(completedCount / 2) * 100}%`,
              },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    borderRadius: md3Shape.large,
    padding: 16,
    height: 160,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
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
  ctaBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: md3Shape.full,
  },
  ctaText: {
    ...md3Typography.labelMedium,
    fontSize: 12,
  },
  sectionsContainer: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  section: {
    flex: 1,
    borderRadius: md3Shape.medium,
    padding: 12,
    justifyContent: 'space-between',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: md3Shape.small,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: md3Shape.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionLabel: {
    ...md3Typography.labelMedium,
    marginTop: 8,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressTrack: {
    height: 4,
    borderRadius: md3Shape.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: md3Shape.full,
  },
  divider: {
    width: 1,
    marginVertical: 4,
  },
  overallProgressContainer: {
    marginTop: 12,
  },
  overallProgressTrack: {
    height: 6,
    borderRadius: md3Shape.full,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    borderRadius: md3Shape.full,
  },
});
