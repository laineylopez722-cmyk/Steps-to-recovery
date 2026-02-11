/**
 * Spacing System
 * Material Design 3 compatible 4px base scale
 */

// =============================================================================
// MATERIAL DESIGN 3 SPACING SCALE (4px base)
// =============================================================================

/**
 * MD3 Spacing Scale
 * Base unit: 4px
 * Follows Material Design 3 density guidelines
 */
export const md3Spacing = {
  // Base unit (4px)
  base: 4,

  // Single step increments
  '0': 0,
  '0.5': 2, // 0.5 × base
  '1': 4, // 1 × base
  '1.5': 6, // 1.5 × base
  '2': 8, // 2 × base
  '3': 12, // 3 × base
  '4': 16, // 4 × base
  '5': 20, // 5 × base
  '6': 24, // 6 × base
  '8': 32, // 8 × base
  '10': 40, // 10 × base
  '12': 48, // 12 × base
  '16': 64, // 16 × base
  '20': 80, // 20 × base
  '24': 96, // 24 × base
  '32': 128, // 32 × base
  '40': 160, // 40 × base
  '48': 192, // 48 × base
  '56': 224, // 56 × base
  '64': 256, // 64 × base
} as const;

/**
 * Semantic spacing tokens for common UI patterns
 * Maps to MD3 component spacing guidelines
 */
export const md3ComponentSpacing = {
  // Touch targets (WCAG AAA compliant - 48dp minimum)
  touchTargetMin: 48,
  touchTargetLarge: 56,

  // Component padding
  componentPaddingSmall: 8,
  componentPaddingMedium: 12,
  componentPaddingLarge: 16,

  // Card spacing
  cardPadding: 16,
  cardContentPadding: 12,
  cardActionsPadding: 8,
  cardGap: 16,

  // List spacing
  listItemHeight: 56,
  listItemPadding: 16,
  listItemGap: 0,
  listSectionGap: 8,

  // Button spacing
  buttonPaddingHorizontal: 24,
  buttonPaddingVertical: 8,
  buttonIconPadding: 12,

  // Text field spacing
  textFieldPaddingHorizontal: 16,
  textFieldPaddingVertical: 12,
  textFieldHelperPadding: 4,

  // App bar spacing
  appBarHeight: 64,
  appBarPadding: 16,

  // Bottom navigation
  bottomNavHeight: 80,
  bottomNavItemPadding: 12,

  // Screen spacing
  screenMargin: 16,
  screenMarginWide: 24,
  screenTopPadding: 16,
  screenBottomPadding: 16,

  // Dialog spacing
  dialogPadding: 24,
  dialogContentGap: 16,

  // Snackbar spacing
  snackbarPadding: 14,
  snackbarMargin: 16,

  // Chip spacing
  chipPaddingHorizontal: 16,
  chipPaddingVertical: 6,
  chipGap: 8,

  // Divider spacing
  dividerInset: 16,
  dividerVerticalMargin: 8,

  // Avatar spacing
  avatarSizeSmall: 32,
  avatarSizeMedium: 40,
  avatarSizeLarge: 48,
  avatarGroupOverlap: 8,
} as const;

/**
 * MD3 Elevation spacing (for visual depth)
 */
export const md3Elevation = {
  level0: 0,
  level1: 1,
  level2: 3,
  level3: 6,
  level4: 8,
  level5: 12,
} as const;

// =============================================================================
// LEGACY SPACING (Backward Compatibility)
// =============================================================================

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

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type MD3SpacingKey = keyof typeof md3Spacing;
export type MD3ComponentSpacingKey = keyof typeof md3ComponentSpacing;
export type MD3ElevationKey = keyof typeof md3Elevation;
export type SpacingKey = keyof typeof spacing;

/**
 * Helper function to get spacing value by multiplier
 * @param multiplier - Number of 4px base units
 * @returns Spacing value in pixels
 */
export const getSpacing = (multiplier: number): number => multiplier * 4;

/**
 * Complete spacing system
 */
export const spacingSystem = {
  md3: md3Spacing,
  component: md3ComponentSpacing,
  elevation: md3Elevation,
  legacy: spacing,
} as const;
