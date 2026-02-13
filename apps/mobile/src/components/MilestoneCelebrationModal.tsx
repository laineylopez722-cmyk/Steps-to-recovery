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
  Pressable,
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
import { useThemedStyles, type DS } from '../design-system/hooks/useThemedStyles';
import { useDs, useDsIsDark } from '../design-system/DsProvider';
import { hapticCelebration } from '../utils/haptics';

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
  const ds = useDs();
  const isDark = useDsIsDark();
  const styles = useThemedStyles(createStyles);
  const confettiRef = useRef<ConfettiCannon>(null);

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const badgeScale = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  const triggerHaptic = useCallback((): void => {
    hapticCelebration();
  }, []);

  useEffect(() => {
    if (visible && milestone) {
      scale.value = 0;
      opacity.value = 0;
      badgeScale.value = 0;
      buttonOpacity.value = 0;

      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withDelay(
        100,
        withSpring(1, { damping: 12, stiffness: 150 }, (finished) => {
          if (finished) runOnJS(triggerHaptic)();
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

      const confettiTimeout = setTimeout(() => confettiRef.current?.start(), 300);
      return () => clearTimeout(confettiTimeout);
    } else {
      scale.value = withSpring(0);
      opacity.value = withTiming(0, { duration: 150 });
      return undefined;
    }
  }, [visible, milestone]);

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

  const confettiColors = [
    ds.semantic.intent.primary.solid,
    ds.semantic.intent.success.solid,
    ds.semantic.intent.secondary.solid,
    ds.semantic.intent.warning.solid,
    ds.semantic.intent.alert.solid,
  ];

  if (!milestone) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
        {Platform.OS !== 'web' ? (
          <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={styles.absoluteFill} />
        ) : (
          <View style={[styles.absoluteFill, { backgroundColor: ds.semantic.surface.overlay }]} />
        )}

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

        <Animated.View style={[styles.modalContent, modalAnimatedStyle]}>
          <View style={styles.iconContainer}>
            <Text style={styles.milestoneIcon}>{milestone.icon}</Text>
          </View>

          <Text style={styles.title}>{milestone.title}</Text>
          <Text style={styles.subtitle}>{milestone.description}</Text>

          <Animated.View style={[styles.badge, badgeAnimatedStyle]}>
            <Text style={styles.badgeText}>{milestone.days}</Text>
            <Text style={styles.badgeLabel}>{milestone.days === 1 ? 'Day' : 'Days'} Clean</Text>
          </Animated.View>

          <View style={styles.messageContainer}>
            <Text style={styles.message}>{getEncouragementMessage(milestone.days)}</Text>
          </View>

          <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
            <Pressable
              style={styles.button}
              onPress={onClose}
              accessibilityLabel="Continue your recovery journey"
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Continue Journey</Text>
            </Pressable>
          </Animated.View>

          <Text style={styles.quote}>"Progress, not perfection"</Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function getEncouragementMessage(days: number): string {
  if (days === 1) return "You've taken the most important step. Every journey begins with a single day. Celebrate this victory!";
  if (days <= 7) return "You're building momentum! Each day makes you stronger. Keep going!";
  if (days <= 30) return "Look at how far you've come! Your dedication is inspiring. Recovery is becoming your new normal.";
  if (days <= 90) return "This is a major milestone! You're proving to yourself that lasting change is possible. Be proud!";
  if (days <= 180) return "Your transformation is remarkable! You've built strong foundations for a life in recovery.";
  return "Your journey is an inspiration! You've demonstrated incredible strength and commitment.";
}

const createStyles = (ds: DS) =>
  ({
    overlay: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: ds.space[5],
    },
    absoluteFill: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    modalContent: {
      padding: ds.space[8],
      width: width - 40,
      maxWidth: 400,
      alignItems: 'center' as const,
      backgroundColor: ds.semantic.surface.elevated,
      borderRadius: ds.radius.xl,
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: ds.space[4],
      borderWidth: 4,
      borderColor: ds.semantic.intent.success.solid,
      backgroundColor: ds.semantic.intent.success.subtle,
    },
    milestoneIcon: {
      fontSize: 64,
    },
    title: {
      ...ds.semantic.typography.screenTitle,
      color: ds.semantic.text.primary,
      textAlign: 'center' as const,
      marginBottom: ds.space[2],
    },
    subtitle: {
      ...ds.typography.body,
      color: ds.semantic.text.secondary,
      textAlign: 'center' as const,
      marginBottom: ds.space[6],
    },
    badge: {
      paddingHorizontal: ds.space[6],
      paddingVertical: ds.space[3],
      borderRadius: ds.radius.full,
      marginBottom: ds.space[6],
      alignItems: 'center' as const,
      backgroundColor: ds.semantic.intent.success.solid,
    },
    badgeText: {
      fontSize: 32,
      fontWeight: 'bold' as const,
      color: ds.semantic.text.onDark,
    },
    badgeLabel: {
      ...ds.typography.caption,
      color: ds.semantic.text.onDark,
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
    },
    messageContainer: {
      padding: ds.space[4],
      borderRadius: ds.radius.lg,
      marginBottom: ds.space[6],
      width: '100%' as const,
      backgroundColor: ds.semantic.intent.primary.subtle,
    },
    message: {
      ...ds.typography.body,
      color: ds.semantic.text.primary,
      textAlign: 'center' as const,
      lineHeight: 22,
    },
    buttonContainer: {
      width: '100%' as const,
      marginBottom: ds.space[4],
    },
    button: {
      paddingHorizontal: ds.space[8],
      paddingVertical: ds.space[4],
      borderRadius: ds.radius.lg,
      alignItems: 'center' as const,
      backgroundColor: ds.semantic.intent.success.solid,
    },
    buttonText: {
      ...ds.typography.body,
      color: ds.semantic.text.onDark,
      fontWeight: '600' as const,
    },
    quote: {
      ...ds.typography.caption,
      color: ds.semantic.text.tertiary,
      fontStyle: 'italic' as const,
      textAlign: 'center' as const,
    },
  }) as const;
