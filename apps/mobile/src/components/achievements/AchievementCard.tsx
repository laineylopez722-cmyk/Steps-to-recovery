/**
 * Achievement Card Components
 * Displays achievements with status, progress, and interactive states
 *
 * Features:
 * - Multiple display variants (card and badge)
 * - Progress visualization for in-progress achievements
 * - Accessibility support with proper ARIA labels
 * - Theme-aware styling with dark mode support
 * - Error handling for malformed data
 * - Performance optimized with React.memo
 *
 * @see Achievement type for data structure
 */

import { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Card } from '../../design-system/components';
import { useTheme } from '../../design-system/hooks/useTheme';
import type { Achievement } from '../../types';
import { logger } from '../../utils/logger';
import type { ReactElement } from 'react';

/**
 * Props for the AchievementCard component
 */
interface AchievementCardProps {
  /**
   * Achievement data to display
   */
  achievement: Achievement;
  /**
   * Callback fired when the card is pressed
   * If provided, the card becomes interactive
   */
  onPress?: () => void;
  /**
   * Whether to show progress bar for in-progress achievements
   * @default true
   */
  showProgress?: boolean;
  /**
   * Additional CSS classes to apply to the card
   */
  className?: string;
}

/**
 * Achievement Card Component
 *
 * Displays an achievement with its status, progress, and optional interaction.
 * Supports different achievement states: locked, in_progress, and unlocked.
 *
 * @param props - Component props
 * @returns Achievement card component
 */
