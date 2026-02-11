/**
 * SOSOverlay Component
 *
 * Full-screen emergency overlay with large action buttons for crisis situations.
 * Uses animated slide-up entrance and grid layout with 64dp minimum touch targets.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  AccessibilityInfo,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDs } from '../../../design-system/DsProvider';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { hapticHeavy } from '../../../utils/haptics';
import { useSOSActions } from '../hooks/useSOSActions';
import { type SOSAction } from '../types';

interface SOSOverlayProps {
  visible: boolean;
  onClose: () => void;
}

const ICON_MAP: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  phone: 'phone',
  'phone-alert': 'phone-alert',
  lungs: 'lungs',
  'shield-check': 'shield-check',
  hospital: 'hospital-building',
  pencil: 'pencil',
};

function resolveIcon(iconName: string): keyof typeof MaterialCommunityIcons.glyphMap {
  return ICON_MAP[iconName] ?? 'help-circle';
}

function SOSActionButton({
  action,
  onPress,
  disabled,
  ds,
  styles,
}: {
  action: SOSAction;
  onPress: (action: SOSAction) => Promise<void>;
  disabled: boolean;
  ds: DS;
  styles: ReturnType<typeof createStyles>;
}): React.ReactElement {
  const handlePress = async (): Promise<void> => {
    await onPress(action);
  };

  const isCallAction = action.type === 'call';

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionButton,
        isCallAction && styles.actionButtonCall,
        pressed && styles.actionButtonPressed,
        disabled && styles.actionButtonDisabled,
      ]}
      accessibilityLabel={action.label}
      accessibilityRole="button"
      accessibilityHint={
        isCallAction
          ? `Calls ${action.target === 'sponsor' ? 'your sponsor' : action.target}`
          : `Opens ${action.label}`
      }
      accessibilityState={{ disabled }}
    >
      <MaterialCommunityIcons
        name={resolveIcon(action.icon)}
        size={32}
        color={isCallAction ? ds.palette.white : ds.semantic.text.primary}
      />
      <Text style={[styles.actionLabel, isCallAction && styles.actionLabelCall]} numberOfLines={2}>
        {action.label}
      </Text>
    </Pressable>
  );
}

export function SOSOverlay({ visible, onClose }: SOSOverlayProps): React.ReactElement {
  const ds = useDs();
  const styles = useThemedStyles(createStyles);
  const { actions, executeAction, isExecuting } = useSOSActions();

  const translateY = useSharedValue(300);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });
      translateY.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) });
      AccessibilityInfo.announceForAccessibility(
        'Emergency actions opened. Choose an action for immediate help.',
      );
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(300, { duration: 200 });
    }
  }, [visible, opacity, translateY]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleClose = async (): Promise<void> => {
    await hapticHeavy();
    onClose();
  };

  const handleAction = async (action: SOSAction): Promise<void> => {
    await executeAction(action);
    if (action.type === 'navigate') {
      onClose();
    }
  };

  const sortedActions = [...actions].sort((a, b) => a.priority - b.priority);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable
          style={styles.backdropTouchable}
          onPress={handleClose}
          accessibilityLabel="Close emergency actions"
          accessibilityRole="button"
        />

        <Animated.View style={[styles.content, contentStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialCommunityIcons
              name="shield-alert"
              size={28}
              color={ds.semantic.emergency.calm}
            />
            <Text style={styles.title}>Emergency Actions</Text>
          </View>

          {/* Action Grid */}
          <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {sortedActions.map((action) => (
              <SOSActionButton
                key={action.id}
                action={action}
                onPress={handleAction}
                disabled={isExecuting}
                ds={ds}
                styles={styles}
              />
            ))}
          </ScrollView>

          {/* Dismiss Button */}
          <Pressable
            onPress={handleClose}
            style={styles.dismissButton}
            accessibilityLabel="Dismiss emergency actions"
            accessibilityRole="button"
            accessibilityHint="Closes the emergency actions overlay"
          >
            <Text style={styles.dismissText}>I'm OK — Close</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const createStyles = (ds: DS) =>
  ({
    backdrop: {
      flex: 1,
      backgroundColor: ds.semantic.surface.overlayModal,
      justifyContent: 'flex-end',
    },
    backdropTouchable: {
      flex: 1,
    },
    content: {
      backgroundColor: ds.semantic.surface.elevated,
      borderTopLeftRadius: ds.radius['2xl'],
      borderTopRightRadius: ds.radius['2xl'],
      paddingTop: ds.space[6],
      paddingHorizontal: ds.space[6],
      paddingBottom: ds.space[10],
      maxHeight: '85%',
    } as ViewStyle,
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ds.space[3],
      marginBottom: ds.space[6],
    } as ViewStyle,
    title: {
      ...ds.typography.h2,
      color: ds.semantic.text.primary,
    } as TextStyle,
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: ds.space[3],
      paddingBottom: ds.space[4],
    } as ViewStyle,
    actionButton: {
      width: '47%',
      minHeight: 100,
      backgroundColor: ds.semantic.surface.card,
      borderRadius: ds.radius.lg,
      padding: ds.space[4],
      alignItems: 'center',
      justifyContent: 'center',
      gap: ds.space[2],
      borderWidth: 1,
      borderColor: ds.colors.borderDefault,
    } as ViewStyle,
    actionButtonCall: {
      backgroundColor: ds.semantic.emergency.calm,
      borderColor: ds.semantic.emergency.calm,
    } as ViewStyle,
    actionButtonPressed: {
      opacity: 0.7,
      transform: [{ scale: 0.97 }],
    } as ViewStyle,
    actionButtonDisabled: {
      opacity: 0.5,
    } as ViewStyle,
    actionLabel: {
      ...ds.typography.bodySm,
      fontWeight: ds.fontWeight.semibold,
      color: ds.semantic.text.primary,
      textAlign: 'center',
    } as TextStyle,
    actionLabelCall: {
      color: ds.palette.white,
    } as TextStyle,
    dismissButton: {
      alignSelf: 'center',
      paddingVertical: ds.space[4],
      paddingHorizontal: ds.space[8],
      borderRadius: ds.radius.full,
      backgroundColor: ds.semantic.surface.interactive,
      minHeight: 48,
      minWidth: 200,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    dismissText: {
      ...ds.typography.body,
      fontWeight: ds.fontWeight.semibold,
      color: ds.semantic.text.secondary,
    } as TextStyle,
  }) as const;
