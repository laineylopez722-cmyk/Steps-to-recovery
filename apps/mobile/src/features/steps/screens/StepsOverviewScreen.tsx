/**
 * Steps Overview Screen
 * 
 * Apple-inspired step progress display.
 * Clean cards, clear hierarchy.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { StepsStackParamList } from '../../../navigation/types';
import { Modal } from '../../../design-system';
import { useStepProgress } from '../hooks/useStepWork';
import { STEP_PROMPTS } from '@recovery/shared';
import { useMotionPress } from '../../../design-system/hooks/useMotionPress';
import { MotionTransitions, motionScale } from '../../../design-system/tokens/motion';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';

type NavigationProp = NativeStackNavigationProp<StepsStackParamList>;

interface StepsOverviewScreenProps {
  userId: string;
}

interface Step {
  number: number;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  { number: 1, title: 'Admit powerlessness', description: 'We admitted we were powerless over our addiction - that our lives had become unmanageable.' },
  { number: 2, title: 'Believe in a higher power', description: 'Came to believe that a Power greater than ourselves could restore us to sanity.' },
  { number: 3, title: 'Decide to turn will over', description: 'Made a decision to turn our will and our lives over to the care of God as we understood Him.' },
  { number: 4, title: 'Make a moral inventory', description: 'Made a searching and fearless moral inventory of ourselves.' },
  { number: 5, title: 'Admit wrongs', description: 'Admitted to God, to ourselves, and to another human being the exact nature of our wrongs.' },
  { number: 6, title: 'Be ready for change', description: 'Were entirely ready to have God remove all these defects of character.' },
  { number: 7, title: 'Ask for removal', description: 'Humbly asked Him to remove our shortcomings.' },
  { number: 8, title: 'Make a list', description: 'Made a list of all persons we had harmed, and became willing to make amends to them all.' },
  { number: 9, title: 'Make amends', description: 'Made direct amends to such people wherever possible, except when to do so would injure them or others.' },
  { number: 10, title: 'Continue inventory', description: 'Continued to take personal inventory and when we were wrong promptly admitted it.' },
  { number: 11, title: 'Seek conscious contact', description: 'Sought through prayer and meditation to improve our conscious contact with God as we understood Him.' },
  { number: 12, title: 'Carry the message', description: 'Having had a spiritual awakening as the result of these steps, we tried to carry this message to addicts.' },
];

// Pulse for current step
function PulseRing() {
  const styles = useThemedStyles(createStyles);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 1200, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.in(Easing.ease) }),
      ),
      -1,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1200 }),
        withTiming(0.5, { duration: 1200 }),
      ),
      -1,
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.pulseRing, style]} />;
}

// Step Card
function StepCard({
  step,
  isCompleted,
  isCurrent,
  isLocked,
  answeredCount,
  totalQuestions,
  onPress,
  delay,
}: {
  step: Step;
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  answeredCount: number;
  totalQuestions: number;
  onPress: () => void;
  delay: number;
}) {
  const { onPressIn, onPressOut, animatedStyle } = useMotionPress({ scaleTo: motionScale.pressCard });
  const styles = useThemedStyles(createStyles);
  const ds = useDs();

  return (
    <Animated.View entering={MotionTransitions.cardEnter(Math.max(0, Math.round((delay - 100) / 50)))}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`Step ${step.number}: ${step.title}`}
        accessibilityHint={isLocked ? 'Locked - coming in a future update' : isCompleted ? `Completed - ${answeredCount} of ${totalQuestions} questions answered` : isCurrent ? `Current step - ${answeredCount} of ${totalQuestions} questions answered` : `View step ${step.number}`}
        accessibilityState={{ disabled: false }}
      >
        <Animated.View style={[
          styles.stepCard,
          isCurrent && styles.stepCardCurrent,
          isCompleted && styles.stepCardCompleted,
          isLocked && styles.stepCardLocked,
          animatedStyle,
        ]}>
          {/* Number Badge */}
          <View style={styles.badgeWrap}>
            {isCurrent && !isCompleted && <PulseRing />}
            <View style={[
              styles.badge,
              isCompleted && styles.badgeCompleted,
              isCurrent && !isCompleted && styles.badgeCurrent,
              isLocked && styles.badgeLocked,
            ]}>
              {isLocked ? (
                <Feather name="lock" size={18} color={ds.colors.textQuaternary} />
              ) : isCompleted ? (
                <Feather name="check" size={22} color={ds.semantic.text.onDark} />
              ) : (
                <Text style={[
                  styles.badgeText,
                  isCurrent && styles.badgeTextCurrent,
                ]}>
                  {step.number}
                </Text>
              )}
            </View>
          </View>

          {/* Content */}
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle} numberOfLines={2}>
                Step {step.number}
              </Text>
              <Feather 
                name={isLocked ? 'lock' : 'chevron-right'} 
                size={18} 
                color={ds.colors.textQuaternary} 
              />
            </View>
            
            <Text style={styles.stepName} numberOfLines={1}>
              {step.title}
            </Text>

            {/* Status */}
            <View style={styles.statusRow}>
              {isCurrent && !isCompleted && (
                <View style={styles.statusBadgeCurrent}>
                  <Text style={styles.statusBadgeTextCurrent}>Current</Text>
                </View>
              )}
              {isCompleted && (
                <View style={styles.statusBadgeComplete}>
                  <Text style={styles.statusBadgeTextComplete}>Complete</Text>
                </View>
              )}
              {isLocked && (
                <View style={styles.statusBadgeLocked}>
                  <Text style={styles.statusBadgeTextLocked}>Coming soon</Text>
                </View>
              )}
            </View>

            {/* Progress */}
            {!isLocked && totalQuestions > 0 && (
              <Text style={styles.progressText}>
                {answeredCount} / {totalQuestions} questions
              </Text>
            )}
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export function StepsOverviewScreen({ userId }: StepsOverviewScreenProps): React.ReactElement {
  const navigation = useNavigation<NavigationProp>();
  const { stepsCompleted, currentStep, overallProgress, stepDetails } = useStepProgress(userId);
  const [lockedStep, setLockedStep] = useState<Step | null>(null);
  const styles = useThemedStyles(createStyles);
  const ds = useDs();

  const stepDetailMap = useMemo(() => {
    return new Map(stepDetails.map((detail) => [detail.stepNumber, detail]));
  }, [stepDetails]);

  const stepTotalsFallback = useMemo(() => {
    return new Map(STEP_PROMPTS.map((step) => [step.step, step.prompts.length]));
  }, []);

  const handleStepPress = (step: Step, isLocked: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (isLocked) {
      setLockedStep(step);
      return;
    }
    navigation.navigate('StepDetail', { stepNumber: step.number });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <Animated.View entering={MotionTransitions.screenEnter()} style={styles.header}>
          <Text style={styles.headerEyebrow}>Step work</Text>
          <Text style={styles.headerTitle}>The 12 Steps</Text>
          <Text style={styles.headerSubtitle}>Your recovery journey, one honest action at a time.</Text>

          {/* Progress */}
          <View style={styles.progressCard}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPercent}>{Math.round(overallProgress)}%</Text>
            </View>
            <View style={styles.progressStats}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{stepsCompleted.length}</Text>
                <Text style={styles.statLabel}>Complete</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{12 - stepsCompleted.length}</Text>
                <Text style={styles.statLabel}>Remaining</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Steps List */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {STEPS.map((step, index) => {
            const detail = stepDetailMap.get(step.number);
            const answeredCount = detail?.answered ?? 0;
            const totalQuestions = detail?.total ?? stepTotalsFallback.get(step.number) ?? 0;
            const completed = stepsCompleted.includes(step.number);
            const isLocked = step.number > 1;
            const current = !isLocked && step.number === currentStep && !completed;

            return (
              <StepCard
                key={step.number}
                step={step}
                isCompleted={completed}
                isCurrent={current}
                isLocked={isLocked}
                answeredCount={answeredCount}
                totalQuestions={totalQuestions}
                onPress={() => handleStepPress(step, isLocked)}
                delay={100 + index * 50}
              />
            );
          })}

          {/* Info */}
          <Animated.View entering={MotionTransitions.fadeDelayed(360)} style={styles.infoCard}>
            <Feather name="info" size={18} color={ds.colors.info} />
            <Text style={styles.infoText}>
              Step 1 is available now. Steps 2-12 unlock in a future update.
            </Text>
          </Animated.View>

          <View style={{ height: ds.space[12] }} />
        </ScrollView>
      </SafeAreaView>

      {/* Locked Modal */}
      <Modal
        visible={!!lockedStep}
        onClose={() => setLockedStep(null)}
        title={lockedStep ? `Step ${lockedStep.number}` : undefined}
        message={lockedStep ? `${lockedStep.description}\n\nComing in a future update.` : undefined}
        actions={[
          {
            title: 'Start Step 1',
            variant: 'primary',
            onPress: () => {
              setLockedStep(null);
              navigation.navigate('StepDetail', { stepNumber: 1 });
            },
          },
          {
            title: 'Close',
            variant: 'outline',
            onPress: () => setLockedStep(null),
          },
        ]}
      />
    </View>
  );
}

