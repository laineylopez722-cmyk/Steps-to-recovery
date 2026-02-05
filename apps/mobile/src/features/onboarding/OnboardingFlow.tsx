import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '../../design-system/components/GradientButton';
import { darkAccent, gradients, spacing, typography } from '../../design-system/tokens/modern';
import { useHaptics } from '../../hooks/useHaptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  icon: string;
  title: string;
  description: string;
  gradient: readonly string[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    icon: 'self-improvement',
    title: 'Welcome to Recovery',
    description: 'Your private, secure companion for the 12-step journey. Track your progress, journal your thoughts, and find support.',
    gradient: gradients.primary,
  },
  {
    id: 'privacy',
    icon: 'lock',
    title: 'Privacy First',
    description: 'All your data is encrypted on your device. Only you can read your journal entries. We never sell your data.',
    gradient: gradients.success,
  },
  {
    id: 'tracking',
    icon: 'trending-up',
    title: 'Track Your Progress',
    description: 'Monitor your clean time, celebrate milestones, and visualize your journey with powerful insights.',
    gradient: gradients.ocean,
  },
  {
    id: 'community',
    icon: 'people',
    title: 'Find Support',
    description: 'Discover meetings near you, connect with your sponsor, and share your progress with those you trust.',
    gradient: gradients.aurora,
  },
];

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps): React.ReactElement {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const { medium, success } = useHaptics();
  const scrollRef = useRef<Animated.ScrollView>(null);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleNext = async () => {
    await medium();
    if (currentIndex < ONBOARDING_STEPS.length - 1) {
      scrollRef.current?.scrollTo({
        x: (currentIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      await success();
      onComplete();
    }
  };

  const handleSkip = async () => {
    await medium();
    onComplete();
  };

  const handleDotPress = (index: number) => {
    scrollRef.current?.scrollTo({
      x: index * SCREEN_WIDTH,
      animated: true,
    });
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[darkAccent.background, '#0a0f1c']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrentIndex(index);
          }}
        >
          {ONBOARDING_STEPS.map((step, index) => (
            <OnboardingPage key={step.id} step={step} index={index} scrollX={scrollX} />
          ))}
        </Animated.ScrollView>

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {ONBOARDING_STEPS.map((_, index) => (
              <PaginationDot key={index} index={index} currentIndex={currentIndex} onPress={() => handleDotPress(index)} />
            ))}
          </View>
          <GradientButton
            title={currentIndex === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Continue'}
            variant="primary"
            size="lg"
            fullWidth
            icon={currentIndex === ONBOARDING_STEPS.length - 1 ? undefined : <MaterialIcons name="arrow-forward" size={20} color="#FFF" />}
            iconPosition="right"
            onPress={handleNext}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function OnboardingPage({ step, index, scrollX }: { step: OnboardingStep; index: number; scrollX: Animated.SharedValue<number> }) {
  const inputRange = [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH];

  const imageStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolate.CLAMP),
    transform: [{ scale: interpolate(scrollX.value, inputRange, [0.8, 1, 0.8], Extrapolate.CLAMP) }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolate.CLAMP),
    transform: [{ translateX: interpolate(scrollX.value, inputRange, [SCREEN_WIDTH * 0.3, 0, -SCREEN_WIDTH * 0.3], Extrapolate.CLAMP) }],
  }));

  return (
    <View style={styles.page}>
      <Animated.View style={[styles.iconContainer, imageStyle]}>
        <LinearGradient colors={step.gradient} style={styles.iconGradient}>
          <MaterialIcons name={step.icon as any} size={64} color="#FFF" />
        </LinearGradient>
        <View style={[styles.glowOrb, { backgroundColor: step.gradient[0] }]} />
      </Animated.View>
      <Animated.View style={[styles.textContainer, textStyle]}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>
      </Animated.View>
    </View>
  );
}

function PaginationDot({ index, currentIndex, onPress }: { index: number; currentIndex: number; onPress: () => void }) {
  const isActive = index === currentIndex;
  const scale = useSharedValue(1);
  const width = useSharedValue(isActive ? 24 : 8);

  React.useEffect(() => {
    width.value = withSpring(isActive ? 24 : 8);
    scale.value = withSpring(isActive ? 1.2 : 1);
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.dot, animatedStyle, { backgroundColor: isActive ? darkAccent.primary : darkAccent.textSubtle }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'flex-end', padding: spacing[3] },
  skipButton: { padding: spacing[1.5] },
  skipText: { ...typography.body, color: darkAccent.textMuted, fontWeight: '600' },
  page: { width: SCREEN_WIDTH, flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[4] },
  iconContainer: { position: 'relative', marginBottom: spacing[5] },
  iconGradient: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center', elevation: 10 },
  glowOrb: { position: 'absolute', width: 200, height: 200, borderRadius: 100, opacity: 0.2, top: -30, left: -30, zIndex: -1 },
  textContainer: { alignItems: 'center', maxWidth: 320 },
  title: { ...typography.h2, color: darkAccent.text, textAlign: 'center', marginBottom: spacing[2] },
  description: { ...typography.bodyLarge, color: darkAccent.textMuted, textAlign: 'center', lineHeight: 26 },
  footer: { padding: spacing[4], paddingBottom: spacing[6] },
  pagination: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: spacing[4] },
  dot: { height: 8, borderRadius: 4 },
});
