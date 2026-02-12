import React from 'react';
import { useStepDetailRenderModel } from '../hooks/useStepDetailRenderModel';
import { StepDetailErrorState } from '../components/StepDetailErrorState';
import { StepDetailScreenContent } from '../components/StepDetailScreenContent';

export function StepDetailScreen(): React.ReactElement {
  const { hasStepData, content } = useStepDetailRenderModel();

  if (!hasStepData) {
    return <StepDetailErrorState />;
  }

  return <StepDetailScreenContent {...content} />;
}
