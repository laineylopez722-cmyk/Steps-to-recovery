/**
 * Keytag Wall Component
 * Displays NA keytags in a visual grid with accessibility support
 *
 * Features:
 * - Grid layout for keytags
 * - Full accessibility support
 * - Progress indicators for upcoming keytags
 * - Micro-interactions on press
 * - Featured keytag display for home screen
 */

import { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { GlassCard } from '../../design-system/components';
import type { KeytagWithStatus } from '@recovery/shared';
import type { ReactElement } from 'react';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { ds } from '../../design-system/tokens/ds';

interface KeytagWallProps {
  keytags: KeytagWithStatus[];
  onKeytagPress?: (keytag: KeytagWithStatus) => void;
  /** Delay index for staggered entrance animation */
  enteringDelay?: number;
}

export const KeytagWall = memo(function KeytagWall({
  keytags,
  onKeytagPress,
  enteringDelay = 0,
}: KeytagWallProps): ReactElement {
  const earnedCount = keytags.filter((k) => k.isEarned).length;

  return (
    <Animated.View entering={FadeIn.delay(enteringDelay * 100)}>
      <GlassCard gradient="card" style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Feather name="award" size={20} color={ds.colors.warning} />
            <Text style={styles.headerTitle}>Keytags</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerCount}>
              {earnedCount} of {keytags.length}
            </Text>
          </View>
        </View>

        {/* Keytag Grid */}
        <View
          style={styles.grid}
          accessibilityLabel={`Keytag collection, ${earnedCount} of ${keytags.length} earned`}
        >
          {keytags.map((keytag, index) => (
            <View key={keytag.id} style={styles.gridCell}>
              <KeytagItem
                keytag={keytag}
                onPress={() => onKeytagPress?.(keytag)}
                delay={index * 30}
              />
            </View>
          ))}
        </View>
      </GlassCard>
    </Animated.View>
  );
});

interface KeytagItemProps {
  keytag: KeytagWithStatus;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  delay?: number;
}

export const KeytagItem = memo(function KeytagItem({
  keytag,
  onPress,
  size = 'medium',
  delay = 0,
}: KeytagItemProps): ReactElement {
  const { hexColor, title, days, isEarned, progress } = keytag;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePress = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.();
  }, [onPress]);

  // Size configurations
  const sizes = {
    small: { container: 48, font: 10, label: 10 },
    medium: { container: 64, font: 14, label: 12 },
    large: { container: 80, font: 18, label: 14 },
  };

  const currentSize = sizes[size];

  // Special handling for white keytag visibility
  const isWhite = keytag.color === 'white';
  const needsDarkText = isWhite || keytag.color === 'yellow';

  // Get accessibility label
  const accessibilityLabel = `${title}${isEarned ? ', earned' : progress ? `, ${Math.round(progress)}% progress` : ', not yet earned'}`;

  return (
    <Animated.View entering={FadeIn.delay(delay)} style={animatedStyle}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        accessibilityRole={onPress ? 'button' : 'text'}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={onPress ? 'Tap to view keytag details' : undefined}
        accessibilityState={{ disabled: !isEarned }}
        style={styles.keytagTouchable}
      >
        {/* Keytag circle */}
        <View
          style={[
            styles.keytagCircle,
            {
              width: currentSize.container,
              height: currentSize.container,
              backgroundColor: isEarned ? hexColor : ds.colors.textSecondary,
              opacity: isEarned ? 1 : 0.5,
              borderWidth: isWhite && isEarned ? 2 : 0,
              borderColor: ds.colors.borderSubtle,
            },
          ]}
        >
          {/* Keytag hole */}
          <View style={styles.keytagHole} />

          {/* Days text */}
          <Text
            style={[
              styles.keytagText,
              {
                fontSize: currentSize.font,
                color: needsDarkText ? ds.colors.text : ds.semantic.text.onDark,
              },
            ]}
          >
            {days === 0 ? 'JFT' : formatDays(days)}
          </Text>

          {/* Earned indicator */}
          {isEarned && (
            <View style={styles.earnedBadge}>
              <Feather name="check" size={currentSize.font * 0.6} color={ds.semantic.text.onDark} />
            </View>
          )}
        </View>

        {/* Label */}
        <Text
          style={[
            styles.keytagLabel,
            {
              fontSize: currentSize.label,
              color: isEarned ? ds.semantic.text.onDark : ds.colors.textSecondary,
            },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>

        {/* Progress indicator for next keytag */}
        {!isEarned && progress !== undefined && progress > 0 && size !== 'small' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

/**
 * Featured keytag display for home screen
 */
export const FeaturedKeytag = memo(function FeaturedKeytag({
  current,
  next,
  onPress,
  enteringDelay = 0,
}: {
  current: KeytagWithStatus | null;
  next: KeytagWithStatus | null;
  onPress?: () => void;
  enteringDelay?: number;
}): ReactElement | null {
  if (!current) return null as unknown as ReactElement;

  const handlePress = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.();
  }, [onPress]);

  return (
    <Animated.View entering={FadeIn.delay(enteringDelay * 100)}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Current keytag: ${current.title}. Next: ${next?.title} in ${next?.daysUntil} days`}
        accessibilityHint="Tap to view all keytags"
      >
        <GlassCard gradient="elevated" style={styles.featuredContainer}>
          <Text style={styles.featuredTitle}>Current Keytag</Text>
          <KeytagItem keytag={current} size="large" />
          {next && (
            <View style={styles.nextContainer}>
              <Feather
                name="arrow-right"
                size={14}
                color={ds.colors.textSecondary}
                style={styles.nextIcon}
              />
              <Text style={styles.nextText}>
                Next: {next.title} in {next.daysUntil} days
              </Text>
            </View>
          )}
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
});

export const formatDays = (days: number): string => {
  if (days >= 730) return `${Math.floor(days / 365)}Y`;
  if (days >= 365) return '1Y';
  if (days >= 30) return `${Math.floor(days / 30)}M`;
  return `${days}`;
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ds.semantic.text.onDark,
  },
  headerBadge: {
    backgroundColor: ds.colors.warningMuted,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerCount: {
    fontSize: 14,
    fontWeight: '500',
    color: ds.colors.warning,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  gridCell: {
    alignItems: 'center',
  },
  keytagTouchable: {
    alignItems: 'center',
  },
  keytagCircle: {
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  keytagHole: {
    position: 'absolute',
    top: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ds.colors.shadow,
    opacity: 0.3,
  },
  keytagText: {
    fontWeight: 'bold',
  },
  keytagLabel: {
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 80,
  },
  earnedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: ds.colors.success,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    width: '100%',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  progressTrack: {
    height: 4,
    backgroundColor: ds.colors.bgTertiary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ds.colors.info,
    borderRadius: 2,
  },
  featuredContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 20,
    alignItems: 'center',
  },
  featuredTitle: {
    fontSize: 14,
    color: ds.colors.textSecondary,
    marginBottom: 12,
  },
  nextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  nextIcon: {
    marginRight: 6,
  },
  nextText: {
    fontSize: 14,
    color: ds.colors.textTertiary,
  },
});
