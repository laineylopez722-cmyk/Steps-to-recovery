/**
 * iOS-style Modal Component
 * Provides bottom sheet and centered modal variants
 * Replaces Alert dialogs with accessible, iOS-style confirmations
 */

import React, { useEffect } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Button } from './Button';
import Animated, { type AnimatedProps, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import type { ReactElement } from 'react';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type ModalVariant = 'center' | 'bottom';

export interface ModalAction {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  accessibilityLabel?: string;
}

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  variant?: ModalVariant;
  actions?: ModalAction[];
  children?: React.ReactNode;
  dismissable?: boolean;
  testID?: string;
}

export function Modal({
  visible,
  onClose,
  title,
  message,
  variant = 'center',
  actions = [],
  children,
  dismissable = true,
  testID,
}: ModalProps): ReactElement {
  const theme = useTheme();
    const slideAnim = useSharedValue(SCREEN_HEIGHT);
  const fadeAnim = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Animate in
                        fadeAnim.value = withTiming(1, { duration: theme.animations.durations.normal });
      if (variant === 'bottom') {
        slideAnim.value = withSpring(0, { damping: 25, stiffness: 300 });
      } else {
        slideAnim.value = withTiming(0, { duration: 0 });
      }
    } else {
      // Animate out
      fadeAnim.value = withTiming(0, { duration: theme.animations.durations.fast });
    }
  }, [visible, variant, slideAnim, fadeAnim, theme.animations.durations]);

  const handleBackdropPress = (): void => {
    if (dismissable) {
      onClose();
    }
  };

  const containerStyle: ViewStyle =
    variant === 'center' ? styles.centerContainer : styles.bottomContainer;

  const contentStyle: ViewStyle =
      variant === 'center' ? styles.centerContent : styles.bottomContent;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      testID={testID}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              backgroundColor: theme.colors.overlay,
              opacity: fadeAnim.value,
            },
          ]}
        >
          <TouchableWithoutFeedback>
            <Animated.View style={[containerStyle, contentStyle as ViewStyle & AnimatedProps<ViewStyle> ]}>
              {/* Header */}
              {title && (
                <View style={styles.header}>
                  <Text
                    style={[theme.typography.h3, { color: theme.colors.text, textAlign: 'center' }]}
                    accessibilityRole="header"
                  >
                    {title}
                  </Text>
                </View>
              )}

              {/* Message */}
              {message && (
                <View style={styles.messageContainer}>
                  <Text
                    style={[
                      theme.typography.body,
                      {
                        color: theme.colors.textSecondary,
                        textAlign: 'center',
                        lineHeight: 22,
                      },
                    ]}
                  >
                    {message}
                  </Text>
                </View>
              )}

              {/* Custom Content */}
              {children && <View style={styles.childrenContainer}>{children}</View>}

              {/* Actions */}
              {actions.length > 0 && (
                <View style={[styles.actionsContainer, actions.length === 2 && styles.actionsRow]}>
                  {actions.map((action, index) => (
                    <Button
                      key={index}
                      title={action.title}
                      onPress={() => {
                        action.onPress();
                        onClose();
                      }}
                      variant={action.variant || 'primary'}
                      size="medium"
                      fullWidth={actions.length !== 2}
                      style={[
                        actions.length === 2 ? { flex: 1 } : undefined,
                        index > 0 && actions.length === 2
                          ? { marginLeft: theme.spacing.sm }
                          : undefined,
                        index > 0 && actions.length !== 2
                          ? { marginTop: theme.spacing.sm }
                          : undefined,
                      ].filter(Boolean)}
                      accessibilityLabel={action.accessibilityLabel || action.title}
                    />
                  ))}
                </View>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    maxWidth: '85%',
    width: 320,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  centerContent: {
    padding: 24,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  bottomContent: {
    padding: 24,
    paddingBottom: 34, // Extra padding for iPhone home indicator
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
  header: {
    marginBottom: 12,
  },
  messageContainer: {
    marginBottom: 24,
  },
  childrenContainer: {
    marginBottom: 24,
  },
  actionsContainer: {
    width: '100%',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
