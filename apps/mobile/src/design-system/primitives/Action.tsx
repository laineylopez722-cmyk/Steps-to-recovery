import React from 'react';
import {
  Pressable,
  View,
  Text,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import { useMotionPress } from '../hooks/useMotionPress';

export interface UseActionMotionOptions {
  disabled?: boolean;
  scaleTo?: number;
}

/**
 * Shared motion behavior for pressable primitives.
 */
export function useActionMotion(options: UseActionMotionOptions = {}) {
  const { disabled, scaleTo } = options;
  const motion = useMotionPress({ scaleTo });

  return {
    animatedStyle: disabled ? undefined : motion.animatedStyle,
    onPressIn: disabled ? undefined : motion.onPressIn,
    onPressOut: disabled ? undefined : motion.onPressOut,
  };
}

export interface ActionRootProps extends PressableProps {
  containerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  animatedStyle?: AnimatedStyle<StyleProp<ViewStyle>>;
  scaleTo?: number;
  children: React.ReactNode;
}

function Root({
  children,
  containerStyle,
  contentStyle,
  animatedStyle,
  scaleTo,
  disabled,
  onPressIn,
  onPressOut,
  ...pressableProps
}: ActionRootProps): React.ReactElement {
  const isDisabled = Boolean(disabled);
  const motion = useActionMotion({ disabled: isDisabled, scaleTo });

  return (
    <Pressable
      disabled={isDisabled}
      style={containerStyle}
      onPressIn={(event) => {
        motion.onPressIn?.();
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        motion.onPressOut?.();
        onPressOut?.(event);
      }}
      {...pressableProps}
    >
      <Animated.View style={[contentStyle, motion.animatedStyle, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

function Icon({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }): React.ReactElement {
  return <View style={style}>{children}</View>;
}

function Content({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }): React.ReactElement {
  return <View style={style}>{children}</View>;
}

function Title({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }): React.ReactElement {
  return <Text style={style}>{children}</Text>;
}

function Subtitle({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }): React.ReactElement {
  return <Text style={style}>{children}</Text>;
}

function Trailing({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }): React.ReactElement {
  return <View style={style}>{children}</View>;
}

export const Action = {
  Root,
  Icon,
  Content,
  Title,
  Subtitle,
  Trailing,
};
