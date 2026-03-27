/**
 * Theme Context Provider
 * Provides theme tokens and dark mode detection to the entire app
 */

import { createContext, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { categoryColors, type ColorPalette } from '../tokens/colors';
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
import { getTheme, isDarkTheme, type ThemeName } from '../tokens/themes';
import { createDs } from '../tokens/ds';
import { logger } from '@/utils/logger';

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
    durations: typeof durations;
    easing: typeof easingCurves;
    scales: typeof scales;
    opacities: typeof opacities;
  };
  isDark: boolean;
  themeName: ThemeName;
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
  // Detect device color scheme
  const systemScheme = useColorScheme();
  const [themeName, setThemeName] = useState<ThemeName>(
    forcedColorScheme === 'light' ? 'light' : forcedColorScheme === 'dark' ? 'dark' : 
    (systemScheme === 'light' ? 'light' : 'dark')
  );

  const isDark = useMemo(() => isDarkTheme(themeName), [themeName]);

  // Map the unified theme to the legacy ColorPalette structure
  const resolvedColors = useMemo(() => {
    const ds = createDs(themeName);
    return ds.colors as unknown as ColorPalette;
  }, [themeName]);

  // Memoize theme object to prevent unnecessary re-renders
  const theme: Theme = useMemo(
    () => ({
      colors: resolvedColors,
      categoryColors,
      typography,
      spacing,
      radius,
      shadows,
      animations: {
        spring: springConfigs,
        timing: timingDurations,
        durations,
        easing: easingCurves,
        scales,
        opacities,
      },
      isDark,
      themeName,
    }),
    [isDark, themeName, resolvedColors],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
