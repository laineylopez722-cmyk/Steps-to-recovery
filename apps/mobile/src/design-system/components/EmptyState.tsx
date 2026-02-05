import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from './GradientButton';
import { darkAccent, gradients, radius, spacing, typography } from '../tokens/modern';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryAction,
}: EmptyStateProps): React.ReactElement {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const floatY = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12 });
    opacity.value = withTiming(1, { duration: 500 });
    floatY.value = withRepeat(
      withTiming(-10, { duration: 2000 }),
      -1,
      true
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Icon Container */}
      <Animated.View style={[styles.iconContainer, iconStyle]}>
        <LinearGradient
          colors={gradients.primary}
          style={styles.iconGradient}
        >
          <MaterialIcons name={icon as any} size={48} color="#FFF" />
        </LinearGradient>
        
        {/* Decorative circles */}
        <View style={[styles.decorCircle, styles.decorCircle1]} />
        <View style={[styles.decorCircle, styles.decorCircle2]} />
      </Animated.View>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Description */}
      <Text style={styles.description}>{description}</Text>

      {/* Actions */}
      {(actionLabel || secondaryAction) && (
        <View style={styles.actions}>
          {actionLabel && onAction && (
            <GradientButton
              title={actionLabel}
              variant="primary"
              size="md"
              onPress={onAction}
            />
          )}
          {secondaryAction && (
            <GradientButton
              title={secondaryAction.label}
              variant="ghost"
              size="md"
              onPress={secondaryAction.onPress}
            />
          )}
        </View>
      )}
    </Animated.View>
  );
}

// Specialized empty states
export function EmptySearch({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <EmptyState
      icon="search-off"
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try different keywords.`}
      actionLabel="Clear Search"
      onAction={onClear}
    />
  );
}

export function EmptyJournal({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon="auto-stories"
      title="Start Your Journal"
      description="Record your thoughts, track your mood, and monitor your cravings. Your entries are encrypted and private."
      actionLabel="Write First Entry"
      onAction={onCreate}
    />
  );
}

export function EmptyMeetings({ onRefresh }: { onRefresh: () => void }) {
  return (
    <EmptyState
      icon="location-off"
      title="No meetings nearby"
      description="Try expanding your search radius or check back later for meetings in your area."
      actionLabel="Search Again"
      onAction={onRefresh}
    />
  );
}

export function EmptyStepWork({ stepNumber, onStart }: { stepNumber: number; onStart: () => void }) {
  return (
    <EmptyState
      icon="format-list-numbered"
      title={`Step ${stepNumber}`}
      description="Begin working through this step by answering the reflection questions. Take your time - recovery is a journey."
      actionLabel="Start Step Work"
      onAction={onStart}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    minHeight: 400,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: spacing[4],
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: darkAccent.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: `${darkAccent.primary}30`,
  },
  decorCircle1: {
    width: 140,
    height: 140,
    top: -20,
    left: -20,
  },
  decorCircle2: {
    width: 180,
    height: 180,
    top: -40,
    left: -40,
    opacity: 0.5,
  },
  title: {
    ...typography.h3,
    color: darkAccent.text,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  description: {
    ...typography.body,
    color: darkAccent.textMuted,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: spacing[4],
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
});
