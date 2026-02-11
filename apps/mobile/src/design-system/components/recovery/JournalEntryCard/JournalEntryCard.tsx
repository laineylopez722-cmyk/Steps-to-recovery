/**
 * JournalEntryCard Component
 * Displays journal entry summary with mood, tags, and sharing status
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Share2, User } from 'lucide-react-native';
import {
  COLORS,
  ANIMATION,
  DIMENSIONS,
  TYPOGRAPHY,
  SHADOWS,
  SPACING,
  MOOD_CONFIG,
} from '../constants';
import type { JournalEntry } from '../types';

const AnimatedView = Animated.createAnimatedComponent(View);

export interface JournalEntryCardProps {
  entry: JournalEntry;
  onPress?: (entry: JournalEntry) => void;
  onSharePress?: (entry: JournalEntry) => void;
  reducedMotion?: boolean;
  testID?: string;
}

export function JournalEntryCard({
  entry,
  onPress,
  onSharePress: _onSharePress,
  reducedMotion = false,
  testID,
}: JournalEntryCardProps): React.ReactElement {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Animation values
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const shareIndicatorOpacity = useSharedValue(0);

  const moodConfig = MOOD_CONFIG[entry.mood];

  // Format date
  const formattedDate = useMemo(() => {
    return entry.date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }, [entry.date]);

  const formattedTime = useMemo(() => {
    return entry.date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }, [entry.date]);

  // Handle press
  const handlePress = useCallback(() => {
    if (!reducedMotion) {
      scale.value = withSequence(
        withTiming(0.98, { duration: ANIMATION.accelerated }),
        withTiming(1, { duration: ANIMATION.standard }),
      );
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(entry);
  }, [entry, onPress, reducedMotion, scale]);

  // Handle long press for share preview
  const handleLongPress = useCallback(() => {
    if (!reducedMotion) {
      translateX.value = withTiming(-20, { duration: ANIMATION.standard });
      shareIndicatorOpacity.value = withTiming(1, { duration: ANIMATION.standard });

      // Reset after delay
      setTimeout(() => {
        translateX.value = withTiming(0, { duration: ANIMATION.standard });
        shareIndicatorOpacity.value = withTiming(0, { duration: ANIMATION.standard });
      }, 1000);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [reducedMotion, translateX, shareIndicatorOpacity]);

  // Animated styles
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: translateX.value }],
  }));

  const shareIndicatorStyle = useAnimatedStyle(() => ({
    opacity: shareIndicatorOpacity.value,
    transform: [
      {
        translateX: interpolate(shareIndicatorOpacity.value, [0, 1], [20, 0], Extrapolate.CLAMP),
      },
    ],
  }));

  // Build accessibility label
  const accessibilityLabel = useMemo(() => {
    const parts = [
      `Journal entry, ${formattedDate} at ${formattedTime}`,
      `Mood: ${moodConfig.label}`,
    ];
    if (entry.tags.length > 0) {
      parts.push(`Tagged: ${entry.tags.join(', ')}`);
    }
    if (entry.isSharedWithSponsor) {
      parts.push('Shared with sponsor');
    }
    return parts.join('. ');
  }, [formattedDate, formattedTime, moodConfig.label, entry.tags, entry.isSharedWithSponsor]);

  return (
    <View className="relative">
      {/* Share indicator (shown on swipe) */}
      <AnimatedView
        style={[
          {
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 80,
            backgroundColor: COLORS.primary,
            borderTopRightRadius: DIMENSIONS.cornerRadius.large,
            borderBottomRightRadius: DIMENSIONS.cornerRadius.large,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 0,
          },
          shareIndicatorStyle,
        ]}
      >
        <Share2 size={24} color={COLORS.white} />
        <Text
          style={{
            fontSize: TYPOGRAPHY.labelSmall.fontSize,
            color: COLORS.white,
            marginLeft: SPACING.xs,
          }}
        >
          Share
        </Text>
      </AnimatedView>

      {/* Main card */}
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={500}
        accessible
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityHint="Double tap to open full entry. Long press for quick share preview."
        testID={testID}
      >
        <AnimatedView
          style={[
            {
              backgroundColor: isDark ? COLORS.darkSurface : COLORS.surface,
              borderRadius: DIMENSIONS.cornerRadius.large,
              height: DIMENSIONS.journalEntryHeight,
              ...SHADOWS.level1,
              flexDirection: 'row',
              overflow: 'hidden',
              zIndex: 1,
            },
            cardStyle,
          ]}
        >
          {/* Left section (80%) */}
          <View className="flex-[0.8] p-4 justify-between">
            {/* Title and date */}
            <View>
              <Text
                style={{
                  fontSize: TYPOGRAPHY.labelLarge.fontSize,
                  fontWeight: TYPOGRAPHY.labelLarge.fontWeight,
                  color: isDark ? COLORS.white : COLORS.gray900,
                  marginBottom: SPACING.xs,
                }}
                numberOfLines={1}
              >
                {entry.title}
              </Text>
              <Text
                style={{
                  fontSize: TYPOGRAPHY.labelSmall.fontSize,
                  color: isDark ? COLORS.gray400 : COLORS.gray500,
                }}
              >
                {formattedDate} • {formattedTime}
              </Text>
            </View>

            {/* Mood and tags row */}
            <View className="flex-row items-center">
              {/* Mood pill */}
              <View
                className="flex-row items-center px-2 py-1 rounded-full mr-2"
                style={{ backgroundColor: `${moodConfig.color}20` }}
              >
                <Text className="text-sm mr-1">{moodConfig.emoji}</Text>
                <Text
                  style={{
                    fontSize: TYPOGRAPHY.labelSmall.fontSize,
                    color: moodConfig.color,
                    fontWeight: '500',
                  }}
                >
                  {moodConfig.label}
                </Text>
              </View>

              {/* Tags */}
              {entry.tags.slice(0, 2).map((tag, _index) => (
                <View
                  key={tag}
                  className="px-2 py-1 rounded-full mr-1"
                  style={{
                    backgroundColor: isDark ? COLORS.gray700 : COLORS.gray100,
                  }}
                >
                  <Text
                    style={{
                      fontSize: TYPOGRAPHY.labelSmall.fontSize,
                      color: isDark ? COLORS.gray300 : COLORS.gray600,
                    }}
                  >
                    {tag}
                  </Text>
                </View>
              ))}
              {entry.tags.length > 2 && (
                <Text
                  style={{
                    fontSize: TYPOGRAPHY.labelSmall.fontSize,
                    color: isDark ? COLORS.gray400 : COLORS.gray500,
                  }}
                >
                  +{entry.tags.length - 2}
                </Text>
              )}
            </View>
          </View>

          {/* Right section (20%) */}
          <View
            className="flex-[0.2] items-center justify-center p-2"
            style={{
              borderLeftWidth: 1,
              borderLeftColor: isDark ? COLORS.gray700 : COLORS.surfaceVariant,
            }}
          >
            {/* Large mood emoji */}
            <Text
              style={{
                fontSize: 36,
                marginBottom: SPACING.xs,
              }}
            >
              {moodConfig.emoji}
            </Text>

            {/* Craving indicator */}
            {entry.hasCraving && entry.cravingIntensity !== undefined && (
              <View className="w-full">
                <View
                  className="h-1 rounded-full overflow-hidden"
                  style={{
                    backgroundColor: isDark ? COLORS.gray700 : COLORS.surfaceVariant,
                  }}
                >
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${(entry.cravingIntensity / 10) * 100}%`,
                      backgroundColor:
                        entry.cravingIntensity > 7
                          ? COLORS.error
                          : entry.cravingIntensity > 4
                            ? COLORS.warning
                            : COLORS.success,
                    }}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 10,
                    color: isDark ? COLORS.gray400 : COLORS.gray500,
                    textAlign: 'center',
                    marginTop: 2,
                  }}
                >
                  {entry.cravingIntensity}/10
                </Text>
              </View>
            )}

            {/* Sponsor share indicator */}
            {entry.isSharedWithSponsor && (
              <View
                className="absolute top-2 right-2 w-5 h-5 rounded-full items-center justify-center"
                style={{ backgroundColor: COLORS.primary }}
              >
                {entry.sponsorAvatar ? (
                  <Text className="text-xs">{entry.sponsorAvatar}</Text>
                ) : (
                  <User size={12} color={COLORS.white} />
                )}
              </View>
            )}
          </View>
        </AnimatedView>
      </TouchableOpacity>
    </View>
  );
}

export default JournalEntryCard;
