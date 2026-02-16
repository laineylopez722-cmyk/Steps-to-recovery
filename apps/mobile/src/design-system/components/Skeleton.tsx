/**
 * Skeleton Loading Components
 * Premium loading placeholders with shimmer animation
 *
 * Usage:
 * <SkeletonCard />
 * <SkeletonList items={3} />
 * <SkeletonStats />
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useDs } from '../DsProvider';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Base skeleton with shimmer animation
 */
export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps): React.ReactElement {
  const theme = useTheme();
  const ds = useDs();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: ds.semantic.surface.card,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
          },
        ]}
      />
    </View>
  );
}

/**
 * Card skeleton with title and content lines
 */
export function SkeletonCard({ lines = 3 }: { lines?: number }): React.ReactElement {
  const ds = useDs();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: ds.semantic.surface.card,
          borderColor: ds.semantic.surface.overlay,
        },
      ]}
    >
      {/* Title */}
      <Skeleton width="60%" height={20} borderRadius={6} />

      {/* Content lines */}
      <View style={styles.lines}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            width={i === lines - 1 ? '70%' : '100%'}
            height={14}
            borderRadius={6}
            style={styles.line}
          />
        ))}
      </View>
    </View>
  );
}

/**
 * List item skeleton
 */
export function SkeletonListItem(): React.ReactElement {
  return (
    <View style={styles.listItem}>
      {/* Avatar */}
      <Skeleton width={48} height={48} borderRadius={24} />

      {/* Content */}
      <View style={styles.listContent}>
        <Skeleton width="50%" height={16} borderRadius={6} />
        <Skeleton width="80%" height={12} borderRadius={6} style={styles.line} />
      </View>
    </View>
  );
}

/**
 * Stats skeleton (for dashboard)
 */
export function SkeletonStats(): React.ReactElement {
  return (
    <View style={styles.statsRow}>
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

/**
 * Full screen skeleton list
 */
export function SkeletonList({ items = 5 }: { items?: number }): React.ReactElement {
  return (
    <View style={styles.list}>
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </View>
  );
}

// Backwards-compatible alias used by older imports.
export const SkeletonJournalList = SkeletonList;

/**
 * Home screen skeleton
 */
export function SkeletonHome(): React.ReactElement {
  const ds = useDs();

  return (
    <View style={styles.container}>
      {/* Header */}
      <Skeleton width="50%" height={28} borderRadius={8} />
      <Skeleton width="80%" height={16} borderRadius={6} style={styles.line} />

      {/* Clean time tracker */}
      <View
        style={[
          styles.tracker,
          {
            backgroundColor: ds.semantic.surface.card,
            borderColor: ds.semantic.surface.overlay,
          },
        ]}
      >
        <Skeleton width="40%" height={48} borderRadius={8} />
        <Skeleton width="60%" height={16} borderRadius={6} style={styles.line} />
      </View>

      {/* Check-in card */}
      <SkeletonCard lines={2} />

      {/* Quick actions */}
      <View style={styles.actions}>
        <Skeleton width="48%" height={80} borderRadius={12} />
        <Skeleton width="48%" height={80} borderRadius={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  shimmer: {
    width: 100,
    height: '200%',
    position: 'absolute',
    top: '-50%',
    left: 0,
    transform: [{ skewX: '-20deg' }],
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  lines: {
    marginTop: 12,
    gap: 8,
  },
  line: {
    marginTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  listContent: {
    flex: 1,
  },
  list: {
    gap: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  container: {
    padding: 20,
  },
  tracker: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 16,
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
});
