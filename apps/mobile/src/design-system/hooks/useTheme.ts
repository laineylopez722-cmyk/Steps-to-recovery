/**
 * useTheme hook
 * Provides access to theme tokens and dark mode state
 */

import { useContext } from 'react';
import { ThemeContext, type Theme } from '../context/ThemeContext';

/**
 * Hook to access theme tokens
 * @throws Error if used outside ThemeProvider
 * @returns Theme object with colors, typography, spacing, etc.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const theme = useTheme();
 *
 *   return (
 *     <View style={{ backgroundColor: theme.colors.background }}>
 *       <Text style={[theme.typography.h1, { color: theme.colors.text }]}>
 *         Hello {theme.isDark ? '🌙' : '☀️'}
 *       </Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useTheme(): Theme {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

/**
 * Hook to access just the color palette
 * Convenience hook for components that only need colors
 */
export function useColors() {
  const theme = useTheme();
  return theme.colors;
}

/**
 * Hook to check if dark mode is active
 * Convenience hook for conditional rendering
 */
export function useIsDark(): boolean {
  const theme = useTheme();
  return theme.isDark;
}
