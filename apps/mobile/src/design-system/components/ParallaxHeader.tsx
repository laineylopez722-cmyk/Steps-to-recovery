import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { darkAccent, gradients, spacing, typography } from '../tokens/modern';
import { useThemedStyles, type DS } from '../hooks/useThemedStyles';

const { width: _SCREEN_WIDTH } = Dimensions.get('window');

interface ParallaxHeaderProps {
  scrollY: SharedValue<number>;
  title: string;
  subtitle?: string;
  image?: React.ReactNode;
  height?: number;
  collapsedHeight?: number;
}

export function ParallaxHeader({
  scrollY,
  title,
  subtitle,
  image,
  height = 250,
  collapsedHeight = 60,
}: ParallaxHeaderProps): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const imageStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, height],
      [0, height * 0.5],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      scrollY.value,
      [-height, 0, height],
      [1.5, 1, 1],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(scrollY.value, [0, height * 0.8], [1, 0], Extrapolation.CLAMP);

    return {
      transform: [{ translateY }, { scale }],
      opacity,
    };
  });

  const titleStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, height - collapsedHeight],
      [0, -height + collapsedHeight],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      scrollY.value,
      [0, height - collapsedHeight],
      [1, 0.8],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollY.value,
      [0, (height - collapsedHeight) * 0.5],
      [1, 0],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ translateY }, { scale }],
      opacity,
    };
  });

  const collapsedTitleStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [(height - collapsedHeight) * 0.5, height - collapsedHeight],
      [0, 1],
      Extrapolation.CLAMP,
    );

    return { opacity };
  });

  const gradientStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, height * 0.5], [0, 1], Extrapolation.CLAMP);

    return { opacity };
  });

  return (
    <View style={[styles.container, { height }]}>
      {/* Background Image/Content */}
      <Animated.View style={[styles.imageContainer, imageStyle]}>
        {image || (
          <LinearGradient
            colors={gradients.primary}
            style={styles.defaultGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
      </Animated.View>

      {/* Fade Overlay */}
      <Animated.View style={[styles.gradientOverlay, gradientStyle]}>
        <LinearGradient
          colors={[darkAccent.background, 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
        />
      </Animated.View>

      {/* Expanded Title */}
      <Animated.View style={[styles.titleContainer, titleStyle]}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </Animated.View>

      {/* Collapsed Title */}
      <Animated.View style={[styles.collapsedTitleContainer, collapsedTitleStyle]}>
        <Text style={styles.collapsedTitle}>{title}</Text>
      </Animated.View>
    </View>
  );
}

// Parallax Scroll View wrapper
interface ParallaxScrollViewProps {
  children: React.ReactNode;
  headerTitle: string;
  headerSubtitle?: string;
  headerHeight?: number;
  headerImage?: React.ReactNode;
}

export function ParallaxScrollView({
  children,
  headerTitle,
  headerSubtitle,
  headerHeight = 250,
  headerImage,
}: ParallaxScrollViewProps): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return (
    <View style={styles.scrollContainer}>
      <ParallaxHeader
        scrollY={scrollY}
        title={headerTitle}
        subtitle={headerSubtitle}
        image={headerImage}
        height={headerHeight}
      />
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight }]}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </Animated.ScrollView>
    </View>
  );
}

// Sticky Section Header
interface StickyHeaderProps {
  scrollY: SharedValue<number>;
  title: string;
  threshold: number;
}

export function StickyHeader({ scrollY, title, threshold }: StickyHeaderProps): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const style = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [threshold, threshold + 60],
      [-60, 0],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollY.value,
      [threshold, threshold + 60],
      [0, 1],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.stickyHeader, style]}>
      <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
      <Text style={styles.stickyTitle}>{title}</Text>
    </Animated.View>
  );
}

const createStyles = (ds: DS) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      overflow: 'hidden',
    },
    imageContainer: {
      ...StyleSheet.absoluteFillObject,
    },
    defaultGradient: {
      flex: 1,
    },
    gradientOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    titleContainer: {
      position: 'absolute',
      bottom: spacing[4],
      left: spacing[4],
      right: spacing[4],
    },
    title: {
      ...typography.h1,
      color: ds.semantic.text.onDark,
      textShadowColor: ds.colors.shadow,
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    subtitle: {
      ...typography.bodyLarge,
      color: ds.semantic.text.onDark,
      opacity: 0.8,
      marginTop: spacing[1],
      textShadowColor: ds.colors.shadow,
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    collapsedTitleContainer: {
      position: 'absolute',
      bottom: spacing[2],
      left: spacing[4],
      right: spacing[4],
    },
    collapsedTitle: {
      ...typography.h3,
      color: darkAccent.text,
    },
    scrollContainer: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing[3],
    },
    stickyHeader: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 60,
      justifyContent: 'flex-end',
      paddingHorizontal: spacing[4],
      paddingBottom: spacing[2],
      zIndex: 100,
    },
    stickyTitle: {
      ...typography.h3,
      color: darkAccent.text,
    },
  });
