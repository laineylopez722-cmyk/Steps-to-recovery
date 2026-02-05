import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../../design-system/components/GlassCard';
import { darkAccent, gradients, radius, spacing, typography } from '../../../design-system/tokens/modern';
import { useStepProgress } from '../hooks/useStepWork';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

interface Step {
  number: number;
  title: string;
  shortTitle: string;
  description: string;
  color: string;
}

const STEPS: Step[] = [
  { number: 1, title: 'We admitted we were powerless', shortTitle: 'Admit Powerlessness', description: 'Over our addiction - that our lives had become unmanageable.', color: '#EF4444' },
  { number: 2, title: 'Came to believe', shortTitle: 'Believe in Higher Power', description: 'That a Power greater than ourselves could restore us to sanity.', color: '#F59E0B' },
  { number: 3, title: 'Made a decision', shortTitle: 'Turn Will Over', description: 'To turn our will and our lives over to the care of God as we understood Him.', color: '#10B981' },
  { number: 4, title: 'Made a searching', shortTitle: 'Moral Inventory', description: 'And fearless moral inventory of ourselves.', color: '#3B82F6' },
  { number: 5, title: 'Admitted to God', shortTitle: 'Admit Wrongs', description: 'To ourselves, and to another human being the exact nature of our wrongs.', color: '#8B5CF6' },
  { number: 6, title: 'Were entirely ready', shortTitle: 'Ready for Change', description: 'To have God remove all these defects of character.', color: '#EC4899' },
  { number: 7, title: 'Humbly asked Him', shortTitle: 'Ask for Removal', description: 'To remove our shortcomings.', color: '#06B6D4' },
  { number: 8, title: 'Made a list', shortTitle: 'Make a List', description: 'Of all persons we had harmed, and became willing to make amends.', color: '#F97316' },
  { number: 9, title: 'Made direct amends', shortTitle: 'Make Amends', description: 'To such people wherever possible, except when to do so would injure them or others.', color: '#84CC16' },
  { number: 10, title: 'Continued to take', shortTitle: 'Continue Inventory', description: 'Personal inventory and when we were wrong promptly admitted it.', color: '#14B8A6' },
  { number: 11, title: 'Sought through prayer', shortTitle: 'Prayer & Meditation', description: 'And meditation to improve our conscious contact with God.', color: '#6366F1' },
  { number: 12, title: 'Having had a spiritual', shortTitle: 'Spiritual Awakening', description: 'Awakening as the result of these steps, we tried to carry this message.', color: '#A855F7' },
];

