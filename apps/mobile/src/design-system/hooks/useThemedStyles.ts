import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useDs } from '../DsProvider';
import type { DS } from '../tokens/ds';

/**
 * Creates theme-aware styles that update when light/dark mode changes.
 *
 * Usage:
 * ```tsx
 * function MyScreen() {
 *   const styles = useThemedStyles(createStyles);
 *   return <View style={styles.container} />;
 * }
 *
 * const createStyles = (ds: DS) => ({
 *   container: { backgroundColor: ds.semantic.surface.app },
 * });
 * ```
 *
 * The factory must be defined at module level (outside the component)
 * so useMemo can rely on a stable reference.
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(factory: (ds: DS) => T): T {
  const ds = useDs();
  return useMemo(() => StyleSheet.create(factory(ds)), [ds]); // factory should be stable
}

export type { DS };
