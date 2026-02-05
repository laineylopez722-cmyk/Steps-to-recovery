/**
 * Achievement Unlock Modal Component
 * Celebration modal when achievement is unlocked
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  Share,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  SlideInUp,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withDelay,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '../../../design-system/components/GradientButton';
import {
  darkAccent,
  gradients,
  radius,
  spacing,
  typography,
} from '../../../design-system/tokens/modern';
import {
  getAchievementByKey,
  getRandomAchievementMessage,
  ACHIEVEMENT_COLORS,
} from '@recovery/shared';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AchievementUnlockModalProps {
  visible: boolean;
  achievementKey: string | null;
  onClose: () => void;
  onViewAll?: () => void;
}

export function AchievementUnlockModal({
  visible,
  achievementKey,
  onClose,
  onViewAll,
}: AchievementUnlockModalProps): React.ReactElement {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const shine = useSharedValue(0);

  useEffect(() => {
    if (visible && achievementKey) {
      // Celebration haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Animate entrance
      scale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 300 })
      );

      rotation.value = withSequence(
        withSpring(-10),
        withSpring(10),
        withSpring(0)
      );

      // Shine animation
      shine.value = withDelay(
        500,
        withRepeat(
          withTiming(1, { duration: 1500 }),
          -1,
          true
        )
      );
    } else {
      scale.value = 0;
      rotation.value = 0;
      shine.value = 0;
    }
  }, [visible, achievementKey]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const shineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: shine.value * 0.3,
  }));

  if (!achievementKey) return <></>;

  const achievement = getAchievementByKey(achievementKey);
  if (!achievement) return <></>;

  const message = getRandomAchievementMessage(achievementKey);
  const colors = ACHIEVEMENT_COLORS[achievement.category];

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🎉 I just unlocked "${achievement.title}" in Steps to Recovery! ${achievement.description}`,
      });
    } catch (error) {
      console.error('Error sharing achievement:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <AnimatedPressable
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.backdrop}
          onPress={onClose}
        />

        <Animated.View
          entering={SlideInUp.springify().damping(15)}
          exiting={FadeOut.duration(200)}
          style={styles.modalContent}
        >
          {/* Shine effect */}
          <Animated.View
            style={[styles.shineEffect, shineAnimatedStyle]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shineGradient}
            />
          </Animated.View>

          <LinearGradient
            colors={colors.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            {/* Confetti-like decorations */}
            {[...Array(8)].map((_, i) => (
              <Animated.View
                key={i}
                entering={ZoomIn.delay(i * 100).springify()}
                style={[
                  styles.confetti,
                  {
                    left: `${(i * 12.5) + 10}%`,
                    top: i % 2 === 0 ? 20 : 40,
                  },
                ]}
              >
                <MaterialIcons
                  name={['star', 'favorite', 'emoji-events'][i % 3] as any}
                  size={20}
                  color="rgba(255,255,255,0.4)"
                />
              </Animated.View>
            ))}

            {/* Achievement Icon */}
            <Animated.View
              style={[styles.iconContainer, iconAnimatedStyle]}
            >
              <View style={styles.iconBg}>
                <MaterialIcons
                  name={achievement.icon as any}
                  size={80}
                  color="#FFFFFF"
                />
              </View>
            </Animated.View>

            {/* Title and Message */}
            <Animated.View entering={FadeIn.delay(300)}>
              <Text style={styles.badge}>Achievement Unlocked!</Text>
              <Text style={styles.title}>{achievement.title}</Text>
              <Text style={styles.description}>{achievement.description}</Text>
              <Text style={styles.message}>{message}</Text>
            </Animated.View>

            {/* Actions */}
            <Animated.View
              entering={SlideInUp.delay(500).springify()}
              style={styles.actions}
            >
              <GradientButton
                title="Share Achievement"
                variant="ghost"
                size="md"
                onPress={handleShare}
                icon={<MaterialIcons name="share" size={20} color="#FFFFFF" />}
                style={styles.shareButton}
                accessibilityLabel="Share this achievement"
                accessibilityHint="Opens share dialog to celebrate with others"
              />
              
              {onViewAll && (
                <Pressable
                  onPress={() => {
                    onClose();
                    onViewAll();
                  }}
                  style={styles.viewAllButton}
                  accessibilityLabel="View all achievements"
                  accessibilityRole="button"
                >
                  <Text style={styles.viewAllText}>View All Achievements</Text>
                  <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
                </Pressable>
              )}

              <Pressable
                onPress={onClose}
                style={styles.continueButton}
                accessibilityLabel="Continue"
                accessibilityRole="button"
              >
                <Text style={styles.continueText}>Continue</Text>
              </Pressable>
            </Animated.View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
    borderRadius: radius.xxl,
  },
  shineEffect: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    pointerEvents: 'none',
  },
  shineGradient: {
    flex: 1,
  },
  card: {
    padding: spacing.xxl,
    alignItems: 'center',
    position: 'relative',
  },
  confetti: {
    position: 'absolute',
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  iconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  badge: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: '800',
  },
  description: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    ...typography.h3,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.xl,
    fontWeight: '600',
  },
  actions: {
    width: '100%',
    gap: spacing.md,
  },
  shareButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
  },
  viewAllText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  continueButton: {
    padding: spacing.md,
    alignItems: 'center',
  },
  continueText: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
});
