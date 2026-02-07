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

import { FadeIn, FadeInDown, FadeInUp, FadeInRight } from 'react-native-reanimated';

// Stagger delay calculation (max 300ms total)
const getStaggerDelay = (index: number): number => Math.min(index * 50, 300);

export const ScreenAnimations = {
  /**
   * Screen entrance animation
   * Use for: Main screen content fade-in
   */
  entrance: FadeInDown.duration(400).springify().damping(15),

  /**
   * List item animation
   * Use for: List items, cards in scroll views
   * @param index - Item index for stagger effect
   */
  item: (index: number = 0) =>
    FadeInRight.duration(300).delay(getStaggerDelay(index)).springify().damping(15),

  /**
   * Modal/panel animation
   * Use for: Bottom sheets, modals, overlays
   */
  modal: FadeInUp.duration(300).springify(),

  /**
   * Simple fade
   * Use for: Subtle content appearance
   */
  fade: FadeIn.duration(300),

  /**
   * Delayed fade for sequential content
   * @param delayMs - Delay in milliseconds
   */
  fadeDelayed: (delayMs: number) => FadeIn.duration(300).delay(delayMs),
} as const;

export type ScreenAnimation = keyof typeof ScreenAnimations;
