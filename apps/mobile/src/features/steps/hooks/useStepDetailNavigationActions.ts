import { useCallback } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { StepsStackParamList } from '../../../navigation/types';

type NavigationProp = NativeStackNavigationProp<StepsStackParamList, 'StepDetail'>;

type Params = {
  navigation: NavigationProp;
  stepNumber: number;
};

export function useStepDetailNavigationActions({ navigation, stepNumber }: Params) {
  const handleReviewAnswers = useCallback(() => {
    navigation.navigate('StepReview', { stepNumber });
  }, [navigation, stepNumber]);

  const handleBackToStepOne = useCallback(() => {
    navigation.navigate('StepDetail', { stepNumber: 1 });
  }, [navigation]);

  const handleBackToSteps = useCallback(() => {
    navigation.navigate('StepsOverview');
  }, [navigation]);

  return {
    handleReviewAnswers,
    handleBackToStepOne,
    handleBackToSteps,
  };
}
