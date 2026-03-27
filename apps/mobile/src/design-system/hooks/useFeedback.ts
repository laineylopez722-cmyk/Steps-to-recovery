import { useCallback } from 'react';
import { 
  hapticLight, 
  hapticMedium, 
  hapticHeavy, 
  hapticSuccess, 
  hapticError, 
  hapticWarning, 
  hapticSelection 
} from '../../utils/haptics';

/**
 * useFeedback Hook
 *
 * Provides a unified interface for haptic and (optionally) sound feedback.
 * Following the ENHANCED design strategy for premium tactile feedback.
 */
export function useFeedback() {
  /**
   * Trigger light feedback for subtle interactions
   */
  const light = useCallback(() => {
    void hapticLight();
  }, []);

  /**
   * Trigger medium feedback for standard actions
   */
  const medium = useCallback(() => {
    void hapticMedium();
  }, []);

  /**
   * Trigger heavy feedback for important/destructive actions
   */
  const heavy = useCallback(() => {
    void hapticHeavy();
  }, []);

  /**
   * Trigger success feedback for completion/milestones
   */
  const success = useCallback(() => {
    void hapticSuccess();
  }, []);

  /**
   * Trigger error feedback for failures
   */
  const error = useCallback(() => {
    void hapticError();
  }, []);

  /**
   * Trigger warning feedback for alerts
   */
  const warning = useCallback(() => {
    void hapticWarning();
  }, []);

  /**
   * Trigger selection/tick feedback for sliders/pickers
   */
  const selection = useCallback(() => {
    void hapticSelection();
  }, []);

  return {
    light,
    medium,
    heavy,
    success,
    error,
    warning,
    selection,
    // Aliases
    impact: medium,
    tick: selection,
    celebrate: success,
  };
}
