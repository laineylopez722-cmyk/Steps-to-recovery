import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { darkAccent, gradients, radius, spacing, typography } from '../tokens/modern';
import { LinearGradient } from 'expo-linear-gradient';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastContextType {
  showToast: (
    message: string,
    type: ToastType,
    options?: { duration?: number; action?: { label: string; onPress: () => void } },
  ) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (
      message: string,
      type: ToastType,
      options?: { duration?: number; action?: { label: string; onPress: () => void } },
    ) => {
      const id = Math.random().toString(36).substr(2, 9);
      const toast: Toast = {
        id,
        message,
        type,
        duration: options?.duration || 4000,
        action: options?.action,
      };
      setToasts((prev) => [...prev, toast]);
    },
    [],
  );

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((toast, index) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            index={index}
            onDismiss={() => hideToast(toast.id)}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

// Individual Toast Item
function ToastItem({
  toast,
  index,
  onDismiss,
}: {
  toast: Toast;
  index: number;
  onDismiss: (() => void) | undefined;
}) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    // Entrance animation
    translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSpring(1);

    // Auto dismiss
    const timer = setTimeout(() => {
      translateY.value = withSpring(-100, {}, () => {
        if (typeof onDismiss === 'function') {
          onDismiss();
        }
      });
      opacity.value = withTiming(0);
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast.duration, onDismiss, translateY, opacity, scale, toast.type]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const iconConfig: Record<
    ToastType,
    { icon: IconName; color: string; gradient: readonly string[] }
  > = {
    success: { icon: 'check-circle', color: darkAccent.success, gradient: gradients.success },
    error: { icon: 'error', color: darkAccent.error, gradient: ['#DC2626', '#EF4444'] },
    warning: { icon: 'warning', color: darkAccent.warning, gradient: ['#D97706', '#F59E0B'] },
    info: { icon: 'info', color: darkAccent.primary, gradient: gradients.primary },
  };

  const { icon, color, gradient: _gradient } = iconConfig[toast.type];

  return (
    <Animated.View style={[styles.toast, animatedStyle, { top: 60 + index * 80 }]}>
      <BlurView intensity={40} style={StyleSheet.absoluteFill} tint="dark" />
      <LinearGradient
        colors={[`${color}20`, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <MaterialIcons name={icon as IconName} size={20} color="#FFF" />
      </View>

      <View style={styles.content}>
        <Text style={styles.message}>{toast.message}</Text>
        {toast.action && (
          <Pressable onPress={toast.action.onPress} style={styles.action}>
            <Text style={[styles.actionText, { color }]}>{toast.action.label}</Text>
          </Pressable>
        )}
      </View>

      <Pressable onPress={onDismiss} style={styles.closeButton}>
        <MaterialIcons name="close" size={18} color={darkAccent.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

// Toast hook helper for common patterns
export function useToastHelpers() {
  const { showToast } = useToast();

  return {
    success: (
      message: string,
      options?: { duration?: number; action?: { label: string; onPress: () => void } },
    ) => showToast(message, 'success', options),
    error: (
      message: string,
      options?: { duration?: number; action?: { label: string; onPress: () => void } },
    ) => showToast(message, 'error', options),
    warning: (
      message: string,
      options?: { duration?: number; action?: { label: string; onPress: () => void } },
    ) => showToast(message, 'warning', options),
    info: (
      message: string,
      options?: { duration?: number; action?: { label: string; onPress: () => void } },
    ) => showToast(message, 'info', options),
  };
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  toast: {
    position: 'absolute',
    left: spacing[3],
    right: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkAccent.surface,
    borderRadius: radius.lg,
    padding: spacing[2.5],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[2],
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    ...typography.body,
    color: darkAccent.text,
    flex: 1,
  },
  action: {
    marginLeft: spacing[2],
  },
  actionText: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  closeButton: {
    padding: spacing[1],
    marginLeft: spacing[1],
  },
});
