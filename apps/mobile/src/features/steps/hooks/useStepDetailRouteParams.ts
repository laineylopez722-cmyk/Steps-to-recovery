import { useRoute, type RouteProp } from '@react-navigation/native';
import type { StepsStackParamList } from '../../../navigation/types';

export function useStepDetailRouteParams() {
  const route = useRoute<RouteProp<StepsStackParamList, 'StepDetail'>>();
  return route.params;
}
