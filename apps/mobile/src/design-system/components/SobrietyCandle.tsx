/**
 * SobrietyCandle Component
 * 
 * Interactive candle that grows lighter and brighter as sobriety days increase.
 * - Candle height grows with days
 * - Flame size and intensity increases
 * - Glow becomes more pronounced
 * - Subtle flame animation
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import Svg, { Path, Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { ds } from '../tokens/ds';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

export interface SobrietyCandleProps {
  /** Number of days sober */
  days: number;
  /** Maximum days for full brightness (default: 365) */
  maxDays?: number;
  /** Size multiplier (default: 1) */
  size?: number;
  /** Called when candle is pressed */
  onPress?: () => void;
  /** Show day count inside candle */
  showDays?: boolean;
}

// Calculate candle properties based on days
function getCandleProperties(days: number, maxDays: number) {
  const progress = Math.min(days / maxDays, 1);
  
  // Candle grows from 40% to 100% height
  const heightPercent = 0.4 + (progress * 0.6);
  
  // Flame grows from 60% to 100% size
  const flameScale = 0.6 + (progress * 0.4);
  
  // Glow intensity from 20% to 100%
  const glowIntensity = 0.2 + (progress * 0.8);
  
  // Flame color shifts from dim orange to bright golden
  const flameColor = {
    inner: interpolateColor(
      progress,
      [0, 0.5, 1],
      ['#FF9500', '#FFB800', '#FFD700']
    ),
    outer: interpolateColor(
      progress,
      [0, 0.5, 1],
      ['#FF6B00', '#FF8C00', '#FFA500']
    ),
    tip: interpolateColor(
      progress,
      [0, 0.5, 1],
      ['#FF4500', '#FF6347', '#FF7F50']
    ),
  };
  
  return {
    heightPercent,
    flameScale,
    glowIntensity,
    flameColor,
    progress,
  };
}

