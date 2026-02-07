// @ts-nocheck
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  type SharedValue,
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
import {
  darkAccent,
  gradients,
  spacing,
  typography,
  radius,
} from '../../design-system/tokens/modern';
import { useHaptics } from '../../hooks/useHaptics';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

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
    icon: 'favorite',
    title: 'Your recovery companion',
    description: 'Track meetings, cravings, and progress with personalized support.',
    gradient: gradients.primary,
  },
  {
    id: 'safety',
    icon: 'health-and-safety',
    title: 'Stay safe with check-ins',
    description: 'One-tap meeting check-ins, safety plans, and sponsor notifications.',
    gradient: gradients.success,
  },
  {
    id: 'insights',
    icon: 'insights',
    title: 'Insights that guide you',
    description: 'See patterns, celebrate wins, and get gentle nudges to stay on track.',
    gradient: gradients.aurora,
  },
];

function OnboardingPage({
  step,
  index,
  scrollX,
}: {
  step: OnboardingStep;
  index: number;
  scrollX: SharedValue<number>;
}) {
  const inputRange = [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH];

  const imageStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolate.CLAMP),
    transform: [
      { scale: interpolate(scrollX.value, inputRange, [0.8, 1, 0.8], Extrapolate.CLAMP) },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolate.CLAMP),
    transform: [
      {
        translateX: interpolate(
          scrollX.value,
          inputRange,
          [SCREEN_WIDTH * 0.3, 0, -SCREEN_WIDTH * 0.3],
          Extrapolate.CLAMP,
        ),
      },
    ],
  }));

  return (
    <View style={styles.page}>
      <Animated.View style={[styles.iconContainer, imageStyle]}>
        <LinearGradient colors={step.gradient} style={styles.iconGradient}>
          <MaterialIcons name={step.icon as IconName} size={64} color="#FFF" />
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

function PaginationDot({
  index,
  currentIndex,
  onPress,
}: {
  index: number;
  currentIndex: number;
  onPress: () => void;
}) {
  const isActive = index === currentIndex;
  const scale = useSharedValue(1);
  const width = useSharedValue(isActive ? 24 : 8);

  React.useEffect(() => {
    width.value = withSpring(isActive ? 24 : 8);
    scale.value = withSpring(isActive ? 1.2 : 1);
  }, [isActive]);

  const style = useAnimatedStyle(() => ({
    width: width.value,
    transform: [{ scale: scale.value }],
    backgroundColor: isActive ? darkAccent.primary : darkAccent.subtle,
  }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Go to step ${index + 1}`}
    >
      <Animated.View style={[styles.paginationDot, style]} />
    </Pressable>
  );
}

export function OnboardingFlow(): React.ReactElement {
  const scrollX = useSharedValue(0);
  const currentIndex = useSharedValue(0);
  const [_, forceRender] = useState(0);
  const scrollRef = useRef<Animated.FlatList<OnboardingStep>>(null);
  const { medium } = useHaptics();

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      currentIndex.value = Math.round(event.contentOffset.x / SCREEN_WIDTH);
    },
  });

  const handleNext = () => {
    const nextIndex = Math.min(currentIndex.value + 1, ONBOARDING_STEPS.length - 1);
    scrollRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    medium();
    forceRender((v) => v + 1);
  };

  const handleDotPress = (index: number) => {
    scrollRef.current?.scrollToIndex({ index, animated: true });
    medium();
    forceRender((v) => v + 1);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.FlatList
          ref={scrollRef}
          data={ONBOARDING_STEPS}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <OnboardingPage step={item} index={index} scrollX={scrollX} />
          )}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        />

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {ONBOARDING_STEPS.map((_, index) => (
              <PaginationDot
                key={index}
                index={index}
                currentIndex={currentIndex.value}
                onPress={() => handleDotPress(index)}
              />
            ))}
          </View>
          <GradientButton
            title={currentIndex.value === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Continue'}
            variant="primary"
            size="lg"
            fullWidth
            icon={
              currentIndex.value === ONBOARDING_STEPS.length - 1 ? undefined : (
                <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
              )
            }
            iconPosition="right"
            onPress={handleNext}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkAccent.background,
  },
  safeArea: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
    padding: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: radius['2xl'],
    backgroundColor: darkAccent.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  iconGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOrb: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.15,
  },
  textContainer: {
    alignItems: 'center',
    gap: spacing[2],
  },
  title: {
    ...typography.h1,
    color: darkAccent.text,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: darkAccent.textMuted,
    textAlign: 'center',
  },
  pagination: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[3],
    justifyContent: 'center',
  },
  paginationDot: {
    height: 8,
    borderRadius: radius.full,
  },
  footer: {
    padding: spacing[3],
    gap: spacing[2],
  },
});
