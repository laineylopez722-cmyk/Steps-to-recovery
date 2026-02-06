import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { darkAccent, radius, spacing, typography } from '../tokens/modern';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

export interface GlassListItemProps extends ViewProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  iconColor?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  pressed?: boolean;
  showChevron?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GlassListItem({
  title,
  subtitle,
  description,
  icon,
  iconColor = darkAccent.primary,
  rightElement,
  onPress,
  onLongPress,
  showChevron = true,
  style,
  children,
  ...props
}: GlassListItemProps): React.ReactElement {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        animatedStyle,
        style,
      ]}
      {...props}
    >
      {/* Glass Background */}
      <View style={styles.glassBackground} />
      
      {/* Border Gradient */}
      <View style={styles.borderGradient} />

      {/* Content */}
      <View style={styles.content}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
            <MaterialIcons name={icon as IconName} size={24} color={iconColor} />
          </View>
        )}
        
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
          {description && (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          )}
          {children}
        </View>

        {rightElement || (showChevron && onPress && (
          <MaterialIcons name="chevron-right" size={24} color={darkAccent.textSubtle} />
        ))}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing[2],
    marginBottom: spacing[2],
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  glassBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30,41,59,0.6)',
    borderRadius: radius.lg,
  },
  borderGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: darkAccent.primary,
    opacity: 0.2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[2.5],
    gap: spacing[2],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.bodyLarge,
    color: darkAccent.text,
    fontWeight: '600',
  },
  subtitle: {
    ...typography.bodySmall,
    color: darkAccent.textMuted,
    marginTop: 2,
  },
  description: {
    ...typography.bodySmall,
    color: darkAccent.textSubtle,
    marginTop: 4,
  },
});
