import React from 'react';
import { Pressable, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, Text, useTheme } from '../../../design-system';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';

interface StepDetailHeaderCardProps {
  stepNumber: number;
  title: string;
  principle: string;
  totalQuestions: number;
  answeredCount: number;
  progressPercent: number;
  showContinue: boolean;
  firstUnansweredQuestion: number;
  onContinue: () => void;
  onReviewAnswers: () => void;
}

export const StepDetailHeaderCard = React.memo(function StepDetailHeaderCard({
  stepNumber,
  title,
  principle,
  totalQuestions,
  answeredCount,
  progressPercent,
  showContinue,
  firstUnansweredQuestion,
  onContinue,
  onReviewAnswers,
}: StepDetailHeaderCardProps): React.ReactElement {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();

  return (
    <Card variant="elevated" style={styles.headerCard}>
      <View style={styles.headerTop}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>{stepNumber}</Text>
        </View>

        <View style={styles.headerContent}>
          <Text style={[theme.typography.caption, styles.eyebrow]}>Step {stepNumber}</Text>
          <Text style={[theme.typography.h2, styles.title]} numberOfLines={2}>
            {title}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <MaterialCommunityIcons name="compass-outline" size={14} color={ds.colors.accent} />
          <Text style={styles.metaPillText} numberOfLines={1}>
            {principle}
          </Text>
        </View>

        <View style={styles.metaPill}>
          <MaterialCommunityIcons name="format-list-numbered" size={14} color={ds.colors.textTertiary} />
          <Text style={styles.metaPillText}>{totalQuestions} prompts</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={[theme.typography.label, { color: ds.colors.textSecondary }]}>Progress</Text>
          <Text style={styles.progressValue}>{answeredCount}/{totalQuestions} • {progressPercent}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(progressPercent, 100))}%` }]} />
        </View>
      </View>

      <View style={styles.actionsRow}>
        {showContinue ? (
          <Pressable
            style={styles.resumeButton}
            onPress={onContinue}
            accessibilityLabel={`Continue at question ${firstUnansweredQuestion}`}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="play-circle-outline" size={18} color={ds.colors.accent} />
            <Text style={styles.resumeText}>Resume at Q{firstUnansweredQuestion}</Text>
          </Pressable>
        ) : (
          <View style={styles.resumePlaceholder} />
        )}

        <View style={styles.reviewButtonWrap}>
          <Button
            title="Review"
            variant="outline"
            size="small"
            onPress={onReviewAnswers}
            accessibilityLabel="Review all answers"
            accessibilityHint="Opens the step review screen"
          />
        </View>
      </View>
    </Card>
  );
});
StepDetailHeaderCard.displayName = 'StepDetailHeaderCard';

const createStyles = (ds: DS) =>
  ({
    headerCard: {
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: ds.colors.borderSubtle,
      backgroundColor: ds.semantic.surface.card,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    stepBadge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      backgroundColor: ds.colors.accent,
    },
    stepBadgeText: {
      fontSize: 20,
      fontWeight: '700',
      color: ds.semantic.text.onDark,
    },
    headerContent: {
      flex: 1,
      gap: 2,
    },
    eyebrow: {
      color: ds.colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    title: {
      color: ds.colors.textPrimary,
      fontWeight: '700',
      lineHeight: 30,
    },
    metaRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 14,
    },
    metaPill: {
      flex: 1,
      minHeight: 32,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: ds.colors.borderSubtle,
      backgroundColor: ds.colors.bgSecondary,
      paddingHorizontal: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    metaPillText: {
      ...ds.typography.caption,
      color: ds.colors.textSecondary,
      fontWeight: '600',
    },
    progressSection: {
      marginBottom: 12,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    progressValue: {
      ...ds.typography.caption,
      color: ds.colors.accent,
      fontWeight: '700',
    },
    progressTrack: {
      height: 8,
      borderRadius: 999,
      overflow: 'hidden',
      backgroundColor: ds.colors.bgTertiary,
    },
    progressFill: {
      height: '100%',
      backgroundColor: ds.colors.accent,
      borderRadius: 999,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    resumeButton: {
      flex: 1,
      minHeight: 40,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: ds.colors.accentMuted,
      backgroundColor: ds.colors.accentMuted,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: 10,
    },
    resumeText: {
      ...ds.typography.bodySm,
      color: ds.colors.accent,
      fontWeight: '700',
    },
    resumePlaceholder: {
      flex: 1,
    },
    reviewButtonWrap: {
      minWidth: 110,
    },
  }) as const;
