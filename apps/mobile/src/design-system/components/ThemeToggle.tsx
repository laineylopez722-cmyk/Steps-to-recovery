import React from 'react';
import { View, Text, Pressable, StyleSheet, Appearance } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from './GlassCard';
import { darkAccent, radius, spacing, typography } from '../tokens/modern';
import { useHaptics } from '../../hooks/useHaptics';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

export function ThemeToggle({ currentTheme, onThemeChange }: ThemeToggleProps): React.ReactElement {
  const { light } = useHaptics();

  const handlePress = async (theme: ThemeMode) => {
    await light();
    onThemeChange(theme);
  };

  return (
    <GlassCard intensity="light" style={styles.container}>
      <Text style={styles.title}>Appearance</Text>
      
      <View style={styles.options}>
        <ThemeOption
          icon="brightness-5"
          label="Light"
          isSelected={currentTheme === 'light'}
          onPress={() => handlePress('light')}
          previewColors={['#FFFFFF', '#F5F5F5', '#007AFF']}
        />
        
        <ThemeOption
          icon="brightness-2"
          label="Dark"
          isSelected={currentTheme === 'dark'}
          onPress={() => handlePress('dark')}
          previewColors={['#0B1120', '#1A2332', '#6366F1']}
        />
        
        <ThemeOption
          icon="brightness-auto"
          label="System"
          isSelected={currentTheme === 'system'}
          onPress={() => handlePress('system')}
          previewColors={['#0B1120', '#FFFFFF', '#6366F1']}
        />
      </View>
    </GlassCard>
  );
}

interface ThemeOptionProps {
  icon: string;
  label: string;
  isSelected: boolean;
  onPress: () => void;
  previewColors: string[];
}

function ThemeOption({ icon, label, isSelected, onPress, previewColors }: ThemeOptionProps): React.ReactElement {
  const scale = useSharedValue(1);
  const checkProgress = useSharedValue(isSelected ? 1 : 0);

  React.useEffect(() => {
    checkProgress.value = withSpring(isSelected ? 1 : 0);
  }, [isSelected]);

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkProgress.value,
    transform: [{ scale: checkProgress.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.option}
    >
      <Animated.View style={[styles.optionCard, isSelected && styles.optionCardSelected, animatedStyle]}>
        {/* Preview */}
        <View style={styles.preview}>
          <View style={[styles.previewTop, { backgroundColor: previewColors[0] }]} />
          <View style={[styles.previewBottom, { backgroundColor: previewColors[1] }]} />
          <View style={[styles.previewAccent, { backgroundColor: previewColors[2] }]} />
        </View>

        {/* Selection Indicator */}
        <Animated.View style={[styles.checkmark, checkStyle]}>
          <MaterialIcons name="check-circle" size={20} color={darkAccent.success} />
        </Animated.View>

        {/* Label */}
        <View style={styles.labelContainer}>
          <MaterialIcons name={icon as any} size={18} color={isSelected ? darkAccent.primary : darkAccent.textMuted} />
          <Text style={[styles.label, isSelected && styles.labelSelected]}>{label}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// Animated theme transition wrapper
interface ThemeProviderProps {
  children: React.ReactNode;
  theme: ThemeMode;
}

export function AnimatedThemeProvider({ children, theme }: ThemeProviderProps): React.ReactElement {
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    // Fade out, then fade in on theme change
    opacity.value = withSpring(0.95, {}, () => {
      opacity.value = withSpring(1);
    });
  }, [theme]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing[3],
  },
  title: {
    ...typography.h4,
    color: darkAccent.text,
    marginBottom: spacing[3],
  },
  options: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  option: {
    flex: 1,
  },
  optionCard: {
    backgroundColor: darkAccent.surfaceHigh,
    borderRadius: radius.lg,
    padding: spacing[2],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: darkAccent.primary,
  },
  preview: {
    height: 60,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: spacing[2],
  },
  previewTop: {
    height: '60%',
  },
  previewBottom: {
    height: '40%',
  },
  previewAccent: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    bottom: 8,
    right: 8,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: darkAccent.surface,
    borderRadius: 10,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  label: {
    ...typography.bodySmall,
    color: darkAccent.textMuted,
    fontWeight: '500',
  },
  labelSelected: {
    color: darkAccent.primary,
    fontWeight: '700',
  },
});
