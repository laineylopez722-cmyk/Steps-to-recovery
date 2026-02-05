/**
 * RiskAlertCard Component
 * 
 * Glassmorphic card displaying detected risk patterns
 * Appears at top of home screen when risks detected
 * 
 * Design: Amber/warning color, dismissible, with suggested actions
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeOutUp, Layout } from 'react-native-reanimated';
import { GradientButton } from '../../../design-system/components/GradientButton';
import { darkAccent, gradients, radius, spacing, typography } from '../../../design-system/tokens/modern';
import type { RiskPattern } from '../services/riskDetectionService';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

// ========================================
// Props
// ========================================

export interface RiskAlertCardProps {
  pattern: RiskPattern;
  onDismiss: () => void;
  onNotifySponsor?: () => Promise<{ success: boolean; error?: string }>;
  style?: any;
}

// ========================================
// Severity Colors
// ========================================

const SEVERITY_COLORS = {
  low: {
    background: ['rgba(251, 191, 36, 0.15)', 'rgba(245, 158, 11, 0.10)'],
    border: 'rgba(251, 191, 36, 0.3)',
    icon: '#FCD34D',
    text: '#FDE68A',
  },
  medium: {
    background: ['rgba(251, 146, 60, 0.15)', 'rgba(249, 115, 22, 0.10)'],
    border: 'rgba(251, 146, 60, 0.3)',
    icon: '#FB923C',
    text: '#FED7AA',
  },
  high: {
    background: ['rgba(239, 68, 68, 0.15)', 'rgba(220, 38, 38, 0.10)'],
    border: 'rgba(239, 68, 68, 0.3)',
    icon: '#F87171',
    text: '#FCA5A5',
  },
};

// ========================================
// Component
// ========================================

export function RiskAlertCard({
  pattern,
  onDismiss,
  onNotifySponsor,
  style,
}: RiskAlertCardProps): React.ReactElement {
  const navigation = useNavigation();
  const [isNotifying, setIsNotifying] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);

  const colors = SEVERITY_COLORS[pattern.severity];

  // Handle suggested action
  const handleAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Navigate to suggested route
    navigation.navigate(pattern.actionRoute as never, pattern.actionParams as never);
  };

  // Handle dismiss
  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  };

  // Handle notify sponsor
  const handleNotifySponsor = async () => {
    if (!onNotifySponsor) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsNotifying(true);

    const result = await onNotifySponsor();
    
    setIsNotifying(false);
    
    if (result.success) {
      setNotifySuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Hide success message after 2 seconds
      setTimeout(() => {
        setNotifySuccess(false);
      }, 2000);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(400).springify()}
      exiting={FadeOutUp.duration(300)}
      layout={Layout.springify()}
      style={[styles.container, style]}
    >
      {/* Glass Card */}
      <View style={styles.card}>
        <BlurView intensity={20} tint="dark" style={styles.blur}>
          <LinearGradient
            colors={colors.background}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Border */}
            <View style={[styles.border, { borderColor: colors.border }]}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: `${colors.icon}20` }]}>
                    <MaterialCommunityIcons
                      name={pattern.icon as any}
                      size={24}
                      color={colors.icon}
                      accessible={false}
                    />
                  </View>
                  <View style={styles.headerText}>
                    <Text
                      style={[styles.title, { color: darkAccent.text.primary }]}
                      accessibilityRole="header"
                    >
                      {pattern.title}
                    </Text>
                    <Text style={[styles.severity, { color: colors.text }]}>
                      {pattern.severity === 'high' && '🔴 '}
                      {pattern.severity === 'medium' && '🟡 '}
                      {pattern.severity === 'low' && '🟢 '}
                      {pattern.daysSince} {pattern.daysSince === 1 ? 'day' : 'days'}
                    </Text>
                  </View>
                </View>
                
                {/* Dismiss Button */}
                <Pressable
                  onPress={handleDismiss}
                  style={styles.dismissButton}
                  accessibilityLabel="Dismiss alert"
                  accessibilityRole="button"
                  accessibilityHint="Hides this alert for 24 hours"
                  hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={20}
                    color={darkAccent.text.secondary}
                    accessible={false}
                  />
                </Pressable>
              </View>

              {/* Message */}
              <Text
                style={[styles.message, { color: darkAccent.text.secondary }]}
                accessibilityLabel={pattern.message}
              >
                {pattern.message}
              </Text>

              {/* Actions */}
              <View style={styles.actions}>
                {/* Suggested Action Button */}
                <GradientButton
                  title={pattern.suggestedAction}
                  variant="ghost"
                  size="sm"
                  onPress={handleAction}
                  style={styles.actionButton}
                  accessibilityLabel={pattern.suggestedAction}
                  accessibilityHint={`Opens ${pattern.actionRoute} screen`}
                />

                {/* Notify Sponsor Button */}
                {pattern.canNotifySponsor && onNotifySponsor && !notifySuccess && (
                  <GradientButton
                    title={isNotifying ? 'Notifying...' : 'Tell Sponsor'}
                    variant="ghost"
                    size="sm"
                    onPress={handleNotifySponsor}
                    disabled={isNotifying}
                    icon={
                      isNotifying ? (
                        <ActivityIndicator size="small" color={darkAccent.primary} />
                      ) : (
                        <MaterialCommunityIcons
                          name="account-supervisor"
                          size={16}
                          color={darkAccent.primary}
                        />
                      )
                    }
                    iconPosition="left"
                    style={styles.actionButton}
                    accessibilityLabel="Notify sponsor about this pattern"
                    accessibilityHint="Sends an alert to your sponsor"
                  />
                )}

                {/* Success Message */}
                {notifySuccess && (
                  <View style={styles.successContainer}>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={16}
                      color={darkAccent.success}
                    />
                    <Text style={[styles.successText, { color: darkAccent.success }]}>
                      Sponsor notified
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </View>
    </Animated.View>
  );
}

// ========================================
// Styles
// ========================================

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  card: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...darkAccent.shadows.md,
  },
  blur: {
    overflow: 'hidden',
    borderRadius: radius.xl,
  },
  gradient: {
    borderRadius: radius.xl,
  },
  border: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing[0.5],
  },
  severity: {
    ...typography.caption,
    fontWeight: '500',
  },
  dismissButton: {
    padding: spacing[1],
    marginLeft: spacing[2],
  },
  message: {
    ...typography.body,
    lineHeight: 22,
    marginBottom: spacing[4],
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    alignItems: 'center',
  },
  actionButton: {
    flex: 0,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  successText: {
    ...typography.caption,
    fontWeight: '500',
  },
});
