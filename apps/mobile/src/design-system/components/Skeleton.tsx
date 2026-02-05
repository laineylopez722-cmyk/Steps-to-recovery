import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { darkAccent, radius } from '../tokens/modern';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = radius.md,
  style,
}: SkeletonProps): React.ReactElement {
  const translateX = useSharedValue(-SCREEN_WIDTH);

  React.useEffect(() => {
    translateX.value = withRepeat(
      withTiming(SCREEN_WIDTH, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const widthStyle = typeof width === 'number' ? { width } : { width: width as string };

  return (
    <View style={[styles.container, { height, borderRadius }, widthStyle, style]}>
      <View style={[styles.background, { borderRadius }]} />
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.08)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

// Preset skeleton layouts
export function SkeletonCard(): React.ReactElement {
  return (
    <View style={styles.card}>
      <Skeleton width="60%" height={20} style={styles.mb12} />
      <Skeleton width="90%" height={14} style={styles.mb8} />
      <Skeleton width="75%" height={14} />
    </View>
  );
}

export function SkeletonListItem(): React.ReactElement {
  return (
    <View style={styles.listItem}>
      <Skeleton width={48} height={48} borderRadius={radius.lg} />
      <View style={styles.listItemContent}>
        <Skeleton width="70%" height={16} style={styles.mb8} />
        <Skeleton width="50%" height={12} />
      </View>
    </View>
  );
}

export function SkeletonStats(): React.ReactElement {
  return (
    <View style={styles.statsRow}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.statItem}>
          <Skeleton width={40} height={32} style={[styles.mb8, { alignSelf: 'center' }]} />
          <Skeleton width={60} height={12} style={{ alignSelf: 'center' }} />
        </View>
      ))}
    </View>
  );
}

export function SkeletonHome(): React.ReactElement {
  return (
    <View style={styles.page}>
      {/* Header */}
      <Skeleton width={150} height={28} style={styles.mb24} />
      
      {/* Counter Card */}
      <SkeletonCard />
      
      {/* Check-in Card */}
      <View style={styles.card}>
        <Skeleton width="40%" height={18} style={styles.mb16} />
        <View style={styles.row}>
          <Skeleton width="48%" height={60} borderRadius={radius.lg} />
          <Skeleton width="48%" height={60} borderRadius={radius.lg} />
        </View>
      </View>
      
      {/* Action Grid */}
      <Skeleton width={100} height={20} style={styles.mb16} />
      <View style={styles.grid}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} width="47%" height={80} borderRadius={radius.lg} />
        ))}
      </View>
    </View>
  );
}

export function SkeletonJournalList(): React.ReactElement {
  return (
    <View style={styles.page}>
      <Skeleton width={120} height={32} style={styles.mb16} />
      <Skeleton width="100%" height={48} borderRadius={radius.lg} style={styles.mb16} />
      <SkeletonStats />
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonListItem key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: darkAccent.surfaceHigh,
    overflow: 'hidden',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: darkAccent.surfaceHigh,
  },
  page: {
    padding: 16,
  },
  card: {
    backgroundColor: darkAccent.surfaceHigh,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    marginBottom: 8,
  },
  listItemContent: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mb8: {
    marginBottom: 8,
  },
  mb12: {
    marginBottom: 12,
  },
  mb16: {
    marginBottom: 16,
  },
  mb24: {
    marginBottom: 24,
  },
});
