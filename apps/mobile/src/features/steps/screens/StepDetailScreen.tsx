import React from 'react';
import { useStepDetailOrchestration } from '../hooks/useStepDetailOrchestration';
import { StepDetailErrorState } from '../components/StepDetailErrorState';
import { StepDetailScreenContent } from '../components/StepDetailScreenContent';

export function StepDetailScreen(): React.ReactElement {
  const { hasStepData, content } = useStepDetailOrchestration();

  if (!hasStepData) {
    return <StepDetailErrorState />;
  }

  return <StepDetailScreenContent {...content} />;
}
