/**
 * Milestone Celebration Modal
 *
 * Displays a congratulatory modal when user reaches a recovery milestone.
 * Celebrates achievements with real confetti, haptic feedback, and encouraging messages.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { BlurView } from 'expo-blur';
import type { MilestoneDefinition as Milestone } from '@recovery/shared';
import { useTheme } from '../design-system/hooks/useTheme';
import { hapticCelebration } from '../utils/haptics';
import { ds } from '../design-system/tokens/ds';

interface MilestoneCelebrationModalProps {
  visible: boolean;
  milestone: Milestone | null;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export function MilestoneCelebrationModal({
  visible,
  milestone,
  onClose,
}: MilestoneCelebrationModalProps): React.ReactElement | null {
  const theme = useTheme();
  const confettiRef = useRef<ConfettiCannon>(null);

  // Animation values
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const badgeScale = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  // Trigger haptic celebration
  const triggerHaptic = useCallback((): void => {
    hapticCelebration();
  }, []);

  // Animation sequence when modal becomes visible
  useEffect(() => {
    if (visible && milestone) {
      // Reset animations
      scale.value = 0;
      opacity.value = 0;
      badgeScale.value = 0;
      buttonOpacity.value = 0;

      // Animate in
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withDelay(
        100,
        withSpring(1, { damping: 12, stiffness: 150 }, (finished) => {
          if (finished) {
            runOnJS(triggerHaptic)();
          }
        }),
      );
      badgeScale.value = withDelay(
        400,
        withSequence(
          withSpring(1.2, { damping: 8, stiffness: 200 }),
          withSpring(1, { damping: 10, stiffness: 150 }),
        ),
      );
      buttonOpacity.value = withDelay(600, withTiming(1, { duration: 300 }));

      // Fire confetti
      const confettiTimeout = setTimeout(() => {
        confettiRef.current?.start();
      }, 300);

      return () => clearTimeout(confettiTimeout);
    } else {
      // Reset on close
      scale.value = withSpring(0);
      opacity.value = withTiming(0, { duration: 150 });
      return undefined;
    }
  }, [visible, milestone]);

  // Animated styles
  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  // Generate confetti colors from theme
  const confettiColors = [
    theme.colors.primary,
    theme.colors.success,
    theme.colors.secondary,
    theme.colors.warning,
    ds.colors.warning, // Gold/amber
    ds.semantic.intent.alert.solid, // Coral/red
  ];

  if (!milestone) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
        {Platform.OS !== 'web' ? (
          <BlurView
            intensity={30}
            tint={theme.isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: ds.semantic.surface.overlay }]} />
        )}

        {/* Confetti Cannon */}
        <ConfettiCannon
          ref={confettiRef}
          count={150}
          origin={{ x: width / 2, y: -20 }}
          autoStart={false}
          fadeOut
          fallSpeed={3000}
          explosionSpeed={350}
          colors={confettiColors}
        />

        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.xl,
              ...(theme.isDark ? theme.shadows.lgDark : theme.shadows.lg),
            },
            modalAnimatedStyle,
          ]}
        >
          {/* Milestone Icon */}
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: `${theme.colors.success}15`,
                borderColor: theme.colors.success,
              },
            ]}
          >
            <Text style={styles.milestoneIcon}>{milestone.icon}</Text>
          </View>

          {/* Celebration Message */}
          <Text style={[styles.title, { color: theme.colors.text }, theme.typography.h1]}>
            {milestone.title}
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.textSecondary }, theme.typography.body]}
          >
            {milestone.description}
          </Text>

          {/* Days Badge */}
          <Animated.View
            style={[styles.badge, { backgroundColor: theme.colors.success }, badgeAnimatedStyle]}
          >
            <Text style={[styles.badgeText, theme.typography.h1]}>{milestone.days}</Text>
            <Text style={[styles.badgeLabel, theme.typography.label]}>
              {milestone.days === 1 ? 'Day' : 'Days'} Clean
            </Text>
          </Animated.View>

          {/* Encouragement Message */}
          <View style={[styles.messageContainer, { backgroundColor: `${theme.colors.primary}10` }]}>
            <Text style={[styles.message, { color: theme.colors.text }, theme.typography.body]}>
              {getEncouragementMessage(milestone.days)}
            </Text>
          </View>

          {/* Close Button */}
          <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: theme.colors.success },
                theme.isDark ? theme.shadows.mdDark : theme.shadows.md,
              ]}
              onPress={onClose}
              accessibilityLabel="Continue your recovery journey"
              accessibilityRole="button"
            >
              <Text style={[styles.buttonText, theme.typography.label]}>Continue Journey</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Quote */}
          <Text
            style={[styles.quote, { color: theme.colors.textTertiary }, theme.typography.caption]}
          >
            "Progress, not perfection"
          </Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

/**
 * Get personalized encouragement message based on milestone
 */
function getEncouragementMessage(days: number): string {
  if (days === 1) {
    return "You've taken the most important step. Every journey begins with a single day. Celebrate this victory!";
  }
  if (days <= 7) {
    return "You're building momentum! Each day makes you stronger. Keep going!";
  }
  if (days <= 30) {
    return "Look at how far you've come! Your dedication is inspiring. Recovery is becoming your new normal.";
  }
  if (days <= 90) {
    return "This is a major milestone! You're proving to yourself that lasting change is possible. Be proud!";
  }
  if (days <= 180) {
    return "Your transformation is remarkable! You've built strong foundations for a life in recovery.";
  }
  return "Your journey is an inspiration! You've demonstrated incredible strength and commitment. Celebrate how far you've come!";
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    padding: 32,
    width: width - 40,
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 4,
  },
  milestoneIcon: {
    fontSize: 64,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  badge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: ds.semantic.text.onDark,
    fontWeight: 'bold',
  },
  badgeLabel: {
    color: ds.semantic.text.onDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  messageContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 16,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: ds.semantic.text.onDark,
    fontWeight: '600',
  },
  quote: {
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
