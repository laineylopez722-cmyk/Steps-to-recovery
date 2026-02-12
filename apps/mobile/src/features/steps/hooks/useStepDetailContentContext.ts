import { useStepScreenAnimation } from './useStepScreenAnimation';
import { useStepDetailMainContentProps } from './useStepDetailMainContentProps';
import { useStepDetailNavigationActions } from './useStepDetailNavigationActions';
import { useStepGuidanceToggle } from './useStepGuidanceToggle';
import { type useStepDetailQuestionFlow } from './useStepDetailQuestionFlow';
import type { StepPrompt } from '@recovery/shared';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { StepsStackParamList } from '../../../navigation/types';

type NavigationProp = NativeStackNavigationProp<StepsStackParamList, 'StepDetail'>;

type Params = {
  navigation: NavigationProp;
  stepNumber: number;
  stepData?: StepPrompt;
  questionFlow: ReturnType<typeof useStepDetailQuestionFlow>;
};

export function useStepDetailContentContext({
  navigation,
  stepNumber,
  stepData,
  questionFlow,
}: Params) {
  const { fadeAnim, slideAnim } = useStepScreenAnimation();

  const { handleReviewAnswers, handleBackToStepOne, handleBackToSteps } =
    useStepDetailNavigationActions({ navigation, stepNumber });

  const { showGuidance, handleToggleGuidance } = useStepGuidanceToggle();

  const mainContentProps = useStepDetailMainContentProps({
    animation: {
      fadeAnim,
      slideAnim,
    },
    step: {
      stepNumber,
      stepData,
    },
    interactions: {
      showGuidance,
      onToggleGuidance: handleToggleGuidance,
      onContinue: questionFlow.scrollToFirstUnanswered,
      onReviewAnswers: handleReviewAnswers,
    },
    questionFlow,
  });

  return {
    handleBackToStepOne,
    handleBackToSteps,
    mainContentProps,
  };
}
