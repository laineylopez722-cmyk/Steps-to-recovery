/**
 * Steps Overview Screen
 *
 * Clean overview: hero card for current step + simple step list.
 * Matches H's prototype design.
 */

import React, { useMemo, useState } from 'react';
import { ScrollView, View, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from '@/platform/haptics';
import type { StepsStackParamList } from '../../../navigation/types';
import { Modal } from '../../../design-system';
import { useStepProgress } from '../hooks/useStepWork';
import { STEP_PROMPTS } from '@recovery/shared';
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
  { number: 1, title: 'We admitted we were powerless', description: 'We admitted we were powerless over our addiction — that our lives had become unmanageable.' },
  { number: 2, title: 'Came to believe in a Power greater', description: 'Came to believe that a Power greater than ourselves could restore us to sanity.' },
  { number: 3, title: 'Made a decision to turn our will', description: 'Made a decision to turn our will and our lives over to the care of God as we understood Him.' },
  { number: 4, title: 'Made a searching and fearless inventory', description: 'Made a searching and fearless moral inventory of ourselves.' },
  { number: 5, title: 'Admitted to God, to ourselves, and to another', description: 'Admitted to God, to ourselves, and to another human being the exact nature of our wrongs.' },
  { number: 6, title: 'Were entirely ready for change', description: 'Were entirely ready to have God remove all these defects of character.' },
  { number: 7, title: 'Humbly asked Him to remove our shortcomings', description: 'Humbly asked Him to remove our shortcomings.' },
  { number: 8, title: 'Made a list of all persons we had harmed', description: 'Made a list of all persons we had harmed, and became willing to make amends to them all.' },
  { number: 9, title: 'Made direct amends', description: 'Made direct amends to such people wherever possible, except when to do so would injure them or others.' },
  { number: 10, title: 'Continued to take personal inventory', description: 'Continued to take personal inventory and when we were wrong promptly admitted it.' },
  { number: 11, title: 'Sought through prayer and meditation', description: 'Sought through prayer and meditation to improve our conscious contact with God as we understood Him.' },
  { number: 12, title: 'Carry this message to others', description: 'Having had a spiritual awakening as the result of these steps, we tried to carry this message to addicts.' },
];

