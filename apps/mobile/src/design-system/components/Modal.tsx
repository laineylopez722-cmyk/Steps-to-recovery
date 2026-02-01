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
  Animated,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Button } from './Button';

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
}: ModalProps): React.ReactElement {
  const theme = useTheme();
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: theme.animations.durations.normal,
          useNativeDriver: true,
        }),
        variant === 'bottom'
          ? Animated.spring(slideAnim, {
              toValue: 0,
              tension: 65,
              friction: 11,
              useNativeDriver: true,
            })
          : Animated.timing(slideAnim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: theme.animations.durations.fast,
          useNativeDriver: true,
        }),
        variant === 'bottom'
          ? Animated.timing(slideAnim, {
              toValue: SCREEN_HEIGHT,
              duration: theme.animations.durations.fast,
              useNativeDriver: true,
            })
          : Animated.timing(slideAnim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
      ]).start();
    }
  }, [visible, variant, slideAnim, fadeAnim, theme.animations.durations]);

  const handleBackdropPress = (): void => {
    if (dismissable) {
      onClose();
    }
  };

  const containerStyle: ViewStyle =
    variant === 'center' ? styles.centerContainer : styles.bottomContainer;

  const contentStyle: Animated.AnimatedProps<ViewStyle> =
    variant === 'center'
      ? {
          ...styles.centerContent,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.modal,
          ...(!theme.isDark ? theme.shadows.lg : theme.shadows.lgDark),
        }
      : {
          ...styles.bottomContent,
          backgroundColor: theme.colors.surface,
          borderTopLeftRadius: theme.radius.modal,
          borderTopRightRadius: theme.radius.modal,
          ...(!theme.isDark ? theme.shadows.xl : theme.shadows.xlDark),
          transform: [{ translateY: slideAnim }],
        };

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
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableWithoutFeedback>
            <Animated.View style={[containerStyle, contentStyle]}>
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
