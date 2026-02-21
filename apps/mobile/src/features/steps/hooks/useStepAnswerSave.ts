import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as Haptics from '@/platform/haptics';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

type SaveAnswerFn = (
  stepNumber: number,
  questionNumber: number,
  answer: string,
  isComplete: boolean,
) => Promise<void>;

interface UseStepAnswerSaveParams {
  answers: Record<number, string>;
  stepNumber: number;
  saveAnswer: SaveAnswerFn;
}

interface UseStepAnswerSaveResult {
  savingQuestion: number | null;
  toastVisible: boolean;
  toastMessage: string;
  toastVariant: ToastVariant;
  dismissToast: () => void;
  handleSaveAnswer: (questionNumber: number) => Promise<void>;
}

export function useStepAnswerSave({
  answers,
  stepNumber,
  saveAnswer,
}: UseStepAnswerSaveParams): UseStepAnswerSaveResult {
  const [savingQuestion, setSavingQuestion] = useState<number | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<ToastVariant>('success');

  const presentToast = useCallback((message: string, variant: ToastVariant) => {
    setToastMessage(message);
    setToastVariant(variant);
    setToastVisible(true);
  }, []);

  const dismissToast = useCallback(() => setToastVisible(false), []);

  const handleSaveAnswer = useCallback(
    async (questionNumber: number) => {
      if (savingQuestion === questionNumber) return;

      const answer = answers[questionNumber];
      const normalizedAnswer = answer?.trim();
      if (!normalizedAnswer) return;

      setSavingQuestion(questionNumber);
      try {
        await saveAnswer(stepNumber, questionNumber, normalizedAnswer, true);

        // Fire-and-forget: never let haptics failure affect save outcome
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }

        presentToast('Answer saved successfully', 'success');
      } catch (_error) {
        presentToast('Failed to save answer. Please try again.', 'error');
      } finally {
        setSavingQuestion(null);
      }
    },
    [answers, presentToast, saveAnswer, savingQuestion, stepNumber],
  );

  return {
    savingQuestion,
    toastVisible,
    toastMessage,
    toastVariant,
    dismissToast,
    handleSaveAnswer,
  };
}

