/**
 * Inventory Entry Card
 * Display card for 4th step inventory entries
 *
 * Features:
 * - Design system integration (GlassCard)
 * - Expandable/collapsible content
 * - Color-coded by type (resentment, fear, relationship)
 * - Full accessibility support
 * - Micro-interactions
 */

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { GlassCard } from '../../design-system/components/GlassCard';
import type { FourthStepType } from '@recovery/shared';
import { impactAsync, ImpactFeedbackStyle } from '@/platform/haptics';
import { ds } from '../../design-system/tokens/ds';

const TYPE_CONFIG: Record<
  FourthStepType,
  { bg: string; text: string; border: string; icon: React.ComponentProps<typeof Feather>['name'] }
> = {
  resentment: {
    bg: ds.semantic.intent.alert.subtle,
    text: ds.semantic.intent.alert.solid,
    border: ds.semantic.intent.alert.solid,
    icon: 'frown',
  },
  fear: {
    bg: ds.colors.warningMuted,
    text: ds.colors.warning,
    border: ds.colors.warning,
    icon: 'alert-circle',
  },
  sex_conduct: {
    bg: ds.colors.accentMuted,
    text: ds.colors.accent,
    border: ds.colors.accent,
    icon: 'heart',
  },
};

const TYPE_LABELS: Record<FourthStepType, string> = {
  resentment: 'Resentment',
  fear: 'Fear',
  sex_conduct: 'Relationship',
};

interface InventoryEntryCardProps {
  type: FourthStepType;
  who: string;
  cause?: string;
  affects?: string[];
  myPart?: string;
  onPress?: () => void;
  isExpanded?: boolean;
  enteringDelay?: number;
}

export function InventoryEntryCard({
  type,
  who,
  cause,
  affects = [],
  myPart,
  onPress,
  isExpanded = false,
  enteringDelay = 0,
}: InventoryEntryCardProps) {
  const config = TYPE_CONFIG[type];
  const scale = useSharedValue(1);
  const rotate = useSharedValue(isExpanded ? 180 : 0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  const handlePress = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light).catch(() => {});
    rotate.value = withSpring(isExpanded ? 0 : 180, { damping: 15, stiffness: 200 });
    onPress?.();
  }, [onPress, isExpanded, rotate]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  const accessibilityLabel = `${TYPE_LABELS[type]} entry for ${who}${cause ? `, ${cause.slice(0, 50)}` : ''}`;

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
          style={[styles.card, { borderColor: config.border, borderWidth: 1 }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.typeBadge, { backgroundColor: config.bg }]}>
                <Feather name={config.icon} size={12} color={config.text} />
                <Text style={[styles.typeText, { color: config.text }]}>{TYPE_LABELS[type]}</Text>
              </View>
              <Text style={styles.whoText}>{who}</Text>
              {!isExpanded && cause && (
                <Text style={styles.causePreview} numberOfLines={2}>
                  {cause}
                </Text>
              )}
            </View>
            <Animated.View style={iconAnimatedStyle}>
              <Feather name="chevron-down" size={20} color={ds.colors.textSecondary} />
            </Animated.View>
          </View>

          {/* Expanded Content */}
          {isExpanded && (
            <View style={styles.expandedContent}>
              {cause && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>The Cause</Text>
                  <Text style={styles.sectionText}>{cause}</Text>
                </View>
              )}

              {affects.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Affects My...</Text>
                  <View style={styles.affectsContainer}>
                    {affects.map((affect) => (
                      <View key={affect} style={styles.affectBadge}>
                        <Text style={styles.affectText}>{affect}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {myPart && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>My Part</Text>
                  <Text style={styles.sectionText}>{myPart}</Text>
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
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  whoText: {
    fontSize: 17,
    fontWeight: '600',
    color: ds.semantic.text.onDark,
  },
  causePreview: {
    fontSize: 14,
    color: ds.colors.textSecondary,
    marginTop: 4,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: ds.colors.bgTertiary,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: ds.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 14,
    color: ds.colors.textPrimary,
    lineHeight: 20,
  },
  affectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  affectBadge: {
    backgroundColor: ds.colors.bgTertiary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  affectText: {
    fontSize: 12,
    color: ds.colors.textTertiary,
  },
});

