import { useStepDetailNavigationActions } from './useStepDetailNavigationActions';
import { useStepGuidanceToggle } from './useStepGuidanceToggle';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { StepsStackParamList } from '../../../navigation/types';

type NavigationProp = NativeStackNavigationProp<StepsStackParamList, 'StepDetail'>;

type Params = {
  navigation: NavigationProp;
  stepNumber: number;
};

export function useStepDetailInteractions({ navigation, stepNumber }: Params) {
  const { handleReviewAnswers, handleBackToStepOne, handleBackToSteps } =
    useStepDetailNavigationActions({
      navigation,
      stepNumber,
    });

  const { showGuidance, handleToggleGuidance } = useStepGuidanceToggle();

  return {
    handleReviewAnswers,
    handleBackToStepOne,
    handleBackToSteps,
    showGuidance,
    handleToggleGuidance,
  };
}
