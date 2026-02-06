import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
const SHAPES = ['circle', 'square', 'triangle'] as const;

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  shape: typeof SHAPES[number];
  rotation: number;
  velocityX: number;
  velocityY: number;
}

interface ConfettiCelebrationProps {
  isActive: boolean;
  onComplete?: () => void;
  particleCount?: number;
  duration?: number;
  origin?: { x: number; y: number };
}

function createParticles(count: number, origin: { x: number; y: number }): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: origin.x,
    y: origin.y,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: Math.random() * 10 + 8,
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    rotation: Math.random() * 360,
    velocityX: (Math.random() - 0.5) * 400,
    velocityY: -(Math.random() * 300 + 200),
  }));
}

// Individual confetti piece
function ConfettiPiece({
  particle,
  delay,
  duration,
}: {
  particle: Particle;
  delay: number;
  duration: number;
}) {
  const translateX = useSharedValue(particle.x);
  const translateY = useSharedValue(particle.y);
  const rotation = useSharedValue(particle.rotation);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    // Initial burst
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 10, stiffness: 100 })
    );

    // Physics simulation
    translateX.value = withDelay(
      delay,
      withTiming(particle.x + particle.velocityX, {
        duration,
        easing: Easing.out(Easing.quad),
      })
    );

    translateY.value = withDelay(
      delay,
      withTiming(particle.y + particle.velocityY + 400, {
        duration,
        easing: Easing.in(Easing.quad),
      })
    );

    rotation.value = withDelay(
      delay,
      withTiming(particle.rotation + Math.random() * 720 - 360, {
        duration,
        easing: Easing.linear,
      })
    );

    // Fade out at end
    opacity.value = withDelay(
      delay + duration * 0.7,
      withTiming(0, { duration: duration * 0.3 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  if (particle.shape === 'circle') {
    return (
      <Animated.View
        style={[
          animatedStyle,
          {
            position: 'absolute',
            width: particle.size,
            height: particle.size,
            borderRadius: particle.size / 2,
            backgroundColor: particle.color,
          },
        ]}
      />
    );
  }

  if (particle.shape === 'square') {
    return (
      <Animated.View
        style={[
          animatedStyle,
          {
            position: 'absolute',
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
          },
        ]}
      />
    );
  }

  // Triangle
  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          width: 0,
          height: 0,
          backgroundColor: 'transparent',
          borderStyle: 'solid',
          borderLeftWidth: particle.size / 2,
          borderRightWidth: particle.size / 2,
          borderBottomWidth: particle.size,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: particle.color,
        },
      ]}
    />
  );
}

export function ConfettiCelebration({
  isActive,
  onComplete,
  particleCount = 80,
  duration = 2500,
  origin = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 },
}: ConfettiCelebrationProps): React.ReactElement | null {
  const [particles, setParticles] = React.useState<Particle[]>([]);
  const [showing, setShowing] = React.useState(false);

  useEffect(() => {
    if (isActive && !showing) {
      setShowing(true);
      setParticles(createParticles(particleCount, origin));
      
      // Haptic feedback
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Cleanup
      setTimeout(() => {
        setShowing(false);
        setParticles([]);
        onComplete?.();
      }, duration + 500);
    }
  }, [isActive]);

  if (!showing || particles.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle, index) => (
        <ConfettiPiece
          key={particle.id}
          particle={particle}
          delay={index * 15}
          duration={duration}
        />
      ))}
    </View>
  );
}

// Milestone celebration component
interface MilestoneCelebrationProps {
  milestone: {
    title: string;
    days: number;
    icon: string;
  };
  isVisible: boolean;
  onClose: () => void;
}

import { Text } from 'react-native';
import { GlassCard } from './GlassCard';
import { GradientButton } from './GradientButton';
import { darkAccent, typography } from '../tokens/modern';
import { Platform } from 'react-native';

export function MilestoneCelebration({
  milestone,
  isVisible,
  onClose,
}: MilestoneCelebrationProps): React.ReactElement | null {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      scale.value = withSpring(1, { damping: 12 });
      opacity.value = withTiming(1);
    } else {
      scale.value = withTiming(0);
      opacity.value = withTiming(0);
    }
  }, [isVisible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!isVisible) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <ConfettiCelebration
        isActive={isVisible}
        particleCount={100}
        origin={{ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 3 }}
      />
      
      <Animated.View style={[styles.celebrationCard, animatedStyle]}>
        <GlassCard intensity="heavy" glow glowColor="#FFD700">
          <View style={styles.celebrationContent}>
            <Text style={styles.celebrationEmoji}>{milestone.icon}</Text>
            <Text style={styles.celebrationTitle}>Milestone Reached!</Text>
            <Text style={styles.celebrationMilestone}>{milestone.title}</Text>
            <Text style={styles.celebrationDays}>{milestone.days} Days Clean</Text>
            <Text style={styles.celebrationMessage}>
              Incredible achievement! Your dedication to recovery inspires us all.
            </Text>
            <GradientButton
              title="Celebrate"
              variant="primary"
              size="lg"
              fullWidth
              onPress={onClose}
            />
          </View>
        </GlassCard>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  celebrationCard: {
    width: '100%',
    maxWidth: 340,
  },
  celebrationContent: {
    alignItems: 'center',
    padding: 24,
  },
  celebrationEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  celebrationTitle: {
    ...typography.h2,
    color: darkAccent.text,
    marginBottom: 8,
  },
  celebrationMilestone: {
    ...typography.h3,
    color: '#FFD700',
    marginBottom: 4,
  },
  celebrationDays: {
    ...typography.bodyLarge,
    color: darkAccent.textMuted,
    marginBottom: 16,
  },
  celebrationMessage: {
    ...typography.body,
    color: darkAccent.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
});
