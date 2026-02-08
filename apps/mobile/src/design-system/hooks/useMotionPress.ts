import { useCallback } from 'react';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { motionScale, motionSpring } from '../tokens/motion';

interface UseMotionPressOptions {
  scaleTo?: number;
}

/**
 * Shared press interaction for cards/buttons.
 * Uses single spring preset to avoid inconsistent touch feedback.
 */
export function useMotionPress(options: UseMotionPressOptions = {}) {
  const scale = useSharedValue<number>(motionScale.resting);
  const scaleTo = options.scaleTo ?? motionScale.pressCard;

  const onPressIn = useCallback(() => {
    scale.value = withSpring(scaleTo, motionSpring.press);
  }, [scale, scaleTo]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(motionScale.resting, motionSpring.smooth);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { onPressIn, onPressOut, animatedStyle };
}
