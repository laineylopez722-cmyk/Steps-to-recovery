/**
 * Material Design 3 Button Variants
 * Using class-variance-authority for type-safe variant management
 *
 * MD3 Button Types:
 * - Filled: High emphasis, primary actions
 * - Outlined: Medium emphasis, secondary actions
 * - Text: Low emphasis, tertiary actions
 * - Elevated: Filled with shadow, increased emphasis
 * - Tonal: Secondary color fill, medium emphasis
 * - FAB (Floating Action Button): Primary, most important action
 * - Icon Button: Icon-only actions
 */

import { cva, type VariantProps } from 'class-variance-authority';
import { Platform } from 'react-native';
import { cn } from '../../../../lib/utils';

// ============================================================================
// BASE BUTTON VARIANTS
// ============================================================================

/**
 * MD3 Button container variants
 * Follows Material Design 3 specifications for state layers and elevation
 */
export const buttonVariants = cva(
  // Base styles applied to all buttons
  cn(
    'flex-row items-center justify-center gap-2',
    'active:opacity-80',
    Platform.select({
      web: 'transition-all duration-150 ease-out cursor-pointer disabled:cursor-not-allowed',
      native: '',
    }),
  ),
  {
    variants: {
      /**
       * Visual style variant following MD3 specification
       */
      variant: {
        // Filled: High emphasis, surface tint on press
        filled: cn(
          'bg-primary',
          Platform.select({
            web: 'hover:bg-primary/90',
            native: '',
          }),
        ),
        // Outlined: Medium emphasis, outline border
        outlined: cn(
          'bg-transparent border-2 border-outline',
          Platform.select({
            web: 'hover:bg-surfaceVariant/50',
            native: '',
          }),
        ),
        // Text: Low emphasis, no container
        text: cn(
          'bg-transparent',
          Platform.select({
            web: 'hover:bg-surfaceVariant/30',
            native: '',
          }),
        ),
        // Elevated: Filled with shadow, increased elevation
        elevated: cn(
          'bg-surfaceContainerLow shadow-sm',
          Platform.select({
            web: 'hover:bg-surfaceContainer',
            native: '',
          }),
        ),
        // Tonal: Secondary color emphasis
        tonal: cn(
          'bg-secondaryContainer',
          Platform.select({
            web: 'hover:bg-secondaryContainer/90',
            native: '',
          }),
        ),
      },
      /**
       * Size following MD3 touch target requirements (minimum 48x48dp)
       */
      size: {
        small: 'min-h-[40px] px-3 py-1.5 rounded-lg',
        medium: 'min-h-[48px] px-4 py-2 rounded-xl', // MD3 standard: 48dp height, 12dp radius
        large: 'min-h-[56px] px-6 py-3 rounded-xl',
      },
      /**
       * Full width button
       */
      fullWidth: {
        true: 'w-full',
        false: 'self-start',
      },
      /**
       * Disabled state
       */
      disabled: {
        true: 'opacity-40 pointer-events-none',
        false: '',
      },
      /**
       * Loading state
       */
      loading: {
        true: 'opacity-80',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'filled',
      size: 'medium',
      fullWidth: false,
      disabled: false,
      loading: false,
    },
  },
);

/**
 * MD3 Button text label variants
 * Ensures proper contrast and typography
 */
export const buttonTextVariants = cva(
  cn(
    'font-medium',
    Platform.select({
      web: 'transition-colors duration-150',
      native: '',
    }),
  ),
  {
    variants: {
      variant: {
        filled: 'text-onPrimary',
        outlined: 'text-primary',
        text: 'text-primary',
        elevated: 'text-primary',
        tonal: 'text-onSecondaryContainer',
      },
      size: {
        small: 'text-sm',
        medium: 'text-base',
        large: 'text-lg',
      },
      disabled: {
        true: 'opacity-60',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'filled',
      size: 'medium',
      disabled: false,
    },
  },
);

// ============================================================================
// FAB VARIANTS
// ============================================================================

/**
 * MD3 Floating Action Button (FAB) variants
 * Three sizes: Small, Standard, Large
 */
export const fabVariants = cva(
  cn(
    'items-center justify-center rounded-2xl shadow-md',
    'active:scale-95 active:shadow-lg',
    Platform.select({
      web: 'transition-all duration-150 ease-out cursor-pointer hover:shadow-lg',
      native: '',
    }),
  ),
  {
    variants: {
      /**
       * FAB variant type
       */
      variant: {
        // Primary FAB: Highest emphasis, container color
        primary: 'bg-primaryContainer',
        // Secondary FAB: Lower emphasis, secondary color
        secondary: 'bg-secondaryContainer',
        // Surface FAB: Matches surface
        surface: 'bg-surface',
        // Tertiary FAB: Tertiary accent color
        tertiary: 'bg-tertiaryContainer',
      },
      /**
       * FAB size per MD3 spec
       */
      size: {
        small: 'w-10 h-10 rounded-xl', // 40dp
        medium: 'w-14 h-14', // 56dp (standard)
        large: 'w-24 h-24 rounded-3xl', // 96dp
      },
      /**
       * Extended FAB with text label
       */
      extended: {
        true: 'px-4 w-auto flex-row gap-2',
        false: '',
      },
      disabled: {
        true: 'opacity-40 shadow-none pointer-events-none',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'medium',
      extended: false,
      disabled: false,
    },
  },
);

/**
 * FAB icon color variants
 */
export const fabIconVariants = cva('', {
  variants: {
    variant: {
      primary: 'text-onPrimaryContainer',
      secondary: 'text-onSecondaryContainer',
      surface: 'text-primary',
      tertiary: 'text-onTertiaryContainer',
    },
  },
  defaultVariants: {
    variant: 'primary',
  },
});

// ============================================================================
// ICON BUTTON VARIANTS
// ============================================================================

/**
 * MD3 Icon Button variants
 * Standard, Filled, Tonal, Outlined
 */
export const iconButtonVariants = cva(
  cn(
    'items-center justify-center',
    'active:opacity-70',
    Platform.select({
      web: 'transition-all duration-150 cursor-pointer',
      native: '',
    }),
  ),
  {
    variants: {
      /**
       * Icon button style variant
       */
      variant: {
        // Standard: No container, just icon
        standard: 'bg-transparent',
        // Filled: Container background
        filled: 'bg-primary',
        // Tonal: Secondary container background
        tonal: 'bg-secondaryContainer',
        // Outlined: Border only
        outlined: 'bg-transparent border-2 border-outline',
      },
      /**
       * Icon button size
       */
      size: {
        small: 'w-8 h-8 rounded-lg', // 32dp
        medium: 'w-10 h-10 rounded-xl', // 40dp
        large: 'w-12 h-12 rounded-xl', // 48dp - WCAG minimum
      },
      disabled: {
        true: 'opacity-40 pointer-events-none',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'standard',
      size: 'large', // Default to large for WCAG compliance
      disabled: false,
    },
  },
);

/**
 * Icon button icon color variants
 */
export const iconButtonIconVariants = cva('', {
  variants: {
    variant: {
      standard: 'text-onSurfaceVariant',
      filled: 'text-onPrimary',
      tonal: 'text-onSecondaryContainer',
      outlined: 'text-onSurfaceVariant',
    },
    size: {
      small: 'w-4 h-4',
      medium: 'w-5 h-5',
      large: 'w-6 h-6',
    },
  },
  defaultVariants: {
    variant: 'standard',
    size: 'large',
  },
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
export type ButtonTextVariantProps = VariantProps<typeof buttonTextVariants>;
export type FABVariantProps = VariantProps<typeof fabVariants>;
export type FABIconVariantProps = VariantProps<typeof fabIconVariants>;
export type IconButtonVariantProps = VariantProps<typeof iconButtonVariants>;
export type IconButtonIconVariantProps = VariantProps<typeof iconButtonIconVariants>;
