/**
 * JournalEntryCard Component - Material Design 3
 * 
 * Journal entry card with mood display and swipe actions support.
 * 
 * Features:
 * - 120dp height with surface background
 * - Level 1 elevation
 * - Left (80%): Title, date, mood emoji, tags
 * - Right (20%): Large mood emoji, optional craving bar
 * - Swipe actions support with gesture handling
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  type ViewStyle,
  type TextStyle,
  type GestureResponderEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { md3LightColors, md3DarkColors } from '../tokens/md3-colors';
import { md3ElevationLight, md3ElevationDark, md3Shape, md3Typography, md3Motion } from '../tokens/md3-elevation';
import { useTheme } from '../hooks/useTheme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// ============================================================================
// TYPES
// ============================================================================

export type MoodType = 'great' | 'good' | 'neutral' | 'difficult' | 'struggling';
export type CravingLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface JournalEntryCardProps {
  /** Entry title */
  title: string;
  /** Entry date */
  date: Date | string;
  /** Mood emoji or type */
  mood: MoodType | string;
  /** Entry tags */
  tags?: string[];
  /** Craving level (0-5) */
  cravingLevel?: CravingLevel;
  /** Whether the entry is encrypted */
  isEncrypted?: boolean;
  /** Called when card is pressed */
  onPress?: () => void;
  /** Called when card is long pressed */
  onLongPress?: () => void;
  /** Additional container styles */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
  /** Accessibility label override */
  accessibilityLabel?: string;
  /** Whether to show mood badge */
  showMoodBadge?: boolean;
}

// ============================================================================
// MOOD CONFIGURATION
// ============================================================================

const MOOD_CONFIG: Record<MoodType, { emoji: string; label: string; color: string }> = {
  great: { emoji: '🌟', label: 'Great', color: '#FFD700' },
  good: { emoji: '😊', label: 'Good', color: '#90EE90' },
  neutral: { emoji: '😐', label: 'Okay', color: '#D3D3D3' },
  difficult: { emoji: '😔', label: 'Difficult', color: '#FFA07A' },
  struggling: { emoji: '💪', label: 'Struggling', color: '#E8A89A' },
};

function getMoodConfig(mood: MoodType | string): typeof MOOD_CONFIG[MoodType] {
  if (mood in MOOD_CONFIG) {
    return MOOD_CONFIG[mood as MoodType];
  }
  // If custom emoji passed
  return { emoji: mood, label: 'Custom', color: '#6B9B8D' };
}

// ============================================================================
// CRAVING BAR COMPONENT
// ============================================================================

interface CravingBarProps {
  level: CravingLevel;
  colors: typeof md3LightColors;
}