export function SobrietyCandle({
  days,
  maxDays = 365,
  size = 1,
  onPress,
  showDays = false,
}: SobrietyCandleProps): React.ReactElement {
  const props = getCandleProperties(days, maxDays);
  
  // Animation values
  const flameFlicker = useSharedValue(0);
  const flameScale = useSharedValue(props.flameScale);
  const glowPulse = useSharedValue(0);
  
  // Flame flickering animation
  useEffect(() => {
    flameFlicker.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 150 + Math.random() * 100, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.7, { duration: 100 + Math.random() * 80 }),
        withTiming(0.9, { duration: 120 + Math.random() * 60 }),
        withTiming(0.6, { duration: 140 + Math.random() * 100 }),
      ),
      -1,
      false
    );
    
    // Glow pulse
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false
    );
  }, []);
  
  // Update flame scale when days change
  useEffect(() => {
    flameScale.value = withSpring(props.flameScale, { damping: 15 });
  }, [days, props.flameScale]);
  
  // Base dimensions
  const baseWidth = 60 * size;
  const maxHeight = 180 * size;
  const candleHeight = maxHeight * props.heightPercent;
  const flameBaseSize = 40 * size;
  
  // Animated styles
  const flameAnimatedStyle = useAnimatedStyle(() => {
    const flickerScale = interpolate(flameFlicker.value, [0, 1], [0.95, 1.05]);
    const flickerRotate = interpolate(flameFlicker.value, [0, 1], [-2, 2]);
    
    return {
      transform: [
        { scale: flameScale.value * flickerScale },
        { rotate: `${flickerRotate}deg` },
      ],
    };
  });
  
  const glowAnimatedStyle = useAnimatedStyle(() => {
    const pulseOpacity = interpolate(glowPulse.value, [0, 1], [0.6, 1]);
    const pulseScale = interpolate(glowPulse.value, [0, 1], [0.95, 1.05]);
    
    return {
      opacity: props.glowIntensity * pulseOpacity,
      transform: [{ scale: pulseScale }],
    };
  });
  
  const Container = onPress ? Pressable : View;
  
  return (
    <Container
      onPress={onPress}
      style={[styles.container, { width: baseWidth * 2.5, height: maxHeight + flameBaseSize * 1.5 }]}
    >
      {/* Outer glow */}
      <Animated.View
        style={[
          styles.glow,
          glowAnimatedStyle,
          {
            width: baseWidth * 3,
            height: candleHeight * 1.5,
            bottom: 0,
            backgroundColor: `rgba(255, 200, 100, ${props.glowIntensity * 0.15})`,
            borderRadius: baseWidth * 1.5,
          },
        ]}
      />
      
      {/* Inner glow around flame */}
      <Animated.View
        style={[
          styles.flameGlow,
          glowAnimatedStyle,
          {
            width: flameBaseSize * 2.5,
            height: flameBaseSize * 2.5,
            bottom: candleHeight - 10 * size,
            backgroundColor: `rgba(255, 180, 50, ${props.glowIntensity * 0.3})`,
            borderRadius: flameBaseSize * 1.25,
          },
        ]}
      />
      
      {/* Candle body */}
      <View
        style={[
          styles.candleBody,
          {
            width: baseWidth,
            height: candleHeight,
            borderRadius: baseWidth / 8,
          },
        ]}
      >
        <LinearGradient
          colors={['#FFF8E7', '#F5E6D3', '#E8D5C4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Wax drips */}
        <View style={[styles.waxDrip, { left: baseWidth * 0.15, height: candleHeight * 0.15 }]} />
        <View style={[styles.waxDrip, { right: baseWidth * 0.2, height: candleHeight * 0.1 }]} />
        
        {/* Day count display */}
        {showDays && (
          <View style={styles.dayCountContainer}>
            <Animated.Text style={[styles.dayCount, { fontSize: 18 * size }]}>
              {days}
            </Animated.Text>
          </View>
        )}
      </View>
      
      {/* Wick */}
      <View
        style={[
          styles.wick,
          {
            width: 3 * size,
            height: 12 * size,
            bottom: candleHeight,
          },
        ]}
      />
      
      {/* Flame */}
      <Animated.View
        style={[
          styles.flame,
          flameAnimatedStyle,
          {
            bottom: candleHeight + 8 * size,
            width: flameBaseSize,
            height: flameBaseSize * 1.5,
          },
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 40 60">
          <Defs>
            <RadialGradient id="flameGradient" cx="50%" cy="70%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#FFFDE7" stopOpacity="1" />
              <Stop offset="30%" stopColor="#FFD54F" stopOpacity="0.95" />
              <Stop offset="60%" stopColor="#FF9800" stopOpacity="0.85" />
              <Stop offset="100%" stopColor="#FF5722" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          
          {/* Outer flame */}
          <Path
            d="M20 5 C10 20, 5 35, 20 55 C35 35, 30 20, 20 5"
            fill="url(#flameGradient)"
          />
          
          {/* Inner bright core */}
          <Path
            d="M20 15 C15 25, 12 35, 20 48 C28 35, 25 25, 20 15"
            fill="#FFFDE7"
            opacity={0.9}
          />
        </Svg>
      </Animated.View>
      
      {/* Flame tip spark (for higher days) */}
      {props.progress > 0.3 && (
        <Animated.View
          style={[
            styles.spark,
            flameAnimatedStyle,
            {
              bottom: candleHeight + flameBaseSize * 1.3,
              opacity: props.progress * 0.6,
            },
          ]}
        />
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  glow: {
    position: 'absolute',
    alignSelf: 'center',
  },
  flameGlow: {
    position: 'absolute',
    alignSelf: 'center',
  },
  candleBody: {
    overflow: 'hidden',
    // Subtle shadow for depth
    shadowColor: ds.colors.shadow,
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  waxDrip: {
    position: 'absolute',
    top: -5,
    width: 8,
    backgroundColor: ds.colors.bgPrimary,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  wick: {
    position: 'absolute',
    backgroundColor: ds.colors.bgQuaternary,
    borderRadius: 1,
    alignSelf: 'center',
  },
  flame: {
    position: 'absolute',
    alignSelf: 'center',
  },
  spark: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: ds.colors.warning,
    borderRadius: 2,
    alignSelf: 'center',
  },
  dayCountContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dayCount: {
    color: '#8B7355',
    fontWeight: '700',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
