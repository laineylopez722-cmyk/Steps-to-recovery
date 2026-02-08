/**
 * Theme Context Provider
 * Provides theme tokens and dark mode detection to the entire app
 */

import { createContext, type ReactNode, useEffect, useMemo, useState } from 'react';
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
import { resolveRuntimeTheme } from '../runtime-theme/resolver';
import { runtimeThemeFlags } from '../runtime-theme/flags';
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

  const defaultColors = isDark ? darkColors : lightColors;
  const [resolvedColors, setResolvedColors] = useState<ColorPalette>(defaultColors);

  useEffect(() => {
    let cancelled = false;

    const hydrateRuntimeTheme = async () => {
      try {
        const resolved = await resolveRuntimeTheme({
          defaultColors,
          isDark,
          runtimeThemeEnabled: runtimeThemeFlags.runtimeThemeEnabled,
        });

        if (!cancelled) {
          setResolvedColors(resolved.colors);
        }
      } catch (error) {
        logger.warn('Theme resolver failed; using defaults', error);
        if (!cancelled) {
          setResolvedColors(defaultColors);
        }
      }
    };

    // Immediate safe fallback before async resolution.
    setResolvedColors(defaultColors);
    void hydrateRuntimeTheme();

    return () => {
      cancelled = true;
    };
  }, [defaultColors, isDark]);

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
        durations, // Alias for backward compatibility
        easing: easingCurves,
        scales,
        opacities,
      },
      isDark,
    }),
    [isDark, resolvedColors],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