function CravingBar({ level, colors }: CravingBarProps): React.ReactElement | null {
  if (level === 0) return null;
  
  const getColor = () => {
    if (level <= 2) return colors.success;
    if (level <= 3) return colors.secondary;
    return colors.error;
  };
  
  return (
    <View style={styles.cravingContainer}>
      <Text style={[styles.cravingLabel, { color: colors.onSurfaceVariant }]}>
        Craving
      </Text>
      <View style={styles.cravingBars}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={[
              styles.cravingBar,
              {
                backgroundColor: i <= level ? getColor() : colors.surfaceContainerHighest,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// TAG CHIP COMPONENT
// ============================================================================

interface TagChipProps {
  label: string;
  colors: typeof md3LightColors;
}

function TagChip({ label, colors }: TagChipProps): React.ReactElement {
  return (
    <View style={[styles.tagChip, { backgroundColor: colors.surfaceContainerHighest }]}>
      <Text style={[styles.tagText, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function JournalEntryCard({
  title,
  date,
  mood,
  tags = [],
  cravingLevel = 0,
  isEncrypted = false,
  onPress,
  onLongPress,
  style,
  testID,
  accessibilityLabel,
  showMoodBadge = true,
}: JournalEntryCardProps): React.ReactElement {
  const theme = useTheme();
  const isDark = theme?.isDark ?? false;
  const colors = isDark ? md3DarkColors : md3LightColors;
  const elevation = isDark ? md3ElevationDark : md3ElevationLight;
  
  const moodConfig = getMoodConfig(mood);
  
  // Animation values
  const scale = useSharedValue(1);
  const elevationValue = useSharedValue(1);
  
  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 100 });
    elevationValue.value = withTiming(2, { duration: 100 });
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, md3Motion.spring.quick);
    elevationValue.value = withTiming(1, { duration: 200 });
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  // Format date
  const formattedDate = React.useMemo(() => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === d.toDateString();
    
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }, [date]);
  
  const a11yLabel = accessibilityLabel || 
    `${title}. ${formattedDate}. Mood: ${moodConfig.label}. ${tags.length > 0 ? `Tags: ${tags.join(', ')}` : ''}`;
  
  return (
    <AnimatedTouchable
      style={[
        styles.container,
        elevation.level1,
        { backgroundColor: colors.surfaceContainerLow },
        animatedStyle,
        style,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      testID={testID}
      accessible
      accessibilityLabel={a11yLabel}
      accessibilityRole="button"
      accessibilityHint="Double tap to view journal entry"
    >
      {/* Left Content - 80% */}
      <View style={styles.leftContent}>
        {/* Header row with title and encryption indicator */}
        <View style={styles.headerRow}>
          <Text 
            style={[styles.title, { color: colors.onSurface }]} 
            numberOfLines={1}
          >
            {title}
          </Text>
          {isEncrypted && (
            <Feather name="lock" size={14} color={colors.onSurfaceVariant} />
          )}
        </View>
        
        {/* Date row */}
        <View style={styles.dateRow}>
          <Feather name="calendar" size={12} color={colors.onSurfaceVariant} />
          <Text style={[styles.date, { color: colors.onSurfaceVariant }]}>
            {formattedDate}
          </Text>
        </View>
        
        {/* Tags row */}
        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.slice(0, 3).map((tag, index) => (
              <TagChip key={index} label={tag} colors={colors} />
            ))}
            {tags.length > 3 && (
              <Text style={[styles.moreTags, { color: colors.onSurfaceVariant }]}>
                +{tags.length - 3}
              </Text>
            )}
          </View>
        )}
      </View>
      
      {/* Right Content - 20% */}
      <View style={styles.rightContent}>
        {/* Large Mood Emoji */}
        <View style={[
          styles.moodContainer,
          { backgroundColor: colors.surfaceContainerHighest },
        ]}>
          <Text style={styles.moodEmoji}>{moodConfig.emoji}</Text>
        </View>
        
        {/* Craving bar */}
        {cravingLevel > 0 && (
          <CravingBar level={cravingLevel} colors={colors} />
        )}
        
        {/* Mood badge */}
        {showMoodBadge && (
          <View style={[
            styles.moodBadge,
            { backgroundColor: moodConfig.color + '20' },
          ]}>
            <Text style={[styles.moodBadgeText, { color: colors.onSurfaceVariant }]}>
              {moodConfig.label}
            </Text>
          </View>
        )}
      </View>
    </AnimatedTouchable>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: md3Shape.large,
    padding: 16,
    height: 120,
  },
  leftContent: {
    flex: 0.8,
    paddingRight: 12,
    justifyContent: 'space-between',
  },
  rightContent: {
    flex: 0.2,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...md3Typography.titleMedium,
    fontSize: 16,
    flex: 1,
  } as TextStyle,
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  date: {
    ...md3Typography.bodySmall,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  tagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: md3Shape.small,
  },
  tagText: {
    ...md3Typography.labelSmall,
    fontSize: 10,
  },
  moreTags: {
    ...md3Typography.labelSmall,
    fontSize: 10,
  },
  moodContainer: {
    width: 48,
    height: 48,
    borderRadius: md3Shape.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodEmoji: {
    fontSize: 28,
  },
  moodBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: md3Shape.small,
  },
  moodBadgeText: {
    ...md3Typography.labelSmall,
    fontSize: 9,
  },
  cravingContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  cravingLabel: {
    ...md3Typography.labelSmall,
    fontSize: 8,
    marginBottom: 2,
  },
  cravingBars: {
    flexDirection: 'row',
    gap: 2,
  },
  cravingBar: {
    width: 4,
    height: 12,
    borderRadius: 2,
  },
});
