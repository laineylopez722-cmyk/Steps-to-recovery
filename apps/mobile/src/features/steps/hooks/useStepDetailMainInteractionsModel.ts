import { useStepDetailInteractions } from './useStepDetailInteractions';
import { type useStepDetailQuestionFlow } from './useStepDetailQuestionFlow';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { StepsStackParamList } from '../../../navigation/types';

type NavigationProp = NativeStackNavigationProp<StepsStackParamList, 'StepDetail'>;

type Params = {
  navigation: NavigationProp;
  stepNumber: number;
  questionFlow: ReturnType<typeof useStepDetailQuestionFlow>;
};

export function useStepDetailMainInteractionsModel({
  navigation,
  stepNumber,
  questionFlow,
}: Params) {
  const {
    handleReviewAnswers,
    handleBackToStepOne,
    handleBackToSteps,
    showGuidance,
    handleToggleGuidance,
  } = useStepDetailInteractions({
    navigation,
    stepNumber,
  });

  return {
    handleBackToStepOne,
    handleBackToSteps,
    mainInteractions: {
      showGuidance,
      onToggleGuidance: handleToggleGuidance,
      onContinue: questionFlow.scrollToFirstUnanswered,
      onReviewAnswers: handleReviewAnswers,
    },
  };
}