const createStyles = (ds: DS) => ({
  container: {
    flex: 1,
    backgroundColor: ds.colors.bgPrimary,
  },
  safe: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: ds.semantic.layout.screenPadding,
    paddingTop: ds.space[5],
    paddingBottom: ds.space[6],
    backgroundColor: ds.semantic.surface.canvas,
  },
  headerEyebrow: {
    ...ds.typography.caption,
    color: ds.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: ds.space[1],
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: ds.colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    ...ds.typography.body,
    color: ds.colors.textTertiary,
    marginTop: ds.space[1],
  },

  // Progress
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ds.semantic.surface.card,
    borderRadius: ds.radius.xl,
    padding: ds.semantic.layout.cardPadding,
    marginTop: ds.space[5],
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
  },
  progressCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ds.colors.successMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 22,
    fontWeight: '700',
    color: ds.colors.success,
  },
  progressStats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: ds.space[4],
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: ds.colors.textPrimary,
  },
  statLabel: {
    ...ds.typography.caption,
    color: ds.colors.textTertiary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: ds.colors.divider,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: ds.semantic.layout.screenPadding,
    paddingTop: ds.space[4],
  },

  // Step Card
  stepCard: {
    flexDirection: 'row',
    backgroundColor: ds.semantic.surface.card,
    borderRadius: ds.radius.lg,
    padding: ds.semantic.layout.cardPadding,
    marginBottom: ds.space[3],
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
  },
  stepCardCurrent: {
    borderWidth: 2,
    borderColor: ds.colors.accent,
  },
  stepCardCompleted: {
    backgroundColor: ds.colors.successMuted,
  },
  stepCardLocked: {
    opacity: 0.7,
  },

  // Badge
  badgeWrap: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ds.colors.accent,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ds.colors.bgQuaternary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeCompleted: {
    backgroundColor: ds.colors.success,
  },
  badgeCurrent: {
    backgroundColor: ds.colors.accent,
  },
  badgeLocked: {
    backgroundColor: ds.colors.bgQuaternary,
  },
  badgeText: {
    fontSize: 20,
    fontWeight: '600',
    color: ds.colors.textTertiary,
  },
  badgeTextCurrent: {
    color: ds.semantic.surface.app,
  },

  // Content
  stepContent: {
    flex: 1,
    marginLeft: ds.space[4],
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepTitle: {
    ...ds.typography.caption,
    color: ds.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepName: {
    ...ds.typography.body,
    fontWeight: '600',
    color: ds.colors.textPrimary,
    marginTop: ds.space[1],
  },

  // Status
  statusRow: {
    flexDirection: 'row',
    gap: ds.space[2],
    marginTop: ds.space[2],
  },
  statusBadgeCurrent: {
    backgroundColor: ds.colors.accentMuted,
    paddingHorizontal: ds.space[2],
    paddingVertical: 2,
    borderRadius: ds.radius.xs,
  },
  statusBadgeTextCurrent: {
    ...ds.typography.micro,
    color: ds.colors.accent,
  },
  statusBadgeComplete: {
    backgroundColor: ds.colors.successMuted,
    paddingHorizontal: ds.space[2],
    paddingVertical: 2,
    borderRadius: ds.radius.xs,
  },
  statusBadgeTextComplete: {
    ...ds.typography.micro,
    color: ds.colors.success,
  },
  statusBadgeLocked: {
    backgroundColor: ds.colors.bgQuaternary,
    paddingHorizontal: ds.space[2],
    paddingVertical: 2,
    borderRadius: ds.radius.xs,
  },
  statusBadgeTextLocked: {
    ...ds.typography.micro,
    color: ds.colors.textQuaternary,
  },

  progressText: {
    ...ds.typography.caption,
    color: ds.colors.textTertiary,
    marginTop: ds.space[2],
  },

  // Info
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: ds.colors.infoMuted,
    borderRadius: ds.radius.lg,
    padding: ds.space[4],
    marginTop: ds.space[4],
    gap: ds.space[3],
  },
  infoText: {
    flex: 1,
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
    lineHeight: 18,
  },
} as const);
