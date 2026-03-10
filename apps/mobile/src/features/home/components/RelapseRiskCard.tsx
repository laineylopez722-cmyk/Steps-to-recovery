/**
 * RelapseRiskCard
 *
 * Compact home-screen card showing the user's current relapse risk score.
 * Only visible when level is 'elevated' or 'high' (hidden when low to avoid
 * stigmatising users who are doing well).
 *
 * Design: subtle amber/red gradient, dismissible, links to recommended action.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDs } from '../../../design-system/DsProvider';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { hapticLight, hapticWarning } from '../../../utils/haptics';
import type { RelapseRiskResult, RiskLevel } from '../../ai-companion/services/relapseRiskEngine';

interface RelapseRiskCardProps {
  risk: RelapseRiskResult;
  onDismiss: () => void;
  userId?: string;
}

function getLevelConfig(
  level: RiskLevel,
  ds: ReturnType<typeof useDs>,
): { bg: string; border: string; text: string; label: string; icon: React.ComponentProps<typeof Feather>['name'] } {
  switch (level) {
    case 'high':
      return {
        bg: ds.semantic.intent.alert.subtle,
        border: ds.semantic.intent.alert.solid,
        text: ds.semantic.intent.alert.solid,
        label: 'High Risk',
        icon: 'alert-triangle',
      };
    case 'elevated':
      return {
        bg: ds.colors.warningMuted,
        border: ds.colors.warning,
        text: ds.colors.warning,
        label: 'Elevated Risk',
        icon: 'alert-circle',
      };
    default:
      return {
        bg: ds.semantic.intent.success.subtle,
        border: ds.semantic.intent.success.solid,
        text: ds.semantic.intent.success.solid,
        label: 'Low Risk',
        icon: 'check-circle',
      };
  }
}

export function RelapseRiskCard({ risk, onDismiss, userId = '' }: RelapseRiskCardProps): React.ReactElement | null {
  const ds = useDs();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation();
  const [expanded, setExpanded] = useState(false);

  // Only show when elevated or high
  if (risk.level === 'low') return null;

  const config = getLevelConfig(risk.level, ds);

  const handlePrimaryAction = (): void => {
    hapticWarning();
    if (risk.level === 'high') {
      (navigation as { navigate: (s: string) => void }).navigate('Emergency');
    } else {
      (navigation as { navigate: (s: string, p: unknown) => void }).navigate(
        'CopingRecommendations',
        { userId },
      );
    }
  };

  const handleToggleExpand = (): void => {
    hapticLight();
    setExpanded((prev: boolean) => !prev);
  };

  const handleDismiss = (): void => {
    hapticLight();
    onDismiss();
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(400).springify()}
      exiting={FadeOutUp.duration(300)}
      style={[styles.container, { backgroundColor: config.bg, borderColor: config.border }]}
    >
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather
            name={config.icon}
            size={18}
            color={config.text}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={[styles.levelLabel, { color: config.text }]}>{config.label}</Text>
          <View style={[styles.scoreBadge, { backgroundColor: config.border }]}>
            <Text style={styles.scoreText}>{risk.score}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            onPress={handleToggleExpand}
            style={styles.iconBtn}
            accessibilityLabel={expanded ? 'Collapse risk details' : 'Expand risk details'}
            accessibilityRole="button"
          >
            <Feather
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={ds.semantic.text.tertiary}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          </Pressable>
          <Pressable
            onPress={handleDismiss}
            style={styles.iconBtn}
            accessibilityLabel="Dismiss risk alert"
            accessibilityRole="button"
            accessibilityHint="Hides this card until the next check"
          >
            <Feather
              name="x"
              size={16}
              color={ds.semantic.text.tertiary}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          </Pressable>
        </View>
      </View>

      {/* Top recommendation (always visible) */}
      {risk.recommendations.length > 0 && (
        <Text style={styles.topRecommendation}>{risk.recommendations[0]}</Text>
      )}

      {/* Expanded details */}
      {expanded && (
        <Animated.View entering={FadeInDown.duration(200)}>
          {risk.factors.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contributing factors</Text>
              {risk.factors.map((factor, i) => (
                <View key={i} style={styles.factorRow}>
                  <Feather
                    name="minus"
                    size={12}
                    color={config.text}
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  />
                  <Text style={styles.factorText}>{factor}</Text>
                </View>
              ))}
            </View>
          )}

          {risk.protectiveFactors.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What's working</Text>
              {risk.protectiveFactors.map((pf, i) => (
                <View key={i} style={styles.factorRow}>
                  <Feather
                    name="check"
                    size={12}
                    color={ds.semantic.intent.success.solid}
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  />
                  <Text style={[styles.factorText, { color: ds.semantic.intent.success.solid }]}>
                    {pf}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      )}

      {/* CTA */}
      <Pressable
        onPress={handlePrimaryAction}
        style={[styles.ctaButton, { backgroundColor: config.border }]}
        accessibilityRole="button"
        accessibilityLabel={risk.level === 'high' ? 'Open emergency support' : 'View coping strategies'}
        accessibilityHint="Opens the recommended support screen"
      >
        <Text style={styles.ctaText}>
          {risk.level === 'high' ? 'Get support now' : 'Coping strategies'}
        </Text>
        <Feather
          name="arrow-right"
          size={14}
          color="#fff"
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </Pressable>
    </Animated.View>
  );
}

const createStyles = (ds: DS) =>
  StyleSheet.create({
    container: {
      borderRadius: ds.radius.xl,
      borderWidth: 1,
      padding: ds.space[4],
      marginBottom: ds.space[4],
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: ds.space[2],
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ds.space[2],
    },
    levelLabel: {
      ...ds.typography.caption,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    scoreBadge: {
      borderRadius: ds.radius.full,
      paddingHorizontal: ds.space[2],
      paddingVertical: 2,
    },
    scoreText: {
      ...ds.typography.micro,
      color: '#fff',
      fontWeight: '700',
    },
    headerRight: {
      flexDirection: 'row',
      gap: ds.space[1],
    },
    iconBtn: {
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    topRecommendation: {
      ...ds.typography.caption,
      color: ds.semantic.text.secondary,
      marginBottom: ds.space[3],
      lineHeight: 18,
    },
    section: {
      marginBottom: ds.space[3],
    },
    sectionTitle: {
      ...ds.typography.micro,
      color: ds.semantic.text.tertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: ds.space[2],
    },
    factorRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: ds.space[2],
      marginBottom: ds.space[1],
    },
    factorText: {
      ...ds.typography.caption,
      color: ds.semantic.text.secondary,
      flex: 1,
      lineHeight: 18,
    },
    ctaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ds.space[2],
      borderRadius: ds.radius.lg,
      paddingVertical: ds.space[3],
      paddingHorizontal: ds.space[4],
      marginTop: ds.space[1],
    },
    ctaText: {
      ...ds.typography.caption,
      color: '#fff',
      fontWeight: '700',
    },
  });
