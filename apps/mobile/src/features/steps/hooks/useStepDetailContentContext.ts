import { useStepScreenAnimation } from './useStepScreenAnimation';
import { useStepDetailMainContentModel } from './useStepDetailMainContentModel';
import { useStepDetailMainInteractionsModel } from './useStepDetailMainInteractionsModel';
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

  const { handleBackToStepOne, handleBackToSteps, mainInteractions } =
    useStepDetailMainInteractionsModel({
      navigation,
      stepNumber,
      questionFlow,
    });

  const mainContentProps = useStepDetailMainContentModel({
    animation: {
      fadeAnim,
      slideAnim,
    },
    step: {
      stepNumber,
      stepData,
    },
    interactions: mainInteractions,
    questionFlow,
  });

  return {
    handleBackToStepOne,
    handleBackToSteps,
    mainContentProps,
  };
}
