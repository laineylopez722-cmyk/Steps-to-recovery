import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Skeleton } from './Skeleton';
import { darkAccent } from '../tokens/modern';
import { ds } from '../tokens/ds';

export interface AsyncImageProps {
  source: string;
  blurHash?: string;
  style?: StyleProp<ViewStyle>;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  transition?: number;
  priority?: 'low' | 'normal' | 'high';
  onLoad?: () => void;
  onError?: () => void;
}

export function AsyncImage({
  source,
  blurHash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
  style,
  contentFit = 'cover',
  transition = 300,
  priority = 'normal',
  onLoad,
  onError,
}: AsyncImageProps): React.ReactElement {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const opacity = useSharedValue(0);

  useEffect(() => {
    return () => {
      setIsLoaded(false);
      setHasError(false);
      opacity.value = 0;
    };
  }, [source]);

  const handleLoad = () => {
    setIsLoaded(true);
    opacity.value = withTiming(1, { duration: transition });
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (hasError) {
    return (
      <View style={[styles.errorContainer, style]}>
        <View style={styles.errorIcon}>
          <View style={styles.errorLine} />
          <View style={[styles.errorLine, styles.errorLine2]} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Blur Hash Placeholder */}
      {!isLoaded && (
        <Image
          source={{ uri: `https://blurha.sh/${blurHash}.jpg?width=32&height=32` }}
          style={[StyleSheet.absoluteFill, styles.blurPlaceholder]}
          contentFit="cover"
          transition={0}
        />
      )}

      {/* Skeleton while loading */}
      {!isLoaded && <Skeleton style={StyleSheet.absoluteFill} />}

      {/* Main Image */}
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <Image
          source={{ uri: source }}
          style={StyleSheet.absoluteFill}
          contentFit={contentFit}
          transition={transition}
          priority={priority}
          onLoad={handleLoad}
          onError={handleError}
          cachePolicy="memory-disk"
        />
      </Animated.View>
    </View>
  );
}

// Avatar with fallback
export interface AvatarProps {
  source?: string;
  name: string;
  size?: number;
  blurHash?: string;
}

export function Avatar({ source, name, size = 48, blurHash }: AvatarProps): React.ReactElement {
  const [hasError, setHasError] = useState(false);
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const backgroundColor = stringToColor(name);

  if (!source || hasError) {
    return (
      <View
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2, backgroundColor },
        ]}
      >
        <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{initials}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.avatarContainer, { width: size, height: size }]}>
      <AsyncImage
        source={source}
        blurHash={blurHash}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        onError={() => setHasError(true)}
      />
    </View>
  );
}

// Helper to generate color from string
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

// Zoomable Image
export interface ZoomableImageProps {
  source: string;
  style?: StyleProp<ViewStyle>;
}

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Text } from 'react-native';

export function ZoomableImage({ source, style }: ZoomableImageProps): React.ReactElement {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composed = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.zoomContainer, style]}>
        <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
          <AsyncImage source={source} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: darkAccent.surfaceHigh,
  },
  blurPlaceholder: {
    opacity: 0.5,
  },
  errorContainer: {
    backgroundColor: darkAccent.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorLine: {
    width: 30,
    height: 3,
    backgroundColor: darkAccent.textSubtle,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  errorLine2: {
    marginTop: -3,
    transform: [{ rotate: '-45deg' }],
  },
  avatarContainer: {
    overflow: 'hidden',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: ds.semantic.text.onDark,
    fontWeight: '700',
  },
  zoomContainer: {
    overflow: 'hidden',
  },
});
