/**
 * Premium Onboarding Screen
 *
 * Elegant, calming onboarding with Lottie illustrations, smooth step transitions,
 * haptic feedback, glassmorphism, and privacy-first messaging.
 */

import { useState, useCallback, useEffect } from 'react';
import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
  FadeInUp,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { gradients, aestheticColors } from '../../../design-system/tokens/aesthetic';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { GlassCard } from '../../../design-system/components/GlassCard';
import { AmberButton } from '../../../design-system/components/AmberButton';
import { OnboardingIllustration } from '../../../design-system/components/Illustration';
import { hapticLight, hapticMedium, hapticSuccess } from '../../../utils/haptics';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { logger } from '../../../utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

type OnboardingStep = 'welcome' | 'privacy' | 'ready';

interface StepData {
  id: OnboardingStep;
  title: string;
  subtitle: string;
  description: string;
  illustration: OnboardingStep | 'custom';
  primaryAction: string;
  secondaryAction?: string;
}

// ============================================================================
// ONBOARDING DATA
// ============================================================================

const steps: StepData[] = [
  {
    id: 'welcome',
    title: 'Welcome to Recovery',
    subtitle: 'Your journey starts here',
    description:
      'A safe, private space for your recovery journey. Track your progress, journal your thoughts, and connect with support— all with complete privacy.',
    illustration: 'welcome',
    primaryAction: 'Continue',
  },
  {
    id: 'privacy',
    title: 'Privacy First',
    subtitle: 'Your data stays yours',
    description:
      "All your journal entries and personal data are encrypted on your device. We can't read your content— only you hold the key to your recovery story.",
    illustration: 'privacy',
    primaryAction: 'I Understand',
  },
  {
    id: 'ready',
    title: 'Ready to Begin',
    subtitle: 'One day at a time',
    description:
      "Recovery is a journey, not a destination. Take it one day at a time, celebrate small wins, and remember: you're never alone in this.",
    illustration: 'ready',
    primaryAction: 'Get Started',
    secondaryAction: 'Skip Tour',
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

interface OnboardingScreenProps {
  onComplete?: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { user } = useAuth();
  const styles = useThemedStyles(createStyles);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const progress = useSharedValue(0);
  const slideAnim = useSharedValue(0);

  const currentStepData = steps[currentStep] ?? steps[0];

  // Progress animation
  useEffect(() => {
    progress.value = withTiming((currentStep + 1) / steps.length, {
      duration: 400,
    });
  }, [currentStep, progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progress.value, [0, 1], [0, 100], Extrapolate.CLAMP)}%`,
  }));

  const completeOnboarding = useCallback(async () => {
    if (isCompleting) return;

    setIsCompleting(true);

    // Save completion locally first (always works)
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem(`onboarding_complete_${user?.id || 'unknown'}`, 'true');
      logger.info('Onboarding completion saved locally');
    } catch (err) {
      logger.warn('Could not save to AsyncStorage', err);
    }

    // Try Supabase (optional, may fail if table doesn't exist)
    if (user) {
      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (_err) {
        // Ignore Supabase errors - local storage is enough
      }
    }

    setIsCompleting(false);

    // Always signal completion
    onComplete?.();
  }, [user, isCompleting, onComplete]);

  const handleComplete = useCallback(() => {
    hapticSuccess();
    completeOnboarding();
  }, [completeOnboarding]);

  const handleSkip = useCallback(() => {
    hapticLight();
    completeOnboarding();
  }, [completeOnboarding]);

  const handleNext = useCallback(() => {
    if (isAnimating) return;

    hapticMedium();

    if (currentStep < steps.length - 1) {
      setIsAnimating(true);
      slideAnim.value = withTiming(-1, { duration: 300 }, () => {
        slideAnim.value = 1;
        runOnJS(setCurrentStep)((prev: number) => prev + 1);
        slideAnim.value = withTiming(0, { duration: 300 }, () => {
          runOnJS(setIsAnimating)(false);
        });
      });
    } else {
      handleComplete();
    }
  }, [currentStep, isAnimating, handleComplete, slideAnim]);

  const handleBack = useCallback(() => {
    if (isAnimating || currentStep === 0) return;

    hapticLight();
    setIsAnimating(true);
    slideAnim.value = withTiming(1, { duration: 300 }, () => {
      slideAnim.value = -1;
      runOnJS(setCurrentStep)((prev: number) => prev - 1);
      slideAnim.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(setIsAnimating)(false);
      });
    });
  }, [currentStep, isAnimating, slideAnim]);

  // Slide animation styles
  const slideStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      slideAnim.value,
      [-1, 0, 1],
      [SCREEN_WIDTH, 0, -SCREEN_WIDTH],
      Extrapolate.CLAMP,
    );
    const opacity = interpolate(slideAnim.value, [-1, 0, 1], [0, 1, 0], Extrapolate.CLAMP);
    return {
      transform: [{ translateX }],
      opacity,
    };
  });

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <Animated.View style={[styles.progressFill, progressStyle]} />
          </View>

          {/* Skip Button */}
          {currentStep < steps.length - 1 && (
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipButton}
              accessibilityLabel="Skip onboarding"
              accessibilityRole="button"
              accessibilityHint="Go to main app without completing all steps"
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Main Content */}
        <Animated.View style={[styles.contentContainer, slideStyle]}>
          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <OnboardingIllustration step={currentStepData.illustration} size="xl" />
          </View>

          {/* Text Content */}
          <View style={styles.textContainer}>
            <Animated.Text entering={FadeInUp.duration(400).delay(200)} style={styles.subtitle}>
              {currentStepData.subtitle}
            </Animated.Text>

            <Animated.Text entering={FadeInUp.duration(400).delay(300)} style={styles.title}>
              {currentStepData.title}
            </Animated.Text>

            <Animated.Text entering={FadeInUp.duration(400).delay(400)} style={styles.description}>
              {currentStepData.description}
            </Animated.Text>
          </View>
        </Animated.View>

        {/* Bottom Actions */}
        <View style={styles.actionsContainer}>
          <GlassCard intensity="subtle" style={styles.actionCard}>
            {/* Page Indicators */}
            <View style={styles.indicatorsContainer}>
              {steps.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    if (index !== currentStep && !isAnimating) {
                      hapticLight();
                      setIsAnimating(true);
                      const direction = index > currentStep ? -1 : 1;
                      slideAnim.value = withTiming(direction, { duration: 300 }, () => {
                        slideAnim.value = -direction;
                        runOnJS(setCurrentStep)(index);
                        slideAnim.value = withTiming(0, { duration: 300 }, () => {
                          runOnJS(setIsAnimating)(false);
                        });
                      });
                    }
                  }}
                  style={[styles.indicator, index === currentStep && styles.indicatorActive]}
                  accessibilityLabel={`Go to step ${index + 1}: ${steps[index].title}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: index === currentStep }}
                  accessibilityHint={
                    index === currentStep ? 'Current step' : 'Tap to jump to this step'
                  }
                />
              ))}
            </View>

            {/* Primary Action */}
            <AmberButton
              title={isCompleting ? 'Loading...' : currentStepData.primaryAction}
              onPress={handleNext}
              size="lg"
              glow
              fullWidth
              disabled={isCompleting}
              style={styles.primaryButton}
            />

            {/* Secondary Action */}
            {currentStepData.secondaryAction && (
              <TouchableOpacity
                onPress={handleSkip}
                style={styles.secondaryButton}
                accessibilityLabel={currentStepData.secondaryAction}
                accessibilityRole="button"
                accessibilityHint="Skip tour and go to main app"
              >
                <Text style={styles.secondaryButtonText}>{currentStepData.secondaryAction}</Text>
              </TouchableOpacity>
            )}

            {/* Back Button (not on first step) */}
            {currentStep > 0 && (
              <TouchableOpacity
                onPress={handleBack}
                style={styles.backButton}
                accessibilityLabel="Go back to previous step"
                accessibilityRole="button"
                accessibilityHint="Returns to the previous onboarding step"
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            )}
          </GlassCard>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const createStyles = (ds: DS) =>
  ({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
      paddingHorizontal: ds.space[6],
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: ds.space[4],
      marginBottom: ds.space[6],
    },
    progressBackground: {
      flex: 1,
      height: 4,
      backgroundColor: ds.semantic.surface.interactive,
      borderRadius: 2,
      marginRight: ds.space[4],
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: aestheticColors.primary[500],
      borderRadius: 2,
    },
    skipButton: {
      paddingHorizontal: ds.space[3],
      paddingVertical: ds.space[1],
    },
    skipText: {
      fontSize: 14,
      color: aestheticColors.navy[300],
      fontWeight: '500',
    },
    contentContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    illustrationContainer: {
      marginBottom: ds.space[8],
      alignItems: 'center',
    },
    textContainer: {
      alignItems: 'center',
      paddingHorizontal: ds.space[2],
    },
    subtitle: {
      fontSize: 14,
      fontWeight: '600',
      color: aestheticColors.primary[500],
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: ds.space[3],
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
      color: ds.semantic.text.onDark,
      textAlign: 'center',
      marginBottom: ds.space[4],
      lineHeight: 40,
    },
    description: {
      fontSize: 16,
      lineHeight: 26,
      color: aestheticColors.navy[200],
      textAlign: 'center',
      maxWidth: 320,
    },
    actionsContainer: {
      marginTop: 'auto',
      marginBottom: ds.space[4],
    },
    actionCard: {
      padding: ds.space[6],
      borderRadius: ds.radius.xl,
    },
    indicatorsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: ds.space[6],
      gap: ds.space[2],
    },
    indicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: ds.semantic.surface.overlay,
    },
    indicatorActive: {
      width: 24,
      backgroundColor: aestheticColors.primary[500],
    },
    primaryButton: {
      marginBottom: ds.space[4],
    },
    secondaryButton: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    secondaryButtonText: {
      fontSize: 15,
      color: aestheticColors.navy[300],
      fontWeight: '500',
    },
    backButton: {
      alignItems: 'center',
      paddingVertical: 8,
      marginTop: 8,
    },
    backButtonText: {
      fontSize: 14,
      color: aestheticColors.navy[400],
      fontWeight: '500',
    },
  }) as const;
