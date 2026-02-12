/**
 * iOS-style Button Component
 * Replaces react-native-paper Button with custom iOS design
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
  Animated,
  View,
  type AccessibilityRole,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { usePressAnimation } from '../hooks/useAnimation';
import { hapticImpact } from '../../utils/haptics';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityHint?: string;
  accessibilityState?: { disabled?: boolean };
  testID?: string;
}

const sizeStyles = {
  small: { paddingVertical: 8, paddingHorizontal: 16, minHeight: 36 },
  medium: { paddingVertical: 12, paddingHorizontal: 20, minHeight: 44 },
  large: { paddingVertical: 16, paddingHorizontal: 24, minHeight: 52 },
};

const textSizes = {
  small: 14,
  medium: 16,
  large: 18,
};

export function Button({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = true,
  icon,
  style,
  textStyle: customTextStyle,
  accessibilityLabel,
  accessibilityRole,
  accessibilityHint,
  accessibilityState,
  testID,
}: ButtonProps) {
  const theme = useTheme();
  const { scaleAnim, animatePress } = usePressAnimation(theme.animations.scales.press);
  const isDisabled = disabled || loading;

  // Determine colors based on variant
  const getColors = () => {
    switch (variant) {
      case 'primary':
        return {
          background: theme.colors.primary,
          text: '#FFFFFF',
          indicator: '#FFFFFF',
        };
      case 'secondary':
        return {
          background: theme.colors.secondary,
          text: '#FFFFFF',
          indicator: '#FFFFFF',
        };
      case 'danger':
        return {
          background: theme.colors.danger,
          text: '#FFFFFF',
          indicator: '#FFFFFF',
        };
      case 'outline':
        return {
          background: 'transparent',
          text: theme.colors.primary,
          indicator: theme.colors.primary,
        };
      default:
        return {
          background: theme.colors.primary,
          text: '#FFFFFF',
          indicator: '#FFFFFF',
        };
    }
  };

  const colors = getColors();

  const handlePress = (): void => {
    if (!isDisabled) {
      // Fire-and-forget — never block onPress on haptic feedback
      hapticImpact('light').catch(() => {});
    }
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={() => !isDisabled && animatePress(true)}
      onPressOut={() => !isDisabled && animatePress(false)}
      disabled={isDisabled}
      activeOpacity={0.9}
      accessibilityLabel={
        accessibilityLabel || title || (typeof children === 'string' ? children : undefined)
      }
      accessibilityRole={accessibilityRole || 'button'}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ ...accessibilityState, disabled: isDisabled, busy: loading }}
      testID={testID}
      style={[styles.touchable, fullWidth && styles.fullWidth]}
    >
      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor: colors.background,
            borderRadius: theme.radius.button,
            opacity: isDisabled ? theme.animations.opacities.disabled : 1,
            transform: [{ scale: scaleAnim }],
          },
          variant === 'outline' && {
            borderWidth: 2,
            borderColor: theme.colors.primary,
          },
          sizeStyles[size],
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.indicator} size="small" />
        ) : (
          <View style={styles.content}>
            {icon ? (
              <View key="icon" style={styles.iconContainer}>
                {icon}
              </View>
            ) : null}
            {typeof children === 'string' || title ? (
              <Text
                key="label"
                style={[
                  {
                    fontSize: textSizes[size],
                    fontWeight: '600',
                    color: colors.text,
                  },
                  customTextStyle,
                ]}
              >
                {children || title}
              </Text>
            ) : (
              <React.Fragment key="children">{children}</React.Fragment>
            )}
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    alignSelf: 'flex-start',
  },
  fullWidth: {
    width: '100%',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
});
