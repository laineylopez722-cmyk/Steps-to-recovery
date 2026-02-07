/**
 * Card Surface Styles - iOS Dark Mode
 * 
 * No blur/glassmorphism - clean, modern surfaces
 * Following iOS Human Interface Guidelines
 */

import type { ViewStyle } from 'react-native';

// iOS Dark Mode surface colors
const SURFACE = '#1C1C1E';
const SURFACE_ELEVATED = '#2C2C2E';
const BORDER = '#38383A';
const BORDER_SUBTLE = '#2C2C2E';

// Card variants
export const glass = {
  /**
   * Navigation bar - top/bottom bars
   */
  nav: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER_SUBTLE,
  } as ViewStyle,

  /**
   * Standard card
   */
  card: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,

  /**
   * Modal/bottom sheet
   */
  modal: {
    backgroundColor: SURFACE_ELEVATED,
    borderRadius: 16,
    // Elevated shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  } as ViewStyle,

  /**
   * Subtle surface - grouped content
   */
  subtle: {
    backgroundColor: SURFACE,
    borderRadius: 10,
  } as ViewStyle,

  /**
   * FAB - deprecated
   * @deprecated Use standard buttons instead
   */
  fab: {
    backgroundColor: '#F59E0B',
    borderRadius: 9999,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,
} as const;

// Accent glow colors (use very sparingly)
export const glow = {
  primary: 'rgba(245, 158, 11, 0.2)',   // amber
  success: 'rgba(48, 209, 88, 0.2)',    // green
  warning: 'rgba(255, 214, 10, 0.2)',   // yellow
  danger: 'rgba(255, 69, 58, 0.2)',     // red
  calm: 'rgba(10, 132, 255, 0.15)',     // blue
} as const;

// Solid backgrounds (no gradients)
export const glassGradients = {
  nav: ['rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.9)'],
  card: [SURFACE, SURFACE],
  modal: [SURFACE_ELEVATED, SURFACE_ELEVATED],
  subtle: [SURFACE, SURFACE],
} as const;

export type GlassVariant = keyof typeof glass;
