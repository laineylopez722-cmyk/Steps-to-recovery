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

import { MotionTransitions } from './motion';

export const ScreenAnimations = {
  /**
   * Screen entrance animation
   * Use for: Main screen content fade-in
   */
  entrance: MotionTransitions.screenEnter(),

  /**
   * List item animation
   * Use for: List items, cards in scroll views
   * @param index - Item index for stagger effect
   */
  item: (index: number = 0) => MotionTransitions.listItemEnter(index),

  /**
   * Modal/panel animation
   * Use for: Bottom sheets, modals, overlays
   */
  modal: MotionTransitions.modalEnter(),

  /**
   * Simple fade
   * Use for: Subtle content appearance
   */
  fade: MotionTransitions.fade(),

  /**
   * Delayed fade for sequential content
   * @param delayMs - Delay in milliseconds
   */
  fadeDelayed: (delayMs: number) => MotionTransitions.fadeDelayed(delayMs),
} as const;

export type ScreenAnimation = keyof typeof ScreenAnimations;
