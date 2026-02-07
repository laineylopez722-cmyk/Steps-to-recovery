/**
 * Swipeable List Item Component
 * Gesture-enabled list item with swipe actions for delete, edit, share
 *
 * Uses react-native-gesture-handler and react-native-reanimated for smooth 60fps gestures.
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, type ViewStyle, Text, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { hapticThreshold, hapticImpact } from '../../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ACTION_WIDTH = 80;
const DELETE_THRESHOLD = -ACTION_WIDTH * 0.75;
// EDIT_THRESHOLD reserved for future right-swipe edit feature

const _EDIT_THRESHOLD = ACTION_WIDTH * 0.75;

export interface SwipeAction {
  /**
   * Unique key for the action
   */
  key: string;
  /**
   * Icon to display (React element)
   */
  icon: React.ReactNode;
  /**
   * Label text under the icon
   */
  label?: string;
  /**
   * Background color for the action
   */
  backgroundColor: string;
  /**
   * Callback when action is triggered
   */
  onPress: () => void;
}

export interface SwipeableListItemProps {
  /**
   * Content to display in the list item
   */
  children: React.ReactNode;
  /**
   * Actions shown when swiping left (delete, archive, etc.)
   */
  rightActions?: SwipeAction[];
  /**
   * Actions shown when swiping right (edit, share, etc.)
   */
  leftActions?: SwipeAction[];
  /**
   * Whether swipe is enabled
   * @default true
   */
  enabled?: boolean;
  /**
   * Called when swipe reaches delete threshold (optional auto-delete)
   */
  onSwipeDelete?: () => void;
  /**
   * Custom container style
   */
  style?: ViewStyle;
  /**
   * Test ID for testing
   */
  testID?: string;
}

export function SwipeableListItem({
  children,
  rightActions = [],
  leftActions = [],
  enabled = true,
  onSwipeDelete,
  style,
  testID,
}: SwipeableListItemProps): React.ReactElement {
  const theme = useTheme();

  // Shared value for tracking swipe position
  const translateX = useSharedValue(0);
  const hasTriggeredThreshold = useSharedValue(false);

  // Calculate total action widths
  const rightActionsWidth = rightActions.length * ACTION_WIDTH;
  const leftActionsWidth = leftActions.length * ACTION_WIDTH;

  // Haptic feedback when crossing threshold
  const triggerThresholdHaptic = useCallback(() => {
    hapticThreshold();
  }, []);

  // Trigger action
  const triggerAction = useCallback((action: SwipeAction) => {
    hapticImpact('medium');
    action.onPress();
  }, []);

  // Handle delete swipe completion
  const handleSwipeDelete = useCallback(() => {
    if (onSwipeDelete) {
      hapticImpact('heavy');
      onSwipeDelete();
    }
  }, [onSwipeDelete]);

  // Pan gesture handler
  const panGesture = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      // Clamp translation to action widths
      const maxLeft = leftActionsWidth;
      const maxRight = -rightActionsWidth - (onSwipeDelete ? ACTION_WIDTH : 0);

      // Apply resistance when going beyond max
      if (event.translationX > maxLeft) {
        const overscroll = event.translationX - maxLeft;
        translateX.value = maxLeft + overscroll * 0.3;
      } else if (event.translationX < maxRight) {
        const overscroll = event.translationX - maxRight;
        translateX.value = maxRight + overscroll * 0.3;
      } else {
        translateX.value = event.translationX;
      }

      // Check threshold for delete
      if (onSwipeDelete && translateX.value < DELETE_THRESHOLD && !hasTriggeredThreshold.value) {
        hasTriggeredThreshold.value = true;
        runOnJS(triggerThresholdHaptic)();
      } else if (translateX.value >= DELETE_THRESHOLD) {
        hasTriggeredThreshold.value = false;
      }
    })
    .onEnd((event) => {
      const velocity = event.velocityX;

      // Check if should trigger delete
      if (onSwipeDelete && translateX.value < DELETE_THRESHOLD * 1.5) {
        runOnJS(handleSwipeDelete)();
        translateX.value = withSpring(-SCREEN_WIDTH, { damping: 20, stiffness: 200 });
        return;
      }

      // Determine final position based on velocity and position
      if (velocity > 500 && leftActions.length > 0) {
        // Fling right - open left actions
        translateX.value = withSpring(leftActionsWidth, { damping: 20, stiffness: 200 });
      } else if (velocity < -500 && rightActions.length > 0) {
        // Fling left - open right actions
        translateX.value = withSpring(-rightActionsWidth, { damping: 20, stiffness: 200 });
      } else if (translateX.value > leftActionsWidth / 2) {
        // Snap open to left actions
        translateX.value = withSpring(leftActionsWidth, { damping: 20, stiffness: 200 });
      } else if (translateX.value < -rightActionsWidth / 2) {
        // Snap open to right actions
        translateX.value = withSpring(-rightActionsWidth, { damping: 20, stiffness: 200 });
      } else {
        // Snap closed
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      }

      hasTriggeredThreshold.value = false;
    });

  // Animated style for main content
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Animated style for right actions container
  const rightActionsAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: Math.abs(translateX.value),
      opacity: interpolate(translateX.value, [-rightActionsWidth, 0], [1, 0], Extrapolation.CLAMP),
    };
  });

  // Animated style for left actions container
  const leftActionsAnimatedStyle = useAnimatedStyle(() => ({
    width: translateX.value > 0 ? translateX.value : 0,
    opacity: interpolate(translateX.value, [0, leftActionsWidth], [0, 1], Extrapolation.CLAMP),
  }));

  // Render action button
  const renderAction = (
    action: SwipeAction,
    _index: number,
    _isRight: boolean,
  ): React.ReactElement => {
    return (
      <Animated.View
        key={action.key}
        style={[
          styles.actionButton,
          {
            backgroundColor: action.backgroundColor,
            width: ACTION_WIDTH,
          },
        ]}
      >
        <View
          style={styles.actionContent}
          onTouchEnd={() => {
            triggerAction(action);
            translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
          }}
        >
          {action.icon}
          {action.label && (
            <Text style={[styles.actionLabel, { color: '#FFFFFF' }]}>{action.label}</Text>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* Left Actions (shown when swiping right) */}
      {leftActions.length > 0 && (
        <Animated.View
          style={[styles.actionsContainer, styles.leftActions, leftActionsAnimatedStyle]}
        >
          {leftActions.map((action, index) => renderAction(action, index, false))}
        </Animated.View>
      )}

      {/* Right Actions (shown when swiping left) */}
      {rightActions.length > 0 && (
        <Animated.View
          style={[styles.actionsContainer, styles.rightActions, rightActionsAnimatedStyle]}
        >
          {rightActions.map((action, index) => renderAction(action, index, true))}
        </Animated.View>
      )}

      {/* Main Content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[styles.content, { backgroundColor: theme.colors.surface }, contentAnimatedStyle]}
        >
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    zIndex: 1,
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
  },
  leftActions: {
    left: 0,
    justifyContent: 'flex-start',
  },
  rightActions: {
    right: 0,
    justifyContent: 'flex-end',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
