/**
 * RecoveryStrengthCard
 * Displays the composite recovery strength score as a circular gauge
 * with grade, emoji, and top insights.
 */

import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard, SkeletonCard, useDs } from '../../../design-system';
import { aestheticColors } from '../../../design-system/tokens/aesthetic';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { ScreenAnimations } from '../../../design-system/tokens/screen-animations';
import { useRecoveryStrength } from '../hooks/useRecoveryStrength';

interface RecoveryStrengthCardProps {
  userId: string;
}

function scoreColor(score: number): string {
  if (score >= 80) return aestheticColors.gold.DEFAULT;
  if (score >= 60) return aestheticColors.primary[500];
  if (score >= 40) return aestheticColors.secondary[500];
  return aestheticColors.warning.DEFAULT;
}

export function RecoveryStrengthCard({
  userId,
}: RecoveryStrengthCardProps): React.ReactElement | null {
  const ds = useDs();
  const styles = useThemedStyles(createStyles);
  const { data, isLoading, error } = useRecoveryStrength(userId);

  if (isLoading) {
    return <SkeletonCard />;
  }

  if (error || !data) {
    return null;
  }

  const size = 100;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - data.score / 100);
  const color = scoreColor(data.score);

  return (
    <Animated.View entering={ScreenAnimations.item(0)}>
      <View
        style={styles.sectionHeader}
        accessibilityRole="header"
        accessibilityLabel="Recovery Strength"
      >
        <MaterialCommunityIcons
          name="shield-check"
          size={20}
          color={aestheticColors.primary[500]}
        />
        <Text style={[styles.sectionTitle, { color: ds.semantic.text.primary }]}>Recovery Strength</Text>
      </View>

      <GlassCard
        intensity="card"
        style={styles.card}
        glow={data.score >= 80}
        glowColor={color}
        accessibilityLabel={`Recovery strength score ${data.score} out of 100, grade ${data.grade}`}
        accessibilityRole="summary"
      >
        <View style={styles.topRow}>
          {/* Circular gauge */}
          <View
            style={styles.gaugeContainer}
            accessibilityLabel={`Score gauge showing ${data.score} percent`}
          >
            <Svg width={size} height={size}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={ds.semantic.surface.overlay}
                strokeWidth={stroke}
                fill="none"
              />
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={color}
                strokeWidth={stroke}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            </Svg>
            <View style={styles.gaugeCenter}>
              <Text style={[styles.scoreText, { color: ds.semantic.text.primary }]}>{data.score}</Text>
            </View>
          </View>

          {/* Grade + emoji */}
          <View style={styles.gradeContainer}>
            <Text style={styles.emoji}>{data.emoji}</Text>
            <Text style={[styles.gradeText, { color }]}>{data.grade}</Text>
            <Text style={[styles.scaleLabel, { color: ds.semantic.text.secondary }]}>
              out of 100
            </Text>
          </View>
        </View>

        {/* Insights */}
        {data.insights.length > 0 && (
          <View style={styles.insightsList}>
            {data.insights.map((insight, index) => (
              <View
                key={index}
                style={styles.insightRow}
                accessibilityLabel={insight}
                accessibilityRole="text"
              >
                <MaterialCommunityIcons name="chevron-right" size={16} color={color} />
                <Text style={[styles.insightText, { color: ds.semantic.text.secondary }]}>
                  {insight}
                </Text>
              </View>
            ))}
          </View>
        )}
      </GlassCard>
    </Animated.View>
  );
}

const createStyles = (ds: DS) =>
  ({
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
    },
    card: {
      padding: 20,
      marginBottom: 20,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
    },
    gaugeContainer: {
      width: 100,
      height: 100,
      justifyContent: 'center',
      alignItems: 'center',
    },
    gaugeCenter: {
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
    },
    scoreText: {
      fontSize: 28,
      fontWeight: '700',
    },
    gradeContainer: {
      flex: 1,
      alignItems: 'flex-start',
      gap: 2,
    },
    emoji: {
      fontSize: 28,
    },
    gradeText: {
      fontSize: 20,
      fontWeight: '700',
    },
    scaleLabel: {
      fontSize: 12,
    },
    insightsList: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: ds.colors.borderSubtle,
      gap: 8,
    },
    insightRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
    },
    insightText: {
      fontSize: 13,
      lineHeight: 18,
      flex: 1,
    },
  }) as const;
