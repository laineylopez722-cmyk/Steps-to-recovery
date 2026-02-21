/**
 * Onboarding Flow
 *
 * Apple-inspired introduction.
 * Bold statements, minimal decoration.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  type SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import * as Haptics from '@/platform/haptics';
import { ds } from '../../design-system/tokens/ds';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  color: string;
}

const STEPS: OnboardingStep[] = [
  {
    id: 'companion',
    icon: 'message-circle',
    title: 'An AI that\nremembers you',
    description: 'Available 24/7. Knows your story.\nNo judgment, just support.',
    color: ds.colors.accent,
  },
  {
    id: 'privacy',
    icon: 'lock',
    title: 'Your story\nstays yours',
    description: 'End-to-end encrypted.\nWe never see your data.',
    color: ds.colors.success,
  },
  {
    id: 'steps',
    icon: 'compass',
    title: 'Real step work',
    description: 'Guided tools for all 12 steps.\nNot day counting — actual recovery.',
    color: ds.colors.info,
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

  const iconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP),
    transform: [
      { scale: interpolate(scrollX.value, inputRange, [0.7, 1, 0.7], Extrapolation.CLAMP) },
      { translateY: interpolate(scrollX.value, inputRange, [30, 0, 30], Extrapolation.CLAMP) },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollX.value, inputRange, [20, 0, 20], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <View
      style={styles.page}
      accessible={true}
      accessibilityLabel={`${step.title.replace('\n', ' ')}. ${step.description.replace('\n', ' ')}`}
      accessibilityRole="summary"
    >
      <Animated.View style={[styles.iconWrap, iconStyle]}>
        <View
          style={[styles.iconBg, { backgroundColor: `${step.color}15` }]}
          accessibilityElementsHidden={true}
          importantForAccessibility="no-hide-descendants"
        >
          <Feather name={step.icon} size={56} color={step.color} />
        </View>
      </Animated.View>

      <Animated.View style={[styles.textWrap, textStyle]}>
        <Text style={styles.title} accessibilityRole="header">
          {step.title}
        </Text>
        <Text style={styles.description}>{step.description}</Text>
      </Animated.View>
    </View>
  );
}

function Dot({
  index,
  currentIndex,
  totalSteps,
  onPress,
}: {
  index: number;
  currentIndex: number;
  totalSteps: number;
  onPress: () => void;
}) {
  const isActive = index === currentIndex;

  const animStyle = useAnimatedStyle(() => ({
    width: withSpring(isActive ? 28 : 8, ds.spring.snappy),
    backgroundColor: withSpring(
      isActive ? ds.colors.accent : ds.colors.bgQuaternary,
      ds.spring.snappy,
    ),
  }));

  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={`Page ${index + 1} of ${totalSteps}${isActive ? ', current' : ''}`}
      accessibilityHint={`Go to page ${index + 1}`}
      style={styles.dotPressable}
    >
      <Animated.View style={[styles.dot, animStyle]} />
    </Pressable>
  );
}

interface OnboardingFlowProps {
  onComplete?: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps): React.ReactElement {
  const scrollX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<Animated.FlatList<OnboardingStep>>(null);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(newIndex);
  };

  const scrollTo = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    scrollRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    if (currentIndex < STEPS.length - 1) {
      scrollTo(currentIndex + 1);
    } else {
      onComplete?.();
    }
  };

  const isLast = currentIndex === STEPS.length - 1;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Skip button */}
        {!isLast && (
          <View style={styles.skipWrap}>
            <Pressable
              onPress={onComplete}
              style={({ pressed }) => [styles.skipBtn, pressed && styles.skipBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Skip onboarding"
              accessibilityHint="Skip to sign in"
            >
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </View>
        )}

        {/* Pages */}
        <Animated.FlatList
          ref={scrollRef}
          data={STEPS}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <OnboardingPage step={item} index={index} scrollX={scrollX} />
          )}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          onMomentumScrollEnd={handleMomentumEnd}
          scrollEventThrottle={16}
        />

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.dots} accessibilityRole="tablist">
            {STEPS.map((_, index) => (
              <Dot
                key={index}
                index={index}
                currentIndex={currentIndex}
                totalSteps={STEPS.length}
                onPress={() => scrollTo(index)}
              />
            ))}
          </View>

          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [styles.continueBtn, pressed && styles.continueBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel={isLast ? 'Get Started' : `Continue to page ${currentIndex + 2}`}
          >
            <Text style={styles.continueText}>{isLast ? 'Get Started' : 'Continue'}</Text>
            {!isLast && (
              <Feather
                name="arrow-right"
                size={20}
                color={ds.colors.text}
                style={{ marginLeft: 8 }}
                accessibilityElementsHidden={true}
                importantForAccessibility="no-hide-descendants"
              />
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.bgPrimary,
  },
  safe: {
    flex: 1,
  },

  // Skip
  skipWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 60,
    paddingRight: ds.space[5],
  },
  skipBtn: {
    paddingHorizontal: ds.space[4],
    paddingVertical: ds.space[2],
    borderRadius: ds.radius.full,
  },
  skipBtnPressed: {
    backgroundColor: ds.colors.bgTertiary,
  },
  skipText: {
    ...ds.typography.body,
    color: ds.colors.textTertiary,
  },

  // Page
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ds.space[8],
  },
  iconWrap: {
    marginBottom: ds.space[10],
  },
  iconBg: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: ds.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 44,
    marginBottom: ds.space[4],
  },
  description: {
    ...ds.typography.body,
    color: ds.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 26,
  },

  // Footer
  footer: {
    paddingHorizontal: ds.sizes.contentPadding,
    paddingBottom: ds.space[8],
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: ds.space[2],
    marginBottom: ds.space[6],
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotPressable: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ds.colors.accent,
    height: 56,
    borderRadius: 28,
  },
  continueBtnPressed: {
    opacity: 0.9,
  },
  continueText: {
    fontSize: 18,
    fontWeight: '600',
    color: ds.colors.text,
  },
});

