import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { darkAccent, radius, spacing, typography } from '../tokens/modern';
import { useHaptics } from '../../hooks/useHaptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: number[];
  showDragHandle?: boolean;
  showCloseButton?: boolean;
}

export function BottomSheet({
  isVisible,
  onClose,
  title,
  children,
  snapPoints = [50, 75],
  showDragHandle = true,
  showCloseButton = true,
}: BottomSheetProps): React.ReactElement | null {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);
  const { medium } = useHaptics();

  useEffect(() => {
    if (isVisible) {
      translateY.value = withSpring(0, { damping: 25, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withSpring(SCREEN_HEIGHT, { damping: 25, stiffness: 300 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isVisible]);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        translateY.value = withSpring(SCREEN_HEIGHT, {}, () => {
          runOnJS(onClose)();
        });
      } else {
        translateY.value = withSpring(0);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleClose = useCallback(async () => {
    await medium();
    onClose();
  }, [onClose, medium]);

  if (!isVisible && translateY.value === SCREEN_HEIGHT) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isVisible ? 'auto' : 'none'}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* Sheet */}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.sheet, sheetStyle]}>
          {/* Drag Handle */}
          {showDragHandle && (
            <View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </View>
          )}

          {/* Header */}
          {(title || showCloseButton) && (
            <View style={styles.header}>
              {title && <Text style={styles.title}>{title}</Text>}
              {showCloseButton && (
                <Pressable onPress={handleClose} style={styles.closeButton}>
                  <MaterialIcons name="close" size={24} color={darkAccent.text} />
                </Pressable>
              )}
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// Action Sheet Item
interface ActionSheetItemProps {
  icon?: string;
  title: string;
  subtitle?: string;
  destructive?: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function ActionSheetItem({
  icon,
  title,
  subtitle,
  destructive = false,
  onPress,
  disabled = false,
}: ActionSheetItemProps): React.ReactElement {
  const { light } = useHaptics();

  const handlePress = async () => {
    await light();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionItem,
        pressed && styles.actionItemPressed,
        disabled && styles.actionItemDisabled,
      ]}
    >
      {icon && (
        <MaterialIcons
          name={icon as any}
          size={24}
          color={destructive ? darkAccent.error : darkAccent.primary}
          style={styles.actionIcon}
        />
      )}
      <View style={styles.actionTextContainer}>
        <Text
          style={[
            styles.actionTitle,
            destructive && { color: darkAccent.error },
          ]}
        >
          {title}
        </Text>
        {subtitle && <Text style={styles.actionSubtitle}>{subtitle}</Text>}
      </View>
      <MaterialIcons name="chevron-right" size={20} color={darkAccent.textSubtle} />
    </Pressable>
  );
}

// Action Sheet Divider
export function ActionSheetDivider(): React.ReactElement {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: darkAccent.surface,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    maxHeight: SCREEN_HEIGHT * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: spacing[2],
    paddingBottom: spacing[1],
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: darkAccent.textSubtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
    paddingBottom: spacing[2],
  },
  title: {
    ...typography.h3,
    color: darkAccent.text,
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    backgroundColor: darkAccent.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing[3],
    paddingTop: 0,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    backgroundColor: darkAccent.surfaceHigh,
    borderRadius: radius.lg,
    marginBottom: spacing[2],
  },
  actionItemPressed: {
    backgroundColor: darkAccent.background,
  },
  actionItemDisabled: {
    opacity: 0.5,
  },
  actionIcon: {
    marginRight: spacing[3],
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    ...typography.bodyLarge,
    color: darkAccent.text,
    fontWeight: '600',
  },
  actionSubtitle: {
    ...typography.bodySmall,
    color: darkAccent.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: darkAccent.border,
    marginVertical: spacing[2],
  },
});
