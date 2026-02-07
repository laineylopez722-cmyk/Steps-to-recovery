/**
 * Theme Context Provider
 * Provides theme tokens and dark mode detection to the entire app
 */

import { createContext, type ReactNode, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, categoryColors, type ColorPalette } from '../tokens/colors';
import { typography } from '../tokens/typography';
import { spacing } from '../tokens/spacing';
import { radius } from '../tokens/radius';
import { shadows } from '../tokens/shadows';
import {
  springConfigs,
  timingDurations,
  durations,
  easingCurves,
  scales,
  opacities,
} from '../tokens/animations';

/**
 * Complete theme object with all design tokens
 */
export interface Theme {
  colors: ColorPalette;
  categoryColors: typeof categoryColors;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
  animations: {
    spring: typeof springConfigs;
    timing: typeof timingDurations;
    durations: typeof durations; // Alias for timing
    easing: typeof easingCurves;
    scales: typeof scales;
    opacities: typeof opacities;
  };
  isDark: boolean;
}

/**
 * Theme context - undefined until initialized
 */
export const ThemeContext = createContext<Theme | undefined>(undefined);

/**
 * Theme Provider Props
 */
interface ThemeProviderProps {
  children: ReactNode;
  /**
   * Force a specific color scheme (useful for testing/storybook)
   * If not provided, uses device color scheme
   */
  forcedColorScheme?: 'light' | 'dark';
}

/**
 * Theme Provider Component
 * Wraps the app and provides theme tokens via context
 */
export function ThemeProvider({ children, forcedColorScheme }: ThemeProviderProps) {
  // Detect device color scheme - default to dark for reference app design
  const deviceColorScheme = useColorScheme();
  const colorScheme = forcedColorScheme || deviceColorScheme || 'dark';
  const isDark = colorScheme === 'dark';

  // Memoize theme object to prevent unnecessary re-renders
  const theme: Theme = useMemo(
    () => ({
      colors: isDark ? darkColors : lightColors,
      categoryColors,
      typography,
      spacing,
      radius,
      shadows,
      animations: {
        spring: springConfigs,
        timing: timingDurations,
        durations, // Alias for backward compatibility
        easing: easingCurves,
        scales,
        opacities,
      },
      isDark,
    }),
    [isDark],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
