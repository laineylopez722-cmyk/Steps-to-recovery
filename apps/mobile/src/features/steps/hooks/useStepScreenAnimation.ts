import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

interface UseStepScreenAnimationResult {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

export function useStepScreenAnimation(): UseStepScreenAnimationResult {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return {
    fadeAnim,
    slideAnim,
  };
}
