/**
 * CapsuleCard Component
 * Displays a time capsule with status (locked, ready, opened)
 * Memoized for SectionList performance
 *
 * Features:
 * - Design system integration (GlassCard)
 * - Status-based styling (locked, ready, opened)
 * - Countdown for locked capsules
 * - Full accessibility support
 */

import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GlassCard } from '../../design-system/components/GlassCard';
import type { TimeCapsule } from '@recovery/shared';
import * as Haptics from 'expo-haptics';

interface CapsuleCardProps {
  capsule: TimeCapsule;
  onPress: () => void;
  enteringDelay?: number;
}

function CapsuleCardComponent({ capsule, onPress, enteringDelay = 0 }: CapsuleCardProps) {
  const now = new Date();
  const isReady = capsule.unlockDate <= now;
  const daysUntilUnlock = Math.ceil(
    (capsule.unlockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  }, [onPress]);

  // Get status config
  const getStatusConfig = () => {
    if (capsule.isUnlocked) {
      return {
        icon: 'book-open' as const,
        iconColor: '#4ade80',
        bgColor: 'rgba(34, 197, 94, 0.15)',
        statusText: `Opened ${capsule.unlockedAt?.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}`,
        statusColor: '#4ade80',
      };
    }
    if (isReady) {
      return {
        icon: 'gift' as const,
        iconColor: '#fbbf24',
        bgColor: 'rgba(245, 158, 11, 0.15)',
        statusText: 'Ready to open!',
        statusColor: '#fbbf24',
      };
    }
    return {
      icon: 'lock' as const,
      iconColor: '#64748b',
      bgColor: 'rgba(100, 116, 139, 0.15)',
      statusText: `Unlocks in ${daysUntilUnlock} day${daysUntilUnlock !== 1 ? 's' : ''}`,
      statusColor: '#64748b',
    };
  };

  const statusConfig = getStatusConfig();

  const accessibilityLabel = `${capsule.title}, ${statusConfig.statusText}`;

  return (
    <Animated.View entering={FadeIn.delay(enteringDelay * 50)}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={capsule.isUnlocked ? 'Read your message' : isReady ? 'Open your capsule' : 'View capsule details'}
      >
        <GlassCard
          gradient={capsule.isUnlocked ? 'elevated' : 'card'}
          style={[
            styles.card,
            isReady && !capsule.isUnlocked && styles.readyCard,
          ]}
        >
          <View style={styles.container}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: statusConfig.bgColor }]}>
              <Feather
                name={statusConfig.icon}
                size={24}
                color={statusConfig.iconColor}
              />
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.title} numberOfLines={1}>
                {capsule.title}
              </Text>
              <Text style={[styles.statusText, { color: statusConfig.statusColor }]}>
                {statusConfig.statusText}
              </Text>
              <Text style={styles.createdText}>
                Created{' '}
                {capsule.createdAt.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>

            {/* Status indicator */}
            <View style={styles.statusIndicator}>
              {!capsule.isUnlocked && !isReady && (
                <Text style={styles.unlockDate}>
                  {capsule.unlockDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              )}
              <Feather
                name="chevron-right"
                size={20}
                color={isReady && !capsule.isUnlocked ? '#fbbf24' : '#64748b'}
              />
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
}

export const CapsuleCard = memo(CapsuleCardComponent);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
  },
  readyCard: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderWidth: 1,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  createdText: {
    fontSize: 12,
    color: '#64748b',
  },
  statusIndicator: {
    alignItems: 'flex-end',
  },
  unlockDate: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
});
