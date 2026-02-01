/**
 * Gesture-Enabled Bottom Sheet Component
 * Modal-style sheet that slides up from the bottom with drag-to-dismiss
 *
 * Uses react-native-gesture-handler and react-native-reanimated for smooth gestures.
 */

import React, { useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useTheme } from '../hooks/useTheme';
import { hapticTick } from '../../utils/haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_TRANSLATE_Y = -SCREEN_HEIGHT;

export interface BottomSheetRef {
  /**
   * Expand the sheet to a specific snap point
   */
  expand: (snapPoint?: number) => void;
  /**
   * Collapse the sheet to minimum height
   */
  collapse: () => void;
  /**
   * Close the sheet completely
   */
  close: () => void;
  /**
   * Check if sheet is open
   */
  isOpen: () => boolean;
}

export interface BottomSheetProps {
  /**
   * Content to display in the sheet
   */
  children: React.ReactNode;
  /**
   * Whether the sheet is visible
   */
  visible: boolean;
  /**
   * Callback when sheet is closed
   */
  onClose: () => void;
  /**
   * Snap points as percentages of screen height (0-100)
   * @default [25, 50, 90]
   */
  snapPoints?: number[];
  /**
   * Initial snap point index
   * @default 1
   */
  initialSnapIndex?: number;
  /**
   * Whether to show drag handle
   * @default true
   */
  showHandle?: boolean;
  /**
   * Whether backdrop dismisses the sheet
   * @default true
   */
  backdropDismiss?: boolean;
  /**
   * Whether to enable keyboard avoidance
   * @default true
   */
  keyboardAvoidance?: boolean;
  /**
   * Title to display at the top
   */
  title?: string;
  /**
   * Test ID for testing
   */
  testID?: string;
}

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(function BottomSheet(
  {
    children,
    visible,
    onClose,
    snapPoints = [25, 50, 90],
    initialSnapIndex = 1,
    showHandle = true,
    backdropDismiss = true,
    keyboardAvoidance = true,
    title,
    testID,
  },
  ref,
): React.ReactElement | null {
  const theme = useTheme();

  // Convert snap points to translateY values (negative from bottom)
  const snapPointsY = snapPoints.map((point) => -(SCREEN_HEIGHT * point) / 100);

  // Animation values
  const translateY = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const currentSnapIndex = useSharedValue(initialSnapIndex);
  const isOpenRef = useSharedValue(false);

  // Spring config for smooth animations
  const springConfig = {
    damping: 25,
    stiffness: 300,
    mass: 0.5,
  };

  // Haptic feedback for snap points
  const triggerSnapHaptic = useCallback(() => {
    hapticTick();
  }, []);

  // Close handler
  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  // Expand to snap point
  const expand = useCallback(
    (snapIndex: number = initialSnapIndex) => {
      const targetY = snapPointsY[Math.min(snapIndex, snapPointsY.length - 1)];
      translateY.value = withSpring(targetY, springConfig);
      backdropOpacity.value = withTiming(1, { duration: 200 });
      currentSnapIndex.value = snapIndex;
      isOpenRef.value = true;
      runOnJS(triggerSnapHaptic)();
    },
    [snapPointsY, initialSnapIndex, springConfig],
  );

  // Collapse to minimum
  const collapse = useCallback(() => {
    translateY.value = withSpring(snapPointsY[0], springConfig);
    currentSnapIndex.value = 0;
    runOnJS(triggerSnapHaptic)();
  }, [snapPointsY, springConfig]);

  // Close sheet
  const close = useCallback(() => {
    translateY.value = withSpring(0, springConfig);
    backdropOpacity.value = withTiming(0, { duration: 200 });
    isOpenRef.value = false;
    runOnJS(handleClose)();
  }, [handleClose, springConfig]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    expand: (snapPoint?: number) => expand(snapPoint ?? initialSnapIndex),
    collapse,
    close,
    isOpen: () => isOpenRef.value,
  }));

  // Open/close effect
  useEffect(() => {
    if (visible) {
      expand(initialSnapIndex);
    } else {
      translateY.value = withSpring(0, springConfig);
      backdropOpacity.value = withTiming(0, { duration: 200 });
      isOpenRef.value = false;
    }
  }, [visible, initialSnapIndex]);

  // Find nearest snap point
  const findNearestSnapPoint = (y: number): number => {
    let nearestIndex = 0;
    let minDistance = Math.abs(y - snapPointsY[0]);

    for (let i = 1; i < snapPointsY.length; i++) {
      const distance = Math.abs(y - snapPointsY[i]);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }

    return nearestIndex;
  };

  // Pan gesture for dragging
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const newTranslateY = snapPointsY[currentSnapIndex.value] + event.translationY;

      // Allow dragging down past closed position (for dismiss gesture)
      // Resist dragging up past max height
      if (newTranslateY > 0) {
        translateY.value = newTranslateY * 0.5; // Resistance when pulling down past close
      } else if (newTranslateY < MAX_TRANSLATE_Y) {
        translateY.value = MAX_TRANSLATE_Y + (newTranslateY - MAX_TRANSLATE_Y) * 0.2;
      } else {
        translateY.value = newTranslateY;
      }

      // Update backdrop opacity based on position
      const progress = Math.abs(translateY.value) / Math.abs(snapPointsY[snapPointsY.length - 1]);
      backdropOpacity.value = Math.min(progress, 1);
    })
    .onEnd((event) => {
      const velocity = event.velocityY;

      // Fling down to close
      if (velocity > 500) {
        runOnJS(close)();
        return;
      }

      // Fling up to expand
      if (velocity < -500) {
        const nextIndex = Math.min(currentSnapIndex.value + 1, snapPointsY.length - 1);
        translateY.value = withSpring(snapPointsY[nextIndex], springConfig);
        currentSnapIndex.value = nextIndex;
        backdropOpacity.value = withTiming(1, { duration: 200 });
        runOnJS(triggerSnapHaptic)();
        return;
      }

      // If dragged below close threshold, close
      if (translateY.value > -50) {
        runOnJS(close)();
        return;
      }

      // Snap to nearest point
      const nearestIndex = findNearestSnapPoint(translateY.value);
      translateY.value = withSpring(snapPointsY[nearestIndex], springConfig);
      currentSnapIndex.value = nearestIndex;
      backdropOpacity.value = withTiming(1, { duration: 200 });
      runOnJS(triggerSnapHaptic)();
    });

  // Animated styles
  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  const content = (
    <View style={styles.container} testID={testID}>
      {/* Backdrop */}
      <TouchableWithoutFeedback
        onPress={backdropDismiss ? close : undefined}
        accessibilityLabel="Close sheet"
        accessibilityRole="button"
      >
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          {Platform.OS !== 'web' ? (
            <BlurView
              intensity={20}
              tint={theme.isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)' },
              ]}
            />
          )}
        </Animated.View>
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.radius.xl,
              borderTopRightRadius: theme.radius.xl,
              ...(theme.isDark ? theme.shadows.lgDark : theme.shadows.lg),
            },
            sheetAnimatedStyle,
          ]}
        >
          {/* Handle */}
          {showHandle && (
            <View style={styles.handleContainer}>
              <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
            </View>
          )}

          {/* Title */}
          {title && (
            <View style={styles.titleContainer}>
              <Animated.Text
                style={[styles.title, theme.typography.h3, { color: theme.colors.text }]}
              >
                {title}
              </Animated.Text>
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </GestureDetector>
    </View>
  );

  // Wrap with keyboard avoiding view if needed
  if (keyboardAvoidance) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={close}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {content}
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={close}
      statusBarTranslucent
    >
      {content}
    </Modal>
  );
});

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    height: SCREEN_HEIGHT,
    position: 'absolute',
    top: SCREEN_HEIGHT,
    left: 0,
    right: 0,
    paddingBottom: 40,
  },
  handleContainer: {
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
});

export default BottomSheet;