export function StepsOverviewScreenModern(): React.ReactElement {
  const navigation = useNavigation();
  const { currentStep, completedSteps } = useStepProgress();

  const completedCount = completedSteps?.length || 0;
  const progressPercent = (completedCount / 12) * 100;

  const handleStepPress = (stepNumber: number) => {
    navigation.navigate('StepDetail', { stepNumber } as any);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[darkAccent.background, darkAccent.surface]} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <Text style={styles.headerTitle} accessibilityRole="header" accessibilityLabel="12 Steps">12 Steps</Text>
          <View style={styles.progressBadge} accessibilityLabel={`${completedCount} of 12 steps completed`}>
            <Text style={styles.progressText}>{completedCount}/12</Text>
          </View>
        </Animated.View>

        {/* Progress Overview */}
        <Animated.View entering={FadeInUp.delay(100)}>
          <GlassCard intensity="medium" style={styles.overviewCard}>
            <View style={styles.overviewHeader}>
              <View>
                <Text style={styles.overviewTitle}>Your Journey</Text>
                <Text style={styles.overviewSubtitle}>
                  {completedCount === 0 
                    ? 'Begin your step work journey'
                    : `${completedCount} steps completed`
                  }
                </Text>
              </View>
              <View style={styles.progressCircle}>
                <Text style={styles.progressPercent}>{Math.round(progressPercent)}%</Text>
              </View>
            </View>
            
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
            </View>

            {/* Current Step Highlight */}
            {currentStep && currentStep <= 12 && (
              <View style={styles.currentStepContainer}>
                <Text style={styles.currentStepLabel}>Currently Working On</Text>
                <Pressable 
                  onPress={() => handleStepPress(currentStep)}
                  style={styles.currentStepButton}
                  accessibilityLabel={`Step ${currentStep}: ${STEPS[currentStep - 1]?.shortTitle}`}
                  accessibilityRole="button"
                  accessibilityHint="Tap to continue working on this step"
                  accessibilityState={{ selected: true }}
                >
                  <View style={[styles.currentStepNumber, { backgroundColor: STEPS[currentStep - 1]?.color }]}>
                    <Text style={styles.currentStepNumberText}>{currentStep}</Text>
                  </View>
                  <View style={styles.currentStepInfo}>
                    <Text style={styles.currentStepTitle}>{STEPS[currentStep - 1]?.shortTitle}</Text>
                    <Text style={styles.currentStepDesc} numberOfLines={1}>
                      {STEPS[currentStep - 1]?.description}
                    </Text>
                  </View>
                  <MaterialIcons name="arrow-forward" size={20} color={darkAccent.text} accessible={false} />
                </Pressable>
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* Steps Grid */}
        <AnimatedScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.stepsContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>All Steps</Text>
          
          <View style={styles.stepsGrid}>
            {STEPS.map((step, index) => {
              const isCompleted = completedSteps?.includes(step.number);
              const isCurrent = currentStep === step.number;
              
              return (
                <Animated.View
                  key={step.number}
                  entering={FadeInUp.delay(150 + index * 30).duration(400)}
                  style={styles.stepItem}
                >
                  <Pressable
                    onPress={() => handleStepPress(step.number)}
                    style={[
                      styles.stepCard,
                      isCompleted && styles.stepCardCompleted,
                      isCurrent && styles.stepCardCurrent,
                    ]}
                    accessibilityLabel={`Step ${step.number}: ${step.shortTitle}`}
                    accessibilityRole="button"
                    accessibilityHint={`${isCompleted ? 'Completed step' : isCurrent ? 'In progress' : 'Not started'}. Tap to view details.`}
                    accessibilityState={{ 
                      selected: isCurrent,
                      disabled: false
                    }}
                  >
                    {/* Step Number */}
                    <View style={[
                      styles.stepNumber,
                      { backgroundColor: isCompleted ? step.color : `${step.color}30` },
                      isCurrent && { shadowColor: step.color, shadowOpacity: 0.5, shadowRadius: 10 },
                    ]}>
                      {isCompleted ? (
                        <MaterialIcons name="check" size={18} color="#FFF" accessible={false} />
                      ) : (
                        <Text style={[styles.stepNumberText, { color: step.color }]}>
                          {step.number}
                        </Text>
                      )}
                    </View>
                    
                    {/* Step Info */}
                    <Text style={styles.stepTitle} numberOfLines={2}>
                      {step.shortTitle}
                    </Text>
                    
                    {/* Status Indicator */}
                    <View style={styles.stepStatus}>
                      {isCurrent && (
                        <View style={[styles.pulseDot, { backgroundColor: step.color }]} />
                      )}
                      <Text style={[styles.stepStatusText, { color: isCompleted ? step.color : darkAccent.textSubtle }]}>
                        {isCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Not Started'}
                      </Text>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
          
          {/* Bottom padding */}
          <View style={{ height: spacing[4] }} />
        </AnimatedScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[3],
    paddingBottom: spacing[2],
  },
  headerTitle: {
    ...typography.h1,
    color: darkAccent.text,
  },
  progressBadge: {
    backgroundColor: `${darkAccent.primary}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  progressText: {
    ...typography.bodySmall,
    color: darkAccent.primary,
    fontWeight: '700',
  },
  overviewCard: {
    marginHorizontal: spacing[3],
    marginBottom: spacing[3],
    padding: spacing[3],
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  overviewTitle: {
    ...typography.h3,
    color: darkAccent.text,
  },
  overviewSubtitle: {
    ...typography.bodySmall,
    color: darkAccent.textMuted,
    marginTop: 2,
  },
  progressCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${darkAccent.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: darkAccent.primary,
  },
  progressPercent: {
    ...typography.h4,
    color: darkAccent.primary,
  },
  progressBarContainer: {
    marginBottom: spacing[3],
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: darkAccent.surfaceHigh,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: darkAccent.primary,
    borderRadius: radius.full,
  },
  currentStepContainer: {
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: darkAccent.border,
  },
  currentStepLabel: {
    ...typography.caption,
    color: darkAccent.textMuted,
    marginBottom: spacing[1.5],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currentStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: darkAccent.surfaceHigh,
    padding: spacing[2],
    borderRadius: radius.lg,
  },
  currentStepNumber: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentStepNumberText: {
    ...typography.h4,
    color: '#FFF',
  },
  currentStepInfo: {
    flex: 1,
  },
  currentStepTitle: {
    ...typography.bodyLarge,
    color: darkAccent.text,
    fontWeight: '600',
  },
  currentStepDesc: {
    ...typography.bodySmall,
    color: darkAccent.textMuted,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  stepsContent: {
    padding: spacing[3],
  },
  sectionTitle: {
    ...typography.h4,
    color: darkAccent.text,
    marginBottom: spacing[2],
  },
  stepsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  stepItem: {
    width: '48%',
  },
  stepCard: {
    backgroundColor: darkAccent.surfaceHigh,
    borderRadius: radius.lg,
    padding: spacing[2.5],
    borderWidth: 1,
    borderColor: darkAccent.border,
  },
  stepCardCompleted: {
    borderColor: `${darkAccent.success}50`,
    backgroundColor: `${darkAccent.success}10`,
  },
  stepCardCurrent: {
    borderColor: darkAccent.primary,
    backgroundColor: `${darkAccent.primary}10`,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[1.5],
  },
  stepNumberText: {
    ...typography.body,
    fontWeight: '700',
  },
  stepTitle: {
    ...typography.bodySmall,
    color: darkAccent.text,
    fontWeight: '600',
    marginBottom: spacing[1.5],
    minHeight: 36,
  },
  stepStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stepStatusText: {
    ...typography.caption,
  },
});