export function StepsOverviewScreen({ userId }: StepsOverviewScreenProps): React.ReactElement {
  const navigation = useNavigation<NavigationProp>();
  const { stepsCompleted, currentStep, stepDetails } = useStepProgress(userId);
  const [lockedStep, setLockedStep] = useState<Step | null>(null);
  const styles = useThemedStyles(createStyles);
  const ds = useDs();

  const stepDetailMap = useMemo(() => {
    return new Map(stepDetails.map((d) => [d.stepNumber, d]));
  }, [stepDetails]);

  const stepTotalsFallback = useMemo(() => {
    return new Map(STEP_PROMPTS.map((s) => [s.step, s.prompts.length]));
  }, []);

  // Current working step info
  const currentStepData = STEPS.find((s) => s.number === currentStep) ?? STEPS[0];
  const currentDetail = stepDetailMap.get(currentStepData.number);
  const currentAnswered = currentDetail?.answered ?? 0;
  const currentTotal = currentDetail?.total ?? stepTotalsFallback.get(currentStepData.number) ?? 0;
  const currentPercent = currentTotal > 0 ? Math.round((currentAnswered / currentTotal) * 100) : 0;
  const isCurrentCompleted = stepsCompleted.includes(currentStepData.number);

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
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Page header */}
          <View style={styles.pageHeader}>
            <Feather name="book-open" size={20} color={ds.colors.accent} importantForAccessibility="no" accessibilityElementsHidden />
            <Text style={styles.pageTitle} accessibilityRole="header">Step Work</Text>
          </View>
          <Text style={styles.pageSubtitle}>
            Work through the 12 steps at your own pace with your sponsor.
          </Text>

          {/* Hero: Currently Working On */}
          <Pressable
            style={styles.heroCard}
            onPress={() => handleStepPress(currentStepData, false)}
            accessibilityRole="button"
            accessibilityLabel={`${isCurrentCompleted ? 'Review' : 'Continue working on'} Step ${currentStepData.number}: ${currentStepData.title}. ${currentPercent}% complete, ${currentAnswered} of ${currentTotal} questions answered`}
          >
            <View style={styles.heroTop} importantForAccessibility="no-hide-descendants">
              <Text style={styles.heroEyebrow}>CURRENTLY WORKING ON</Text>
              <View style={[styles.heroBadge, isCurrentCompleted && styles.heroBadgeComplete]}>
                <Text style={[styles.heroBadgeText, isCurrentCompleted && styles.heroBadgeTextComplete]}>
                  {isCurrentCompleted ? 'Complete' : 'In Progress'}
                </Text>
              </View>
            </View>

            <Text style={styles.heroStepTitle} importantForAccessibility="no">Step {currentStepData.number}</Text>
            <Text style={styles.heroDescription} numberOfLines={2} importantForAccessibility="no">
              {currentStepData.title}
            </Text>

            {/* Progress bar */}
            {currentTotal > 0 && (
              <View style={styles.heroProgressWrap} importantForAccessibility="no-hide-descendants">
                <View style={styles.heroProgressTrack}>
                  <View style={[styles.heroProgressFill, { width: `${currentPercent}%` }]} />
                </View>
                <Text style={styles.heroProgressText}>{currentPercent}%</Text>
              </View>
            )}

            <View style={styles.heroCTA} importantForAccessibility="no-hide-descendants">
              <Text style={styles.heroCTAText}>
                {isCurrentCompleted ? 'Review Step' : 'Continue Working'}
              </Text>
              <Feather name="arrow-right" size={18} color={ds.semantic.text.onDark} />
            </View>
          </Pressable>

          {/* Section label */}
          <Text style={styles.sectionLabel} accessibilityRole="header">All Steps</Text>

          {/* Step rows */}
          {STEPS.map((step) => {
            const detail = stepDetailMap.get(step.number);
            const answeredCount = detail?.answered ?? 0;
            const totalQuestions = detail?.total ?? stepTotalsFallback.get(step.number) ?? 0;
            const completed = stepsCompleted.includes(step.number);
            const prevDetail = step.number > 1 ? stepDetailMap.get(step.number - 1) : undefined;
            const prevPercent = prevDetail
              ? prevDetail.total > 0
                ? Math.round((prevDetail.answered / prevDetail.total) * 100)
                : 0
              : 100;
            const isLocked = step.number > 1 && prevPercent < 50;
            const isCurrent = !isLocked && step.number === currentStep && !completed;

            return (
              <Pressable
                key={step.number}
                style={[styles.stepRow, isCurrent && styles.stepRowCurrent]}
                onPress={() => handleStepPress(step, isLocked)}
                accessibilityRole="button"
                accessibilityLabel={`Step ${step.number}: ${step.title}${completed ? ', completed' : isCurrent ? ', current step' : isLocked ? ', locked' : ''}${!isLocked && totalQuestions > 0 && answeredCount > 0 ? `, ${answeredCount} of ${totalQuestions} answered` : ''}`}
                accessibilityHint={isLocked ? 'Complete 50% of the previous step to unlock' : 'Tap to open'}
                accessibilityState={{ disabled: isLocked }}
              >
                {/* Badge */}
                <View
                  style={[
                    styles.rowBadge,
                    isCurrent && styles.rowBadgeCurrent,
                    completed && styles.rowBadgeCompleted,
                    isLocked && styles.rowBadgeLocked,
                  ]}
                  importantForAccessibility="no-hide-descendants"
                >
                  {isLocked ? (
                    <Feather name="lock" size={16} color={ds.colors.textQuaternary} />
                  ) : completed ? (
                    <Feather name="check" size={18} color={ds.semantic.text.onDark} />
                  ) : (
                    <Text style={[
                      styles.rowBadgeText,
                      isCurrent && styles.rowBadgeTextCurrent,
                    ]}>
                      {step.number}
                    </Text>
                  )}
                </View>

                {/* Text */}
                <View style={styles.rowContent} importantForAccessibility="no-hide-descendants">
                  <View style={styles.rowTitleRow}>
                    <Text style={[styles.rowTitle, isLocked && styles.rowTitleLocked]} numberOfLines={1}>
                      Step {step.number}
                    </Text>
                    {isCurrent && (
                      <View style={styles.currentPill}>
                        <Text style={styles.currentPillText}>Current</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.rowSubtitle, isLocked && styles.rowSubtitleLocked]} numberOfLines={1}>
                    {step.title}
                  </Text>

                  {/* Mini progress for non-locked, non-zero */}
                  {!isLocked && totalQuestions > 0 && answeredCount > 0 && (
                    <View style={styles.rowProgressWrap}>
                      <View style={styles.rowProgressTrack}>
                        <View
                          style={[
                            styles.rowProgressFill,
                            {
                              width: `${Math.round((answeredCount / totalQuestions) * 100)}%`,
                              backgroundColor: completed ? ds.colors.success : ds.colors.accent,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  )}
                </View>

                {/* Chevron */}
                {!isLocked && (
                  <Feather name="chevron-right" size={18} color={ds.colors.textQuaternary} importantForAccessibility="no" />
                )}
              </Pressable>
            );
          })}

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Locked Modal */}
      <Modal
        visible={!!lockedStep}
        onClose={() => setLockedStep(null)}
        title={lockedStep ? `Step ${lockedStep.number}` : undefined}
        message={lockedStep ? `${lockedStep.description}\n\nComplete 50% of the previous step to unlock this one.` : undefined}
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

const createStyles = (ds: DS) =>
  ({
    container: {
      flex: 1,
      backgroundColor: ds.semantic.surface.app,
    },
    safe: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: ds.semantic.layout.screenPadding,
      paddingTop: ds.space[4],
    },

    // Page header
    pageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 4,
    },
    pageTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: ds.colors.textPrimary,
      letterSpacing: -0.3,
    },
    pageSubtitle: {
      ...ds.typography.body,
      color: ds.colors.textTertiary,
      marginBottom: ds.space[5],
      lineHeight: 22,
    },

    // Hero card
    heroCard: {
      backgroundColor: ds.semantic.surface.card,
      borderRadius: ds.radius.xl,
      borderWidth: 1,
      borderColor: ds.colors.accent,
      padding: ds.space[4],
      marginBottom: ds.space[6],
    },
    heroTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    heroEyebrow: {
      ...ds.typography.micro,
      color: ds.colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    heroBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: ds.colors.accentMuted,
    },
    heroBadgeComplete: {
      backgroundColor: ds.colors.successMuted,
    },
    heroBadgeText: {
      ...ds.typography.micro,
      color: ds.colors.accent,
      fontWeight: '700',
    },
    heroBadgeTextComplete: {
      color: ds.colors.success,
    },
    heroStepTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: ds.colors.textPrimary,
      marginBottom: 4,
    },
    heroDescription: {
      ...ds.typography.body,
      color: ds.colors.textSecondary,
      marginBottom: 14,
      lineHeight: 22,
    },
    heroProgressWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14,
    },
    heroProgressTrack: {
      flex: 1,
      height: 6,
      borderRadius: 999,
      backgroundColor: ds.colors.bgTertiary,
      overflow: 'hidden',
    },
    heroProgressFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: ds.colors.accent,
    },
    heroProgressText: {
      ...ds.typography.caption,
      color: ds.colors.accent,
      fontWeight: '700',
      minWidth: 36,
      textAlign: 'right',
    },
    heroCTA: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: ds.colors.accent,
      borderRadius: ds.radius.lg,
      paddingVertical: 14,
    },
    heroCTAText: {
      ...ds.typography.body,
      color: ds.semantic.text.onDark,
      fontWeight: '700',
    },

    // Section label
    sectionLabel: {
      ...ds.typography.h3,
      color: ds.colors.textPrimary,
      fontWeight: '700',
      marginBottom: ds.space[3],
    },

    // Step row
    stepRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: ds.semantic.surface.card,
      borderRadius: ds.radius.lg,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: ds.colors.borderSubtle,
    },
    stepRowCurrent: {
      borderColor: ds.colors.accent,
    },

    // Badge
    rowBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: ds.colors.bgTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    rowBadgeCurrent: {
      backgroundColor: ds.colors.accent,
    },
    rowBadgeCompleted: {
      backgroundColor: ds.colors.success,
    },
    rowBadgeLocked: {
      backgroundColor: ds.colors.bgQuaternary,
    },
    rowBadgeText: {
      fontSize: 16,
      fontWeight: '700',
      color: ds.colors.textTertiary,
    },
    rowBadgeTextCurrent: {
      color: ds.semantic.text.onDark,
    },

    // Row content
    rowContent: {
      flex: 1,
      marginRight: 8,
    },
    rowTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    rowTitle: {
      ...ds.typography.body,
      fontWeight: '700',
      color: ds.colors.textPrimary,
    },
    rowTitleLocked: {
      color: ds.colors.textQuaternary,
    },
    currentPill: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
      backgroundColor: ds.colors.accentMuted,
    },
    currentPillText: {
      ...ds.typography.micro,
      color: ds.colors.accent,
      fontWeight: '700',
    },
    rowSubtitle: {
      ...ds.typography.caption,
      color: ds.colors.textTertiary,
      marginTop: 2,
    },
    rowSubtitleLocked: {
      color: ds.colors.textQuaternary,
    },
    rowProgressWrap: {
      marginTop: 8,
    },
    rowProgressTrack: {
      height: 3,
      borderRadius: 999,
      backgroundColor: ds.colors.bgTertiary,
      overflow: 'hidden',
    },
    rowProgressFill: {
      height: '100%',
      borderRadius: 999,
    },
  }) as const;

