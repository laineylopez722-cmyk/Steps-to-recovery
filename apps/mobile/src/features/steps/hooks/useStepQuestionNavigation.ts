import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type FlatList, Platform, type ViewToken } from 'react-native';
import * as Haptics from '@/platform/haptics';
import type { StepListItem } from '../utils/stepListItems';
import { getFirstVisibleQuestionNumber } from '../utils/stepViewability';

interface UseStepQuestionNavigationParams {
  hasStepData: boolean;
  initialQuestion?: number;
  firstUnansweredQuestion: number;
  questionIndexMap: Map<number, number>;
}

interface UseStepQuestionNavigationResult {
  flatListRef: React.RefObject<FlatList<StepListItem> | null>;
  currentVisibleQuestion: number;
  scrollToQuestion: (questionNumber: number) => void;
  scrollToFirstUnanswered: () => void;
  onViewableItemsChanged: ({ viewableItems }: { viewableItems: ViewToken[] }) => void;
  viewabilityConfig: {
    itemVisiblePercentThreshold: number;
  };
}

export function useStepQuestionNavigation({
  hasStepData,
  initialQuestion,
  firstUnansweredQuestion,
  questionIndexMap,
}: UseStepQuestionNavigationParams): UseStepQuestionNavigationResult {
  const flatListRef = useRef<FlatList<StepListItem>>(null);
  const [currentVisibleQuestion, setCurrentVisibleQuestion] = useState(1);

  const scrollToQuestion = useCallback(
    (questionNumber: number) => {
      if (!flatListRef.current || !hasStepData) return;

      const targetIndex = questionIndexMap.get(questionNumber);
      if (targetIndex === undefined) return;

      flatListRef.current.scrollToIndex({
        index: targetIndex,
        animated: true,
        viewPosition: 0,
      });

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [hasStepData, questionIndexMap],
  );

  const scrollToFirstUnanswered = useCallback(() => {
    scrollToQuestion(firstUnansweredQuestion);
  }, [firstUnansweredQuestion, scrollToQuestion]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const firstVisibleQuestionNumber = getFirstVisibleQuestionNumber(viewableItems);
      if (firstVisibleQuestionNumber !== null) {
        setCurrentVisibleQuestion(firstVisibleQuestionNumber);
      }
    },
    [],
  );

  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 50,
    }),
    [],
  );

  useEffect(() => {
    if (!initialQuestion || !hasStepData) return;

    const timer = setTimeout(() => {
      scrollToQuestion(initialQuestion);
    }, 350);

    return () => clearTimeout(timer);
  }, [hasStepData, initialQuestion, scrollToQuestion]);

  return {
    flatListRef,
    currentVisibleQuestion,
    scrollToQuestion,
    scrollToFirstUnanswered,
    onViewableItemsChanged,
    viewabilityConfig,
  };
}

