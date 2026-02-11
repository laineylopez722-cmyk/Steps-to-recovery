import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Badge, Button, Card, ProgressBar, Text, useTheme } from '../../../design-system';
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
      <View style={styles.header}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>{stepNumber}</Text>
        </View>
        <View style={styles.headerContent}>
          <Text style={[theme.typography.h2, { color: theme.colors.text, fontWeight: '600' }]}>
            Step {stepNumber}: {title}
          </Text>
          <View style={styles.badgeRow}>
            <Badge variant="primary" size="medium" style={styles.principleBadge}>
              {principle}
            </Badge>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, marginLeft: 8 },
              ]}
            >
              {totalQuestions} questions
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={[theme.typography.label, { color: theme.colors.textSecondary }]}>
            Your Progress ({answeredCount}/{totalQuestions})
          </Text>
          <Text style={[theme.typography.h3, { color: ds.colors.accent, fontWeight: '600' }]}>
            {progressPercent}%
          </Text>
        </View>
        <ProgressBar progress={progressPercent / 100} style={styles.progressBar} />
      </View>

      {showContinue && (
        <TouchableOpacity
          style={styles.continueButton}
          onPress={onContinue}
          accessibilityLabel={`Continue at question ${firstUnansweredQuestion}`}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="play-circle-outline" size={20} color={ds.colors.accent} />
          <Text
            style={[
              theme.typography.body,
              { color: ds.colors.accent, marginLeft: 8, fontWeight: '600' },
            ]}
          >
            Continue at Question {firstUnansweredQuestion}
          </Text>
        </TouchableOpacity>
      )}

      <View style={{ marginTop: theme.spacing.sm }}>
        <Button
          title="Review answers"
          variant="secondary"
          size="small"
          onPress={onReviewAnswers}
          accessibilityLabel="Review all answers"
          accessibilityHint="Opens the step review screen"
        />
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
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    stepBadge: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
      backgroundColor: ds.colors.accent,
    },
    stepBadgeText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: ds.semantic.text.onDark,
    },
    headerContent: {
      flex: 1,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    principleBadge: {
      alignSelf: 'flex-start',
    },
    progressSection: {
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: ds.colors.borderSubtle,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    progressBar: {
      height: 8,
    },
    continueButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginTop: 12,
      backgroundColor: ds.colors.accentMuted,
    },
  }) as const;
