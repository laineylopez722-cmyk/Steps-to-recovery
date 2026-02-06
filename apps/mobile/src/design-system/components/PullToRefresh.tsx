import React, { useEffect } from 'react';
import { View, StyleSheet, type RefreshControlProps } from 'react-native';
import Animated, {
  type SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { darkAccent, radius } from '../tokens/modern';

export interface PullToRefreshProps extends RefreshControlProps {
  scrollY: SharedValue<number>;
}

const _AnimatedIcon = Animated.createAnimatedComponent(MaterialIcons);

export function PullToRefresh({
  refreshing,
  onRefresh: _onRefresh,
  scrollY,
}: PullToRefreshProps): React.ReactElement {
  const rotation = useSharedValue(0);
  const _scale = useSharedValue(1);

  useEffect(() => {
    if (refreshing) {
      rotation.value = withTiming(360, { duration: 1000 });
    } else {
      rotation.value = 0;
    }
  }, [refreshing]);

  const containerStyle = useAnimatedStyle(() => {
    const pullDistance = Math.max(0, -scrollY.value);
    const progress = Math.min(pullDistance / 100, 1);
    
    return {
      opacity: interpolate(
        progress,
        [0, 0.5, 1],
        [0, 0.5, 1],
        Extrapolate.CLAMP
      ),
      transform: [
        {
          translateY: interpolate(
            progress,
            [0, 1],
            [-50, 20],
            Extrapolate.CLAMP
          ),
        },
        { scale: interpolate(progress, [0, 1], [0.5, 1]) },
      ],
    };
  });

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(
          rotation.value,
          [0, 360],
          [0, 360]
        )}deg`,
      },
    ],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.indicator}>
        <Animated.View style={iconStyle}>
          <MaterialIcons
            name={refreshing ? 'refresh' : 'arrow-downward'}
            size={24}
            color={darkAccent.primary}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  indicator: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: darkAccent.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});