export const AchievementCard = memo(function AchievementCard({
  achievement,
  onPress,
  showProgress = true,
  className: _className = '',
}: AchievementCardProps): ReactElement {
  // className kept for API compatibility, not currently used in render
  void _className;
  const theme = useTheme();

  // Validate achievement data
  if (!achievement || typeof achievement !== 'object') {
    logger.warn('AchievementCard: Invalid achievement data provided', { achievement });
    return null as unknown as ReactElement;
  }

  const { title, description, icon, status, current, target, unlockedAt } = achievement;

  // Memoize computed values for performance
  const achievementState = useMemo(() => {
    const isUnlocked = status === 'unlocked';
    const isInProgress = status === 'in_progress';
    const isLocked = status === 'locked';

    // Calculate progress safely
    let progress = 0;
    if (isInProgress && target && current && target > 0) {
      progress = Math.min(Math.max((current / target) * 100, 0), 100);
    }

    return {
      isUnlocked,
      isInProgress,
      isLocked,
      progress,
      progressText: target && current ? `${current} / ${target}` : '',
    };
  }, [status, current, target]);

  const { isUnlocked, isInProgress, isLocked, progress, progressText } = achievementState;

  // Determine accessibility properties
  const isInteractive = Boolean(onPress);

  // Generate accessibility label
  const accessibilityLabel = useMemo(() => {
    const baseLabel = `${title}: ${description}`;
    if (isUnlocked) {
      const dateText = unlockedAt ? ` unlocked ${formatDate(unlockedAt)}` : ' unlocked';
      return baseLabel + dateText;
    }
    if (isInProgress && progressText) {
      return `${baseLabel}. Progress: ${progressText}, ${Math.round(progress)}% complete`;
    }
    return `${baseLabel}. Locked`;
  }, [title, description, isUnlocked, isInProgress, unlockedAt, progressText, progress]);

  // Build card style for additional styling (border-left, opacity)
  const cardStyle = useMemo(() => {
    const styles: { borderLeftWidth?: number; borderLeftColor?: string; opacity?: number } = {};

    if (isUnlocked) {
      styles.borderLeftWidth = 4;
      styles.borderLeftColor = theme.colors.secondary;
    }
    if (isLocked) {
      styles.opacity = 0.6;
    }

    return Object.keys(styles).length > 0 ? styles : undefined;
  }, [isUnlocked, isLocked, theme.colors.secondary]);

  return (
    <Card
      variant={isUnlocked ? 'elevated' : 'outlined'}
      onPress={onPress}
      style={cardStyle}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={isInteractive ? 'button' : 'text'}
      accessibilityHint={isInteractive ? 'Tap to view achievement details' : undefined}
    >
      <View className="flex-row items-center gap-3">
        {/* Achievement Icon */}
        <View
          className={`w-12 h-12 rounded-full items-center justify-center ${
            isUnlocked
              ? 'bg-secondary-100 dark:bg-secondary-900'
              : 'bg-surface-100 dark:bg-surface-700'
          }`}
          accessibilityRole="image"
          accessibilityLabel={`Achievement icon: ${icon || 'unknown'}`}
        >
          <Text className="text-2xl" accessibilityElementsHidden>
            {icon || '🏆'}
          </Text>
        </View>

        {/* Achievement Content */}
        <View className="flex-1">
          <Text
            className={`text-base font-semibold ${
              isUnlocked
                ? 'text-surface-900 dark:text-surface-100'
                : 'text-surface-600 dark:text-surface-400'
            }`}
            accessibilityRole="header"
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {title || 'Unnamed Achievement'}
          </Text>
          <Text
            className="text-sm text-surface-500 dark:text-surface-400"
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {description || 'No description available'}
          </Text>
        </View>

        {/* Status Indicator */}
        {isUnlocked && (
          <View
            className="items-center"
            accessibilityRole="text"
            accessibilityLabel={`Achievement unlocked${unlockedAt ? ` on ${formatDate(unlockedAt)}` : ''}`}
          >
            <Text className="text-secondary-500 text-lg" accessibilityElementsHidden>
              ✓
            </Text>
            {unlockedAt && (
              <Text className="text-xs text-surface-400" accessibilityElementsHidden>
                {formatDate(unlockedAt)}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Progress Bar for In-Progress Achievements */}
      {showProgress && isInProgress && target && target > 0 && (
        <View
          className="mt-3"
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: 100,
            now: Math.round(progress),
            text: `${Math.round(progress)}% complete`,
          }}
          accessibilityLabel={`Achievement progress: ${progressText}, ${Math.round(progress)}% complete`}
        >
          <View className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
            <View
              className="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
              accessibilityElementsHidden
            />
          </View>
          <View className="flex-row justify-between mt-1">
            <Text className="text-xs text-surface-500" accessibilityElementsHidden>
              {progressText}
            </Text>
            <Text className="text-xs text-surface-500" accessibilityElementsHidden>
              {Math.round(progress)}%
            </Text>
          </View>
        </View>
      )}
    </Card>
  );
});

/**
 * Achievement Badge Component
 *
 * Compact achievement display for lists and grids.
 * Shows achievement icon with unlock status indicator.
 *
 * @param props - Component props containing achievement data and optional press handler
 * @returns Achievement badge component
 */
export const AchievementBadge = memo(function AchievementBadge({
  achievement,
  onPress,
}: {
  /**
   * Achievement data to display
   */
  achievement: Achievement;
  /**
   * Callback fired when the badge is pressed
   * If provided, the badge becomes interactive
   */
  onPress?: () => void;
}): ReactElement | null {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`items-center p-2 ${achievement.status !== 'unlocked' ? 'opacity-40' : ''}`}
      accessibilityLabel={`Achievement icon: ${achievement.icon || 'unknown'}`}
      accessibilityRole={onPress ? 'button' : 'image'}
      accessibilityState={{ disabled: false }}
      accessibilityHint={onPress ? 'Tap to view achievement details' : undefined}
    />
  );
});

/**
 * Format a date for display in achievement cards
 *
 * @param date - Date to format (Date object, string, or number)
 * @returns Formatted date string (e.g., "Dec 25") or fallback string
 * @private
 */
function formatDate(date: Date | string | number): string {
  try {
    const dateObj = new Date(date);

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      logger.warn('formatDate: Invalid date provided', { date });
      return 'Unknown';
    }

    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    logger.error('formatDate: Error formatting date', error);
    return 'Unknown';
  }
}
