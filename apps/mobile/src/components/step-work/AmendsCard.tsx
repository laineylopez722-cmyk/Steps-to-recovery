/**
 * Amends Card
 * Display card for 8th/9th step amends entries
 *
 * Features:
 * - Design system integration (GlassCard)
 * - Status-based color coding
 * - Expandable/collapsible content
 * - Full accessibility support
 * - Micro-interactions
 */

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { GlassCard } from '../../design-system/components/GlassCard';
import type { AmendsStatus, AmendsType } from '@recovery/shared';
import * as Haptics from 'expo-haptics';

const STATUS_CONFIG: Record<
  AmendsStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ComponentProps<typeof Feather>['name'];
  }
> = {
  not_willing: {
    label: 'Not Yet Willing',
    color: '#f87171',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    icon: 'x-circle',
  },
  willing: {
    label: 'Willing',
    color: '#fbbf24',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    icon: 'heart',
  },
  planned: {
    label: 'Planned',
    color: '#60a5fa',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    icon: 'calendar',
  },
  in_progress: {
    label: 'In Progress',
    color: '#a78bfa',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    icon: 'loader',
  },
  made: {
    label: 'Made',
    color: '#4ade80',
    bgColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
    icon: 'check-circle',
  },
};

const TYPE_LABELS: Record<AmendsType, string> = {
  direct: 'Direct Amends',
  indirect: 'Indirect Amends',
  living: 'Living Amends',
};

const TYPE_ICONS: Record<AmendsType, React.ComponentProps<typeof Feather>['name']> = {
  direct: 'message-circle',
  indirect: 'users',
  living: 'sun',
};

interface AmendsCardProps {
  person: string;
  harm?: string;
  amendsType: AmendsType;
  status: AmendsStatus;
  notes?: string;
  madeAt?: Date;
  onPress?: () => void;
  isExpanded?: boolean;
  enteringDelay?: number;
}

export function AmendsCard({
  person,
  harm,
  amendsType,
  status,
  notes,
  madeAt,
  onPress,
  isExpanded = false,
  enteringDelay = 0,
}: AmendsCardProps) {
  const statusConfig = STATUS_CONFIG[status];
  const scale = useSharedValue(1);
  const rotate = useSharedValue(isExpanded ? 180 : 0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    rotate.value = withSpring(isExpanded ? 0 : 180, { damping: 15, stiffness: 200 });
    onPress?.();
  }, [onPress, isExpanded, rotate]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  const accessibilityLabel = `Amends entry for ${person}, status: ${statusConfig.label}, type: ${TYPE_LABELS[amendsType]}`;

  return (
    <Animated.View entering={FadeIn.delay(enteringDelay * 50)} style={animatedStyle}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={isExpanded ? 'Collapses entry details' : 'Expands entry details'}
        accessibilityState={{ expanded: isExpanded }}
      >
        <GlassCard
          gradient="card"
          style={[styles.card, { borderColor: statusConfig.borderColor, borderWidth: 1 }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerTop}>
                <Text style={styles.personName}>{person}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                  <Feather name={statusConfig.icon} size={12} color={statusConfig.color} />
                  <Text style={[styles.statusText, { color: statusConfig.color }]}>
                    {statusConfig.label}
                  </Text>
                </View>
              </View>
              {!isExpanded && harm && (
                <Text style={styles.harmPreview} numberOfLines={2}>
                  {harm}
                </Text>
              )}
            </View>
            <Animated.View style={iconAnimatedStyle}>
              <Feather name="chevron-down" size={20} color="#64748b" />
            </Animated.View>
          </View>

          {/* Expanded Content */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              {harm && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>The Harm</Text>
                  <Text style={styles.sectionText}>{harm}</Text>
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Type of Amends</Text>
                <View style={styles.typeContainer}>
                  <Feather name={TYPE_ICONS[amendsType]} size={16} color="#64748b" />
                  <Text style={styles.typeText}>{TYPE_LABELS[amendsType]}</Text>
                </View>
              </View>

              {notes && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Notes</Text>
                  <Text style={styles.sectionText}>{notes}</Text>
                </View>
              )}

              {madeAt && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Made On</Text>
                  <View style={styles.madeOnContainer}>
                    <Feather name="check-circle" size={16} color="#4ade80" />
                    <Text style={styles.madeOnText}>{madeAt.toLocaleDateString()}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  personName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  harmPreview: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 6,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.5)',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 14,
    color: '#e2e8f0',
    lineHeight: 20,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeText: {
    fontSize: 14,
    color: '#e2e8f0',
  },
  madeOnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  madeOnText: {
    fontSize: 14,
    color: '#4ade80',
    fontWeight: '500',
  },
});
