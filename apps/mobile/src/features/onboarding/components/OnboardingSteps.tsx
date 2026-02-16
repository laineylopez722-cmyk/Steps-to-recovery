/**
 * Enhanced Onboarding Steps Component
 *
 * Multi-step onboarding flow with 7 screens covering welcome, privacy,
 * program selection, sobriety date, daily preferences, notifications,
 * and a ready screen. Features smooth animated transitions, progress
 * dots, and accessibility labels on all interactive elements.
 *
 * @module features/onboarding/components/OnboardingSteps
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, ScrollView, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  FadeInUp,
  runOnJS,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ds } from '../../../design-system/tokens/ds';
import { useAuth } from '../../../contexts/AuthContext';
import { mmkvStorage } from '../../../lib/mmkv';
import { logger } from '../../../utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

type StepId =
  | 'welcome'
  | 'privacy'
  | 'program'
  | 'sobriety-date'
  | 'preferences'
  | 'notifications'
  | 'ready';

interface StepConfig {
  id: StepId;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  skippable: boolean;
}

type ProgramType = 'AA' | 'NA' | 'CA' | 'Al-Anon' | 'SMART' | 'Other';

interface OnboardingSelections {
  program: ProgramType | null;
  sobrietyDate: Date | null;
  isExploring: boolean;
  morningCheckInTime: string;
  eveningCheckInTime: string;
  journalReminder: boolean;
  notificationsEnabled: boolean;
}

interface OnboardingStepsProps {
  onComplete: (selections: OnboardingSelections) => void;
}

// ============================================================================
// STEP DATA
// ============================================================================

const STEPS: StepConfig[] = [
  {
    id: 'welcome',
    icon: 'heart',
    title: 'Your recovery\njourney starts here',
    subtitle: 'A safe, private space for growth',
    color: ds.colors.accent,
    skippable: false,
  },
  {
    id: 'privacy',
    icon: 'lock',
    title: 'Your story\nstays yours',
    subtitle: 'End-to-end encrypted. Zero tracking.',
    color: ds.colors.success,
    skippable: false,
  },
  {
    id: 'program',
    icon: 'compass',
    title: 'Choose your\nprogram',
    subtitle: 'Select your recovery path',
    color: ds.colors.info,
    skippable: true,
  },
  {
    id: 'sobriety-date',
    icon: 'calendar',
    title: 'Your clean date',
    subtitle: 'When did your journey begin?',
    color: ds.colors.accent,
    skippable: true,
  },
  {
    id: 'preferences',
    icon: 'clock',
    title: 'Daily check-ins',
    subtitle: 'Set your reflection schedule',
    color: ds.colors.warning,
    skippable: true,
  },
  {
    id: 'notifications',
    icon: 'bell',
    title: 'Stay on track',
    subtitle: 'Gentle reminders for your routine',
    color: ds.colors.info,
    skippable: true,
  },
  {
    id: 'ready',
    icon: 'sunrise',
    title: "You're all set!",
    subtitle: 'One day at a time',
    color: ds.colors.accent,
    skippable: false,
  },
];

const PROGRAMS: Array<{ id: ProgramType; label: string; icon: keyof typeof Feather.glyphMap }> = [
  { id: 'AA', label: 'Alcoholics Anonymous', icon: 'coffee' },
  { id: 'NA', label: 'Narcotics Anonymous', icon: 'shield' },
  { id: 'CA', label: 'Cocaine Anonymous', icon: 'shield' },
  { id: 'Al-Anon', label: 'Al-Anon', icon: 'users' },
  { id: 'SMART', label: 'SMART Recovery', icon: 'zap' },
  { id: 'Other', label: 'Other / Custom', icon: 'edit-3' },
];

const MOTIVATIONAL_QUOTES: string[] = [
  '"The secret of getting ahead is getting started." — Mark Twain',
  '"It does not matter how slowly you go as long as you do not stop." — Confucius',
  '"Every moment is a fresh beginning." — T.S. Eliot',
  '"One day at a time." — Recovery Wisdom',
  '"You are braver than you believe." — A.A. Milne',
];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ProgressDots({
  total,
  current,
  onDotPress,
}: {
  total: number;
  current: number;
  onDotPress: (index: number) => void;
}): React.ReactElement {
  return (
    <View style={styles.dotsContainer}>
      {Array.from({ length: total }).map((_, index) => {
        const isActive = index === current;
        return (
          <Pressable
            key={index}
            onPress={() => onDotPress(index)}
            hitSlop={12}
            accessibilityLabel={`Step ${index + 1} of ${total}: ${STEPS[index].title.replace('\n', ' ')}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Animated.View
              style={[
                styles.dot,
                {
                  width: isActive ? 28 : 8,
                  backgroundColor: isActive ? ds.colors.accent : ds.colors.bgQuaternary,
                },
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

function ProgramSelector({
  selected,
  onSelect,
}: {
  selected: ProgramType | null;
  onSelect: (program: ProgramType) => void;
}): React.ReactElement {
  return (
    <View style={styles.programGrid}>
      {PROGRAMS.map((program) => {
        const isSelected = selected === program.id;
        return (
          <Pressable
            key={program.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              onSelect(program.id);
            }}
            style={[styles.programOption, isSelected && styles.programOptionSelected]}
            accessibilityLabel={`${program.label}${isSelected ? ', selected' : ''}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <View
              style={[
                styles.programIconBg,
                {
                  backgroundColor: isSelected ? `${ds.colors.accent}20` : ds.colors.bgQuaternary,
                },
              ]}
            >
              <Feather
                name={program.icon}
                size={22}
                color={isSelected ? ds.colors.accent : ds.colors.textTertiary}
              />
            </View>
            <Text
              style={[
                styles.programLabel,
                {
                  color: isSelected ? ds.colors.accent : ds.colors.textSecondary,
                },
              ]}
              numberOfLines={1}
            >
              {program.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function formatTime(h: number, m: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 || 12;
  return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
}

function TimePickerRow({
  label,
  time,
  onTimeChange: _onTimeChange,
}: {
  label: string;
  time: string;
  onTimeChange: (time: string) => void;
}): React.ReactElement {
  const [showPicker, setShowPicker] = useState(false);
  const [hours, minutes] = time.split(':').map(Number);
  const dateValue = new Date();
  dateValue.setHours(hours, minutes, 0, 0);

  return (
    <View style={styles.timeRow}>
      <Text style={styles.timeLabel}>{label}</Text>
      <Pressable
        onPress={() => setShowPicker(true)}
        style={styles.timeButton}
        accessibilityLabel={`${label}: ${formatTime(hours, minutes)}. Tap to change.`}
        accessibilityRole="button"
      >
        <Feather name="clock" size={16} color={ds.colors.accent} />
        <Text style={styles.timeValue}>{formatTime(hours, minutes)}</Text>
      </Pressable>
      {showPicker && (
        <View>
          {Platform.OS === 'ios' || Platform.OS === 'android' ? (
            <Text style={styles.timePickerFallback}>
              Use the time display above to set your preferred time.
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

// ============================================================================
// STEP CONTENT RENDERERS
// ============================================================================

function WelcomeContent(): React.ReactElement {
  return (
    <Animated.View entering={FadeInUp.duration(400).delay(200)} style={styles.stepContent}>
      <Text style={styles.contentText}>
        A safe, private space for your recovery journey. Track your progress, journal your thoughts,
        and connect with support — all with complete privacy.
      </Text>
      <View style={styles.featureList}>
        {[
          { icon: 'edit-3' as const, text: 'Encrypted journaling' },
          { icon: 'trending-up' as const, text: 'Progress tracking' },
          { icon: 'shield' as const, text: 'Complete privacy' },
        ].map((feature) => (
          <View key={feature.text} style={styles.featureRow}>
            <Feather name={feature.icon} size={18} color={ds.colors.accent} />
            <Text style={styles.featureText}>{feature.text}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

function PrivacyContent(): React.ReactElement {
  return (
    <Animated.View entering={FadeInUp.duration(400).delay(200)} style={styles.stepContent}>
      <View style={styles.privacyLockContainer}>
        <View style={styles.privacyLockCircle}>
          <Feather name="lock" size={36} color={ds.colors.success} />
        </View>
      </View>
      <Text style={styles.contentText}>
        All your journal entries and personal data are encrypted on your device with AES-256
        encryption. We can never read your content — only you hold the key.
      </Text>
      <View style={styles.featureList}>
        {[
          { icon: 'shield' as const, text: 'End-to-end encryption' },
          { icon: 'eye-off' as const, text: 'Zero tracking or analytics' },
          { icon: 'database' as const, text: 'Your data, your device' },
        ].map((item) => (
          <View key={item.text} style={styles.featureRow}>
            <Feather name={item.icon} size={18} color={ds.colors.success} />
            <Text style={styles.featureText}>{item.text}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

function ProgramContent({
  selected,
  onSelect,
}: {
  selected: ProgramType | null;
  onSelect: (program: ProgramType) => void;
}): React.ReactElement {
  return (
    <Animated.View entering={FadeInUp.duration(400).delay(200)} style={styles.stepContent}>
      <Text style={styles.contentText}>
        Select the recovery program that fits your journey. You can always change this later.
      </Text>
      <ProgramSelector selected={selected} onSelect={onSelect} />
    </Animated.View>
  );
}

function SobrietyDateContent({
  date,
  isExploring,
  onDateChange,
  onExploringToggle,
}: {
  date: Date | null;
  isExploring: boolean;
  onDateChange: (date: Date) => void;
  onExploringToggle: () => void;
}): React.ReactElement {
  const dateForDisplay = date || new Date();

  const formattedDate = dateForDisplay.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Animated.View entering={FadeInUp.duration(400).delay(200)} style={styles.stepContent}>
      <Text style={styles.contentText}>
        When did your current recovery journey begin? This helps us track your milestones.
      </Text>

      {!isExploring && (
        <Pressable
          onPress={() => {
            // Set today as default if no date selected
            if (!date) {
              onDateChange(new Date());
            }
          }}
          style={styles.datePickerButton}
          accessibilityLabel={
            date ? `Clean date: ${formattedDate}. Tap to change.` : 'Select your clean date'
          }
          accessibilityRole="button"
        >
          <Feather name="calendar" size={20} color={ds.colors.accent} />
          <Text style={styles.datePickerText}>
            {date ? formattedDate : 'Tap to set today as your clean date'}
          </Text>
        </Pressable>
      )}

      <Pressable
        onPress={onExploringToggle}
        style={[styles.exploringToggle, isExploring && styles.exploringToggleActive]}
        accessibilityLabel={`I'm exploring recovery${isExploring ? ', selected' : ''}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isExploring }}
      >
        <Feather
          name={isExploring ? 'check-circle' : 'circle'}
          size={20}
          color={isExploring ? ds.colors.accent : ds.colors.textTertiary}
        />
        <Text
          style={[
            styles.exploringText,
            { color: isExploring ? ds.colors.accent : ds.colors.textSecondary },
          ]}
        >
          I&apos;m exploring recovery
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function PreferencesContent({
  morningTime,
  eveningTime,
  journalReminder,
  onMorningTimeChange,
  onEveningTimeChange,
  onJournalReminderToggle,
}: {
  morningTime: string;
  eveningTime: string;
  journalReminder: boolean;
  onMorningTimeChange: (time: string) => void;
  onEveningTimeChange: (time: string) => void;
  onJournalReminderToggle: () => void;
}): React.ReactElement {
  return (
    <Animated.View entering={FadeInUp.duration(400).delay(200)} style={styles.stepContent}>
      <Text style={styles.contentText}>
        Set your daily reflection times. Consistent check-ins strengthen recovery.
      </Text>

      <View style={styles.preferencesCard}>
        <TimePickerRow
          label="Morning check-in"
          time={morningTime}
          onTimeChange={onMorningTimeChange}
        />
        <View style={styles.divider} />
        <TimePickerRow
          label="Evening check-in"
          time={eveningTime}
          onTimeChange={onEveningTimeChange}
        />
        <View style={styles.divider} />
        <Pressable
          onPress={onJournalReminderToggle}
          style={styles.toggleRow}
          accessibilityLabel={`Daily journal reminder${journalReminder ? ', enabled' : ', disabled'}`}
          accessibilityRole="switch"
          accessibilityState={{ checked: journalReminder }}
        >
          <Text style={styles.timeLabel}>Journal reminder</Text>
          <View style={[styles.toggle, journalReminder && styles.toggleActive]}>
            <View style={[styles.toggleKnob, journalReminder && styles.toggleKnobActive]} />
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function NotificationsContent({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}): React.ReactElement {
  return (
    <Animated.View entering={FadeInUp.duration(400).delay(200)} style={styles.stepContent}>
      <Text style={styles.contentText}>
        Notifications help you stay consistent. We only send reminders you choose — never spam.
      </Text>

      <Pressable
        onPress={onToggle}
        style={[styles.notificationOption, enabled && styles.notificationOptionActive]}
        accessibilityLabel={`Enable notifications${enabled ? ', enabled' : ', disabled'}`}
        accessibilityRole="button"
        accessibilityState={{ selected: enabled }}
      >
        <View style={styles.notificationIconBg}>
          <Feather
            name={enabled ? 'bell' : 'bell-off'}
            size={24}
            color={enabled ? ds.colors.accent : ds.colors.textTertiary}
          />
        </View>
        <View style={styles.notificationTextContainer}>
          <Text style={styles.notificationTitle}>
            {enabled ? 'Notifications On' : 'Enable Notifications'}
          </Text>
          <Text style={styles.notificationSubtitle}>
            {enabled ? "You'll receive gentle daily reminders" : 'Tap to enable check-in reminders'}
          </Text>
        </View>
        <Feather
          name={enabled ? 'check-circle' : 'circle'}
          size={24}
          color={enabled ? ds.colors.accent : ds.colors.textTertiary}
        />
      </Pressable>

      <View style={styles.featureList}>
        {[
          { icon: 'sunrise' as const, text: 'Morning intention reminders' },
          { icon: 'moon' as const, text: 'Evening reflection prompts' },
          { icon: 'award' as const, text: 'Milestone celebrations' },
        ].map((item) => (
          <View key={item.text} style={styles.featureRow}>
            <Feather name={item.icon} size={18} color={ds.colors.info} />
            <Text style={styles.featureText}>{item.text}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

function ReadyContent(): React.ReactElement {
  const quoteRef = useRef(
    MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)],
  );

  return (
    <Animated.View entering={FadeInUp.duration(400).delay(200)} style={styles.stepContent}>
      <View style={styles.readyCheckContainer}>
        <View style={styles.readyCheckCircle}>
          <Feather name="check" size={40} color={ds.colors.accent} />
        </View>
      </View>
      <Text style={styles.contentText}>
        Your recovery companion is ready. Remember, every journey begins with a single step.
      </Text>
      <View style={styles.quoteContainer}>
        <Text style={styles.quoteText}>{quoteRef.current}</Text>
      </View>
    </Animated.View>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OnboardingSteps({ onComplete }: OnboardingStepsProps): React.ReactElement {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const slideAnim = useSharedValue(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const [selections, setSelections] = useState<OnboardingSelections>({
    program: null,
    sobrietyDate: null,
    isExploring: false,
    morningCheckInTime: '08:00',
    eveningCheckInTime: '20:00',
    journalReminder: true,
    notificationsEnabled: false,
  });

  const stepConfig = STEPS[currentStep];

  const saveAndComplete = useCallback(async (): Promise<void> => {
    try {
      mmkvStorage.setItem(`onboarding_complete_${user?.id || 'unknown'}`, 'true');
      mmkvStorage.setItem(
        `onboarding_selections_${user?.id || 'unknown'}`,
        JSON.stringify({
          program: selections.program,
          sobrietyDate: selections.sobrietyDate?.toISOString() || null,
          isExploring: selections.isExploring,
          morningCheckInTime: selections.morningCheckInTime,
          eveningCheckInTime: selections.eveningCheckInTime,
          journalReminder: selections.journalReminder,
          notificationsEnabled: selections.notificationsEnabled,
        }),
      );
      logger.info('Onboarding selections saved', {
        program: selections.program,
        isExploring: selections.isExploring,
      });
    } catch (err) {
      logger.warn('Could not save onboarding selections', err);
    }
    onComplete(selections);
  }, [user, selections, onComplete]);

  const animateToStep = useCallback(
    (targetIndex: number): void => {
      if (isAnimating || targetIndex === currentStep) return;
      if (targetIndex < 0 || targetIndex >= STEPS.length) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setIsAnimating(true);

      const direction = targetIndex > currentStep ? -1 : 1;
      slideAnim.value = withTiming(direction, { duration: 200 }, () => {
        slideAnim.value = -direction;
        runOnJS(setCurrentStep)(targetIndex);
        slideAnim.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(setIsAnimating)(false);
        });
      });
    },
    [currentStep, isAnimating, slideAnim],
  );

  const handleNext = useCallback((): void => {
    if (currentStep < STEPS.length - 1) {
      animateToStep(currentStep + 1);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      saveAndComplete();
    }
  }, [currentStep, animateToStep, saveAndComplete]);

  const handleBack = useCallback((): void => {
    if (currentStep > 0) {
      animateToStep(currentStep - 1);
    }
  }, [currentStep, animateToStep]);

  const handleSkip = useCallback((): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    saveAndComplete();
  }, [saveAndComplete]);

  // Scroll to top on step change
  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentStep]);

  const slideStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      slideAnim.value,
      [-1, 0, 1],
      [SCREEN_WIDTH * 0.3, 0, -SCREEN_WIDTH * 0.3],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(slideAnim.value, [-1, 0, 1], [0, 1, 0], Extrapolation.CLAMP);
    return { transform: [{ translateX }], opacity };
  });

  const renderStepContent = (): React.ReactElement => {
    switch (stepConfig.id) {
      case 'welcome':
        return <WelcomeContent />;
      case 'privacy':
        return <PrivacyContent />;
      case 'program':
        return (
          <ProgramContent
            selected={selections.program}
            onSelect={(program) => setSelections((prev) => ({ ...prev, program }))}
          />
        );
      case 'sobriety-date':
        return (
          <SobrietyDateContent
            date={selections.sobrietyDate}
            isExploring={selections.isExploring}
            onDateChange={(date) =>
              setSelections((prev) => ({ ...prev, sobrietyDate: date, isExploring: false }))
            }
            onExploringToggle={() =>
              setSelections((prev) => ({
                ...prev,
                isExploring: !prev.isExploring,
                sobrietyDate: !prev.isExploring ? null : prev.sobrietyDate,
              }))
            }
          />
        );
      case 'preferences':
        return (
          <PreferencesContent
            morningTime={selections.morningCheckInTime}
            eveningTime={selections.eveningCheckInTime}
            journalReminder={selections.journalReminder}
            onMorningTimeChange={(time) =>
              setSelections((prev) => ({ ...prev, morningCheckInTime: time }))
            }
            onEveningTimeChange={(time) =>
              setSelections((prev) => ({ ...prev, eveningCheckInTime: time }))
            }
            onJournalReminderToggle={() =>
              setSelections((prev) => ({ ...prev, journalReminder: !prev.journalReminder }))
            }
          />
        );
      case 'notifications':
        return (
          <NotificationsContent
            enabled={selections.notificationsEnabled}
            onToggle={() =>
              setSelections((prev) => ({
                ...prev,
                notificationsEnabled: !prev.notificationsEnabled,
              }))
            }
          />
        );
      case 'ready':
        return <ReadyContent />;
    }
  };

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Header: Back + Progress + Skip */}
        <View style={styles.header}>
          {currentStep > 0 ? (
            <Pressable
              onPress={handleBack}
              style={styles.backButton}
              accessibilityLabel="Go back to previous step"
              accessibilityRole="button"
              hitSlop={12}
            >
              <Feather name="arrow-left" size={24} color={ds.colors.textSecondary} />
            </Pressable>
          ) : (
            <View style={styles.backButtonPlaceholder} />
          )}

          <ProgressDots
            total={STEPS.length}
            current={currentStep}
            onDotPress={(index) => animateToStep(index)}
          />

          {!isLastStep && stepConfig.skippable ? (
            <Pressable
              onPress={handleSkip}
              style={styles.skipButton}
              accessibilityLabel="Skip onboarding"
              accessibilityRole="button"
              accessibilityHint="Skip remaining steps and go to the app"
            >
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          ) : (
            <View style={styles.skipButtonPlaceholder} />
          )}
        </View>

        {/* Step Content */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.contentWrapper, slideStyle]}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <View style={[styles.iconBg, { backgroundColor: `${stepConfig.color}15` }]}>
                <Feather name={stepConfig.icon} size={48} color={stepConfig.color} />
              </View>
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.title}>{stepConfig.title}</Text>
            <Text style={styles.subtitle}>{stepConfig.subtitle}</Text>

            {/* Dynamic Content */}
            {renderStepContent()}
          </Animated.View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [styles.continueBtn, pressed && styles.continueBtnPressed]}
            accessibilityLabel={isLastStep ? 'Start your journey' : 'Continue to next step'}
            accessibilityRole="button"
          >
            <Text style={styles.continueText}>{isLastStep ? 'Start Journey' : 'Continue'}</Text>
            {!isLastStep && (
              <Feather
                name="arrow-right"
                size={20}
                color={ds.colors.text}
                style={styles.continueIcon}
              />
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.bgPrimary,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ds.space[5],
    paddingTop: ds.space[2],
    paddingBottom: ds.space[4],
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPlaceholder: {
    width: 48,
  },
  skipButton: {
    paddingHorizontal: ds.space[4],
    paddingVertical: ds.space[2],
    borderRadius: ds.radius.full,
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonPlaceholder: {
    width: 48,
  },
  skipText: {
    ...ds.typography.body,
    color: ds.colors.textTertiary,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: ds.space[2],
    flex: 1,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: ds.space[8],
    paddingBottom: ds.space[8],
  },
  contentWrapper: {
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: ds.space[6],
    marginBottom: ds.space[8],
  },
  iconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: ds.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 40,
    marginBottom: ds.space[3],
  },
  subtitle: {
    ...ds.typography.body,
    color: ds.colors.textTertiary,
    textAlign: 'center',
    marginBottom: ds.space[6],
  },
  stepContent: {
    width: '100%',
    alignItems: 'center',
  },
  contentText: {
    ...ds.typography.body,
    color: ds.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: ds.space[6],
  },
  featureList: {
    width: '100%',
    gap: ds.space[4],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[3],
    paddingVertical: ds.space[2],
  },
  featureText: {
    ...ds.typography.body,
    color: ds.colors.textSecondary,
  },
  // Program selector
  programGrid: {
    width: '100%',
    gap: ds.space[3],
  },
  programOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[3],
    paddingVertical: ds.space[3],
    paddingHorizontal: ds.space[4],
    borderRadius: ds.radius.md,
    borderWidth: 1,
    borderColor: ds.colors.borderDefault,
    backgroundColor: ds.colors.bgTertiary,
    minHeight: 56,
  },
  programOptionSelected: {
    borderColor: ds.colors.accent,
    backgroundColor: `${ds.colors.accent}08`,
  },
  programIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  programLabel: {
    ...ds.typography.body,
    flex: 1,
  },
  // Date picker
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[3],
    paddingVertical: ds.space[4],
    paddingHorizontal: ds.space[5],
    borderRadius: ds.radius.md,
    borderWidth: 1,
    borderColor: ds.colors.borderDefault,
    backgroundColor: ds.colors.bgTertiary,
    width: '100%',
    marginBottom: ds.space[4],
    minHeight: 56,
  },
  datePickerText: {
    ...ds.typography.body,
    color: ds.colors.textSecondary,
  },
  exploringToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[3],
    paddingVertical: ds.space[4],
    paddingHorizontal: ds.space[5],
    borderRadius: ds.radius.md,
    borderWidth: 1,
    borderColor: ds.colors.borderDefault,
    backgroundColor: ds.colors.bgTertiary,
    width: '100%',
    minHeight: 56,
  },
  exploringToggleActive: {
    borderColor: ds.colors.accent,
    backgroundColor: `${ds.colors.accent}08`,
  },
  exploringText: {
    ...ds.typography.body,
    flex: 1,
  },
  // Preferences
  preferencesCard: {
    width: '100%',
    borderRadius: ds.radius.md,
    backgroundColor: ds.colors.bgTertiary,
    borderWidth: 1,
    borderColor: ds.colors.borderDefault,
    overflow: 'hidden',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ds.space[4],
    paddingHorizontal: ds.space[5],
    minHeight: 56,
  },
  timeLabel: {
    ...ds.typography.body,
    color: ds.colors.textSecondary,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[2],
    paddingVertical: ds.space[2],
    paddingHorizontal: ds.space[3],
    borderRadius: ds.radius.sm,
    backgroundColor: ds.colors.bgQuaternary,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
  },
  timeValue: {
    ...ds.typography.bodySm,
    color: ds.colors.accent,
    fontWeight: '600',
  },
  timePickerFallback: {
    ...ds.typography.caption,
    color: ds.colors.textTertiary,
    paddingHorizontal: ds.space[5],
    paddingBottom: ds.space[2],
  },
  divider: {
    height: 1,
    backgroundColor: ds.colors.borderSubtle,
    marginHorizontal: ds.space[5],
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ds.space[4],
    paddingHorizontal: ds.space[5],
    minHeight: 56,
  },
  toggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: ds.colors.bgQuaternary,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: ds.colors.accent,
  },
  toggleKnob: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ds.colors.textPrimary,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  // Notifications
  notificationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[4],
    paddingVertical: ds.space[5],
    paddingHorizontal: ds.space[5],
    borderRadius: ds.radius.md,
    borderWidth: 1,
    borderColor: ds.colors.borderDefault,
    backgroundColor: ds.colors.bgTertiary,
    width: '100%',
    marginBottom: ds.space[6],
    minHeight: 56,
  },
  notificationOptionActive: {
    borderColor: ds.colors.accent,
    backgroundColor: `${ds.colors.accent}08`,
  },
  notificationIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ds.colors.bgQuaternary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    ...ds.typography.body,
    color: ds.colors.textPrimary,
    fontWeight: '600',
  },
  notificationSubtitle: {
    ...ds.typography.caption,
    color: ds.colors.textTertiary,
    marginTop: 2,
  },
  // Privacy
  privacyLockContainer: {
    marginBottom: ds.space[6],
    alignItems: 'center',
  },
  privacyLockCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${ds.colors.success}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Ready
  readyCheckContainer: {
    marginBottom: ds.space[6],
    alignItems: 'center',
  },
  readyCheckCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${ds.colors.accent}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteContainer: {
    paddingVertical: ds.space[5],
    paddingHorizontal: ds.space[5],
    borderRadius: ds.radius.md,
    backgroundColor: ds.colors.bgTertiary,
    borderLeftWidth: 3,
    borderLeftColor: ds.colors.accent,
    width: '100%',
  },
  quoteText: {
    ...ds.typography.bodySm,
    color: ds.colors.textTertiary,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  // Footer
  footer: {
    paddingHorizontal: ds.space[6],
    paddingBottom: ds.space[8],
    paddingTop: ds.space[4],
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ds.colors.accent,
    height: 56,
    borderRadius: 28,
    minHeight: 48,
  },
  continueBtnPressed: {
    opacity: 0.9,
  },
  continueText: {
    fontSize: 18,
    fontWeight: '600',
    color: ds.colors.text,
  },
  continueIcon: {
    marginLeft: 8,
  },
});
