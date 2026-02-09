import { useCallback, useState } from 'react';

export function useStepGuidanceToggle() {
  const [showGuidance, setShowGuidance] = useState(false);

  const handleToggleGuidance = useCallback(() => {
    setShowGuidance((prev) => !prev);
  }, []);

  return {
    showGuidance,
    handleToggleGuidance,
  };
}
