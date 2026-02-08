/**
 * Spacing scale for consistent layout
 * Base unit: 4px
 */

export const spacing = {
  // Extra small spacing
  xs: 4,

  // Small spacing
  sm: 8,

  // Medium spacing (most common for cards, sections)
  md: 16,

  // Large spacing
  lg: 24,

  // Extra large spacing
  xl: 32,

  // Double extra large spacing
  xxl: 48,

  // Accessibility minimum touch target (WCAG 2.1 Level AAA)
  minTouchTarget: 48,

  // Card specific spacing
  cardPadding: 16,
  cardPaddingPremium: 24,
  cardMargin: 16,

  // Screen spacing
  screenPadding: 20,
  screenPaddingHorizontal: 20,
  screenPaddingVertical: 16,

  // List spacing
  listItemSpacing: 12,
  listSectionSpacing: 24,
} as const;

export type SpacingKey = keyof typeof spacing;
