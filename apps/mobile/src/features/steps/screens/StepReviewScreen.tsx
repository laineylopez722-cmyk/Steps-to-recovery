/**
 * Step Review Screen
 * Review all answers for a step and export to PDF.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { FlatList, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { STEP_PROMPTS, type StepPrompt, type StepSection } from '@recovery/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useStepWork } from '../hooks/useStepWork';
import { logger } from '@/utils/logger';
import {
  Badge,
  Button,
  Card,
  Divider,
  ProgressBar,
  Text,
  Toast,
  type ToastVariant,
  useTheme,
} from '@/design-system';
import { useThemedStyles, type DS } from '@/design-system/hooks/useThemedStyles';
import { useDs } from '@/design-system/DsProvider';
import type { StepsStackParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<StepsStackParamList>;
type StepReviewRoute = RouteProp<StepsStackParamList, 'StepReview'>;

interface ReviewSectionItem {
  type: 'section';
  title: string;
  questionRange: string;
}

interface ReviewQuestionItem {
  type: 'question';
  questionNumber: number;
  prompt: string;
  sectionTitle?: string;
}

type ReviewItem = ReviewSectionItem | ReviewQuestionItem;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildStepWorkHtml(params: {
  ds: DS;
  stepData: StepPrompt;
  answersByNumber: Map<number, string>;
  answeredCount: number;
  totalQuestions: number;
  exportedAt: string;
}): string {
  const { ds, stepData, answersByNumber, answeredCount, totalQuestions, exportedAt } = params;
  const sections = stepData.sections?.length
    ? stepData.sections
    : [
        {
          title: 'Questions',
          prompts: stepData.prompts,
        } satisfies StepSection,
      ];

  let questionIndex = 0;
  const sectionsHtml = sections
    .map((section) => {
      const questionsHtml = section.prompts
        .map((prompt) => {
          questionIndex += 1;
          const answer = answersByNumber.get(questionIndex);
          const answerHtml = answer
            ? escapeHtml(answer).replace(/\n/g, '<br />')
            : '<span class="unanswered">Not answered yet</span>';

          return `
            <div class="question">
              <div class="question-title">Question ${questionIndex}</div>
              <div class="prompt">${escapeHtml(prompt)}</div>
              <div class="answer">${answerHtml}</div>
            </div>
          `;
        })
        .join('');

      return `
        <section class="section">
          <h2>${escapeHtml(section.title)}</h2>
          ${questionsHtml}
        </section>
      `;
    })
    .join('');

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            color: ${ds.colors.text};
            padding: 24px;
            line-height: 1.6;
          }
          h1 {
            font-size: 24px;
            margin: 0 0 4px 0;
          }
          h2 {
            font-size: 18px;
            margin: 24px 0 12px 0;
            color: ${ds.colors.textSecondary};
          }
          .meta {
            font-size: 12px;
            color: ${ds.colors.textTertiary};
            margin-bottom: 16px;
          }
          .summary {
            background: ${ds.colors.bgSecondary};
            border: 1px solid ${ds.colors.borderSubtle};
            border-radius: 12px;
            padding: 12px 16px;
            margin: 16px 0 24px 0;
          }
          .question {
            border: 1px solid ${ds.colors.borderSubtle};
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 16px;
          }
          .question-title {
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: ${ds.colors.textTertiary};
            margin-bottom: 6px;
          }
          .prompt {
            font-weight: 600;
            margin-bottom: 8px;
          }
          .answer {
            font-size: 14px;
            color: ${ds.colors.text};
          }
          .unanswered {
            color: ${ds.colors.textMuted};
            font-style: italic;
          }
          .footer {
            margin-top: 32px;
            font-size: 11px;
            color: ${ds.colors.textTertiary};
          }
        </style>
      </head>
      <body>
        <h1>Step ${stepData.step} Review</h1>
        <div class="meta">${escapeHtml(stepData.title)} - ${escapeHtml(stepData.principle)}</div>
        <div class="meta">Exported ${escapeHtml(exportedAt)}</div>
        <div class="summary">
          <strong>${answeredCount} of ${totalQuestions} questions answered</strong><br />
          Keep this file private. It contains sensitive personal reflections.
        </div>
        ${sectionsHtml}
        <div class="footer">Steps to Recovery - Private &amp; Confidential</div>
      </body>
    </html>
  `;
}

export function StepReviewScreen(): React.ReactElement {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<StepReviewRoute>();
  const { user } = useAuth();
  const userId = user?.id || '';
  const { stepNumber } = route.params;

  const { questions, isLoading, error } = useStepWork(userId, stepNumber);
  const stepData = STEP_PROMPTS.find((step) => step.step === stepNumber);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<ToastVariant>('info');
  const [isExporting, setIsExporting] = useState(false);

  const showToast = useCallback((message: string, variant: ToastVariant): void => {
    setToastMessage(message);
    setToastVariant(variant);
    setToastVisible(true);
  }, []);

  const answersByNumber = useMemo(() => {
    const map = new Map<number, string>();
    questions.forEach((question) => {
      if (question.answer) {
        map.set(question.question_number, question.answer);
      }
    });
    return map;
  }, [questions]);

  const totalQuestions = stepData?.prompts.length ?? 0;
  const answeredCount = useMemo(() => {
    return questions.filter((question) => question.answer?.trim()).length;
  }, [questions]);
  const progressPercent =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const listItems = useMemo((): ReviewItem[] => {
    if (!stepData) return [];

    const items: ReviewItem[] = [];
    let questionIndex = 0;

    if (stepData.sections && stepData.sections.length > 0) {
      stepData.sections.forEach((section: StepSection) => {
        const sectionStart = questionIndex + 1;
        const sectionEnd = questionIndex + section.prompts.length;
        items.push({
          type: 'section',
          title: section.title,
          questionRange: `Questions ${sectionStart}-${sectionEnd}`,
        });

        section.prompts.forEach((prompt) => {
          questionIndex += 1;
          items.push({
            type: 'question',
            questionNumber: questionIndex,
            prompt,
            sectionTitle: section.title,
          });
        });
      });
    } else {
      stepData.prompts.forEach((prompt, index) => {
        items.push({
          type: 'question',
          questionNumber: index + 1,
          prompt,
        });
      });
    }

    return items;
  }, [stepData]);

  const handleEditQuestion = useCallback(
    (questionNumber: number) => {
      navigation.navigate('StepDetail', { stepNumber, initialQuestion: questionNumber });
    },
    [navigation, stepNumber],
  );

  const handleExportPdf = useCallback(async (): Promise<void> => {
    if (!stepData) return;
    if (Platform.OS === 'web') {
      showToast('PDF export is not available on web.', 'warning');
      return;
    }

    setIsExporting(true);
    try {
      const sharingAvailable = await Sharing.isAvailableAsync();
      if (!sharingAvailable) {
        showToast('Sharing is not available on this device.', 'warning');
        return;
      }

      const html = buildStepWorkHtml({
        ds,
        stepData,
        answersByNumber,
        answeredCount,
        totalQuestions,
        exportedAt: new Date().toLocaleString(),
      });

      const result = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(result.uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Step ${stepNumber} answers`,
      });

      showToast('PDF ready to share.', 'success');
    } catch (exportError) {
      logger.error('Failed to export step work PDF', { error: exportError });
      showToast('Failed to export PDF. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [answersByNumber, answeredCount, showToast, stepData, stepNumber, totalQuestions]);

  const renderItem = useCallback(
    ({ item }: { item: ReviewItem }): React.ReactElement | null => {
      if (item.type === 'section') {
        return (
          <View
            style={[
              styles.sectionHeader,
              { backgroundColor: ds.colors.bgSecondary, borderColor: ds.colors.borderSubtle },
            ]}
          >
            <MaterialCommunityIcons name="bookmark-outline" size={20} color={ds.colors.accent} />
            <View style={styles.sectionHeaderContent}>
              <Text variant="labelLarge" style={{ color: ds.colors.textPrimary }}>
                {item.title}
              </Text>
              <Text variant="caption" color="textSecondary">
                {item.questionRange}
              </Text>
            </View>
          </View>
        );
      }

      const answer = answersByNumber.get(item.questionNumber);
      const hasAnswer = Boolean(answer && answer.trim().length > 0);

      return (
        <Card variant="elevated" style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <View
              style={[
                styles.questionNumber,
                hasAnswer
                  ? { backgroundColor: ds.colors.success }
                  : {
                      backgroundColor: ds.colors.bgSecondary,
                      borderColor: ds.colors.borderSubtle,
                      borderWidth: 2,
                    },
              ]}
            >
              {hasAnswer ? (
                <MaterialCommunityIcons name="check" size={18} color={ds.semantic.text.onDark} />
              ) : (
                <Text variant="labelLarge" style={{ color: ds.semantic.text.secondary }}>
                  {item.questionNumber}
                </Text>
              )}
            </View>
            <View style={styles.questionHeaderContent}>
              <Text variant="h3" style={{ color: ds.semantic.text.primary }}>
                {item.prompt}
              </Text>
              {item.sectionTitle && (
                <Badge
                  variant="muted"
                  size="small"
                  style={{ alignSelf: 'flex-start', marginTop: theme.spacing.xs }}
                >
                  {item.sectionTitle}
                </Badge>
              )}
            </View>
          </View>

          <Divider style={styles.divider} />

          <Text variant="label" style={{ color: ds.semantic.text.secondary }}>
            Your answer
          </Text>
          <Text
            variant="body"
            style={{
              color: hasAnswer ? ds.semantic.text.primary : ds.semantic.text.secondary,
              fontStyle: hasAnswer ? 'normal' : 'italic',
              marginTop: theme.spacing.xs,
              marginBottom: theme.spacing.md,
            }}
          >
            {hasAnswer ? answer : 'Not answered yet.'}
          </Text>

          <Button
            title={hasAnswer ? 'Edit answer' : 'Add answer'}
            variant="outline"
            size="small"
            onPress={() => handleEditQuestion(item.questionNumber)}
            accessibilityLabel={`${hasAnswer ? 'Edit' : 'Add'} answer for question ${item.questionNumber}`}
            accessibilityHint="Opens the question in the step editor"
          />
        </Card>
      );
    },
    [answersByNumber, handleEditQuestion, theme.colors, theme.spacing],
  );

  if (!stepData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: ds.semantic.surface.app }]}>
        <View style={styles.centered}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={48}
            color={ds.semantic.intent.alert.solid}
          />
          <Text variant="h2" style={{ marginTop: theme.spacing.md, color: ds.semantic.text.primary }}>
            Step not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: ds.semantic.surface.app }]}>
        <View style={styles.centered}>
          <Text variant="body" color="textSecondary">
            Loading your answers...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: ds.semantic.surface.app }]}>
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle" size={32} color={ds.semantic.intent.alert.solid} />
          <Text variant="body" style={{ marginTop: theme.spacing.sm }}>
            We couldn't load your answers. Please try again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: ds.semantic.surface.app }]}
      edges={['bottom']}
    >
      <Toast
        visible={toastVisible}
        message={toastMessage}
        variant={toastVariant}
        onDismiss={() => setToastVisible(false)}
      />

      <FlatList
        data={listItems}
        keyExtractor={(item, index) =>
          item.type === 'section'
            ? `section-${item.title}`
            : `question-${item.questionNumber}-${index}`
        }
        renderItem={renderItem}
        contentContainerStyle={[styles.content, { paddingBottom: theme.spacing.xl }]}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <Text variant="title2" style={{ color: ds.semantic.text.primary }}>
              Step {stepNumber} Review
            </Text>
            <Text variant="bodySmall" color="textSecondary" style={{ marginTop: theme.spacing.xs }}>
              Review your answers and export them when you're ready.
            </Text>

            <Card variant="elevated" style={{ marginTop: theme.spacing.lg }}>
              <View style={styles.summaryRow}>
                <Badge variant={progressPercent === 100 ? 'success' : 'primary'} size="small">
                  {progressPercent}%
                </Badge>
                <Text variant="bodySmall" color="textSecondary">
                  {answeredCount} of {totalQuestions} questions answered
                </Text>
              </View>
              <ProgressBar progress={progressPercent / 100} style={styles.progressBar} />
            </Card>

            <Card
              variant="outlined"
              style={{
                marginTop: theme.spacing.md,
                borderColor: ds.colors.borderSubtle,
                backgroundColor: ds.colors.bgSecondary,
              }}
            >
              <Text variant="bodySmall" color="textSecondary">
                Exported PDFs contain your private reflections. Share only with someone you trust.
              </Text>
            </Card>

            <View style={{ marginTop: theme.spacing.md }}>
              <Button
                title={isExporting ? 'Exporting...' : 'Export to PDF'}
                onPress={handleExportPdf}
                variant="primary"
                size="large"
                loading={isExporting}
                disabled={isExporting}
                accessibilityLabel="Export answers to PDF"
                accessibilityHint="Creates a PDF file you can share"
              />
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        // Performance optimizations
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
}

const createStyles = (_ds: DS) =>
  ({
    container: {
      flex: 1,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    content: {
      paddingTop: 12,
      paddingHorizontal: 16,
      gap: 16,
    },
    header: {
      paddingBottom: 16,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    progressBar: {
      height: 8,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 10,
      marginTop: 8,
      borderWidth: 1,
    },
    sectionHeaderContent: {
      marginLeft: 12,
    },
    questionCard: {
      marginTop: 8,
    },
    questionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    questionNumber: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      marginTop: 2,
    },
    questionHeaderContent: {
      flex: 1,
    },
    divider: {
      marginVertical: 12,
    },
  }) as const;
