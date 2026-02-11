/**
 * Screen Animation System
 * 
 * LIMITED animation budget for consistent, premium feel:
 * - 3 animation patterns maximum
 * - Consistent timing (300-400ms)
 * - Purposeful motion only
 * 
 * Usage:
 *   entering={ScreenAnimations.item(index)}
 *   entering={ScreenAnimations.entrance}
 *   entering={ScreenAnimations.modal}
 */

import { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { transitions } from './motion';

export const ScreenAnimations = {
  /**
   * Screen entrance animation
   * Use for: Main screen content fade-in
   */
  entrance: FadeIn.duration(transitions.fade.duration),

  /**
   * List item animation
   * Use for: List items, cards in scroll views
   * @param index - Item index for stagger effect
   */
  item: (index: number = 0) => FadeInDown.duration(transitions.slideUp.duration).delay(index * 50),

  /**
   * Modal/panel animation
   * Use for: Bottom sheets, modals, overlays
   */
  modal: SlideInDown.duration(transitions.slideUp.duration),

  /**
   * Simple fade
   * Use for: Subtle content appearance
   */
  fade: FadeIn.duration(transitions.fade.duration),

  /**
   * Delayed fade for sequential content
   * @param delayMs - Delay in milliseconds
   */
  fadeDelayed: (delayMs: number) => FadeIn.duration(transitions.fade.duration).delay(delayMs),
};

export type ScreenAnimation = keyof typeof ScreenAnimations;
