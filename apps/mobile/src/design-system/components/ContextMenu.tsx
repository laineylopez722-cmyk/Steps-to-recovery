/**
 * iOS-style Context Menu Component
 * Long-press activated menu with scale animation and blur background
 *
 * Uses react-native-gesture-handler and react-native-reanimated for smooth interactions.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Text,
  Dimensions,
  Platform,
  type LayoutRectangle,
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
import { hapticImpact, hapticSelection } from '../../utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const LONG_PRESS_DURATION = 500;

export interface ContextMenuItem {
  /**
   * Unique key for the item
   */
  key: string;
  /**
   * Display label
   */
  label: string;
  /**
   * Icon to display (React element)
   */
  icon?: React.ReactNode;
  /**
   * Whether this is a destructive action (shows in red)
   */
  destructive?: boolean;
  /**
   * Whether this item is disabled
   */
  disabled?: boolean;
  /**
   * Callback when item is pressed
   */
  onPress: () => void;
}

export interface ContextMenuProps {
  /**
   * Content that triggers the context menu on long-press
   */
  children: React.ReactNode;
  /**
   * Menu items to display
   */
  items: ContextMenuItem[];
  /**
   * Whether the menu is enabled
   * @default true
   */
  enabled?: boolean;
  /**
   * Long press duration in ms
   * @default 500
   */
  longPressDuration?: number;
  /**
   * Called when menu opens
   */
  onOpen?: () => void;
  /**
   * Called when menu closes
   */
  onClose?: () => void;
  /**
   * Test ID for testing
   */
  testID?: string;
}

export function ContextMenu({
  children,
  items,
  enabled = true,
  longPressDuration = LONG_PRESS_DURATION,
  onOpen,
  onClose,
  testID,
}: ContextMenuProps): React.ReactElement {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [triggerLayout, setTriggerLayout] = useState<LayoutRectangle | null>(null);
  const triggerRef = useRef<View>(null);

  // Animation values
  const menuScale = useSharedValue(0);
  const menuOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const triggerScale = useSharedValue(1);

  // Haptic feedback
  const triggerOpenHaptic = useCallback(() => {
    hapticImpact('medium');
  }, []);

  const triggerSelectHaptic = useCallback(() => {
    hapticSelection();
  }, []);

  // Open menu
  const openMenu = useCallback(() => {
    // Measure trigger position
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setTriggerLayout({ x, y, width, height });
      setIsVisible(true);
      onOpen?.();

      // Animate in
      backdropOpacity.value = withTiming(1, { duration: 200 });
      menuScale.value = withSpring(1, { damping: 15, stiffness: 300 });
      menuOpacity.value = withTiming(1, { duration: 150 });
    });
  }, [onOpen]);

  // Close menu
  const closeMenu = useCallback(() => {
    // Animate out
    backdropOpacity.value = withTiming(0, { duration: 150 });
    menuScale.value = withSpring(0.8, { damping: 20, stiffness: 300 });
    menuOpacity.value = withTiming(0, { duration: 150 });
    triggerScale.value = withSpring(1, { damping: 15, stiffness: 200 });

    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 150);
  }, [onClose]);

  // Handle item press
  const handleItemPress = useCallback(
    (item: ContextMenuItem) => {
      if (item.disabled) return;
      triggerSelectHaptic();
      closeMenu();
      // Small delay to let animation complete
      setTimeout(() => item.onPress(), 100);
    },
    [closeMenu, triggerSelectHaptic],
  );

  // Long press gesture
  const longPressGesture = Gesture.LongPress()
    .enabled(enabled)
    .minDuration(longPressDuration)
    .onStart(() => {
      runOnJS(triggerOpenHaptic)();
      triggerScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
      runOnJS(openMenu)();
    });

  // Calculate menu position
  const getMenuPosition = (): { top?: number; bottom?: number; left?: number; right?: number } => {
    if (!triggerLayout) return { top: SCREEN_HEIGHT / 2, left: SCREEN_WIDTH / 2 };

    const menuWidth = 200;
    const menuHeight = items.length * 48 + 16;

    let top = triggerLayout.y + triggerLayout.height + 8;
    let left = triggerLayout.x;

    // Adjust if menu would go off screen
    if (top + menuHeight > SCREEN_HEIGHT - 40) {
      top = triggerLayout.y - menuHeight - 8;
    }

    if (left + menuWidth > SCREEN_WIDTH - 20) {
      left = SCREEN_WIDTH - menuWidth - 20;
    }

    if (left < 20) {
      left = 20;
    }

    return { top, left };
  };

  // Animated styles
  const triggerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: triggerScale.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const menuAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: menuScale.value }],
    opacity: menuOpacity.value,
  }));

  const menuPosition = getMenuPosition();

  return (
    <>
      {/* Trigger */}
      <GestureDetector gesture={longPressGesture}>
        <Animated.View ref={triggerRef} style={triggerAnimatedStyle} testID={testID}>
          {children}
        </Animated.View>
      </GestureDetector>

      {/* Menu Modal */}
      <Modal
        visible={isVisible}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
        statusBarTranslucent
      >
        {/* Backdrop */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeMenu}>
          <Animated.View style={[StyleSheet.absoluteFill, backdropAnimatedStyle]}>
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
                  { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)' },
                ]}
              />
            )}
          </Animated.View>
        </TouchableOpacity>

        {/* Menu */}
        <Animated.View
          style={[
            styles.menu,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.lg,
              ...(theme.isDark ? theme.shadows.lgDark : theme.shadows.lg),
              ...menuPosition,
            },
            menuAnimatedStyle,
          ]}
        >
          {items.map((item, index) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.menuItem,
                index < items.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: theme.colors.border,
                },
                item.disabled && styles.menuItemDisabled,
              ]}
              onPress={() => handleItemPress(item)}
              disabled={item.disabled}
              accessibilityLabel={item.label}
              accessibilityRole="menuitem"
              accessibilityState={{ disabled: item.disabled }}
            >
              {item.icon && <View style={styles.menuItemIcon}>{item.icon}</View>}
              <Text
                style={[
                  styles.menuItemLabel,
                  theme.typography.body,
                  {
                    color: item.destructive
                      ? theme.colors.danger
                      : item.disabled
                        ? theme.colors.textTertiary
                        : theme.colors.text,
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    minWidth: 200,
    maxWidth: 280,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuItemIcon: {
    marginRight: 12,
    width: 24,
    alignItems: 'center',
  },
  menuItemLabel: {
    flex: 1,
  },
});

