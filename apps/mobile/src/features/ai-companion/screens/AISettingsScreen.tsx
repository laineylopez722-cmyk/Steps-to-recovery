/**
 * AI Settings Screen
 *
 * Apple Settings-inspired API configuration.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  Linking,
  Pressable,
  Switch,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import { getAIService, type AIProvider } from '../services/aiService';
import { getSessionCost, getDailyCost, getCostHistory } from '../services/costEstimation';
import type { DailyCostEntry } from '../services/costEstimation';
import {
  checkRateLimit,
  setDailyLimit,
  getDailyLimit,
  setRateLimitEnabled,
  isRateLimitEnabled,
} from '../services/rateLimiter';
import type { RateLimitStatus } from '../services/rateLimiter';

function formatDisplayCost(usd: number): string {
  if (usd === 0) return '$0.00';
  if (usd < 0.001) return '<$0.001';
  if (usd < 0.01) return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(2)}`;
}

export function AISettingsScreen() {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const navigation = useNavigation();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [provider, setProvider] = useState<AIProvider | null>(null);

  // Cost visibility state
  const [sessionCost, setSessionCostVal] = useState(0);
  const [dailyCost, setDailyCostVal] = useState(0);
  const [costHistory, setCostHistory] = useState<DailyCostEntry[]>([]);

  // Rate limit state
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(null);
  const [rateLimitEnabled, setRateLimitEnabledState] = useState(true);
  const [dailyLimitValue, setDailyLimitValue] = useState('50');

  useEffect(() => {
    checkConfiguration();
    loadCostData();
    loadRateLimitData();
  }, []);

  const checkConfiguration = async (): Promise<void> => {
    try {
      const service = await getAIService();
      const configured = await service.isConfigured();
      setIsConfigured(configured);
      if (configured) {
        setProvider(service.getProvider());
      }
    } catch {
      setIsConfigured(false);
    }
  };

  const loadCostData = async (): Promise<void> => {
    try {
      setSessionCostVal(getSessionCost());
      const daily = await getDailyCost();
      setDailyCostVal(daily);
      const history = await getCostHistory();
      setCostHistory(history);
    } catch {
      // Non-critical — defaults are fine
    }
  };

  const loadRateLimitData = async (): Promise<void> => {
    try {
      const status = await checkRateLimit();
      setRateLimitStatus(status);
      const enabled = await isRateLimitEnabled();
      setRateLimitEnabledState(enabled);
      const limit = await getDailyLimit();
      setDailyLimitValue(String(limit));
    } catch {
      // Non-critical — defaults are fine
    }
  };

  const handleRateLimitToggle = useCallback(async (value: boolean): Promise<void> => {
    setRateLimitEnabledState(value);
    await setRateLimitEnabled(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await loadRateLimitData();
  }, []);

  const handleDailyLimitChange = useCallback(async (text: string): Promise<void> => {
    // Only allow numeric input
    const cleaned = text.replace(/[^0-9]/g, '');
    setDailyLimitValue(cleaned);

    const num = parseInt(cleaned, 10);
    if (!isNaN(num) && num >= 10 && num <= 200) {
      await setDailyLimit(num);
      await loadRateLimitData();
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!apiKey.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert('Missing Key', 'Please enter an API key');
      return;
    }

    setIsSaving(true);
    try {
      const service = await getAIService();
      await service.setApiKey(apiKey.trim());
      setIsConfigured(true);
      setProvider(service.getProvider());
      setApiKey('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert('All Set', 'Your AI companion is ready.');
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [apiKey]);

  const handleClear = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert('Remove API Key?', 'The AI companion will stop working until you add a new key.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const service = await getAIService();
          await service.clearApiKey();
          setIsConfigured(false);
          setProvider(null);
        },
      },
    ]);
  }, []);

  const canSave = apiKey.trim().length > 0 && !isSaving;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="chevron-left" size={26} color={ds.colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>AI Companion</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Card */}
          <Animated.View entering={FadeInDown.duration(300)} style={styles.card}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status</Text>
              <View style={styles.statusValue}>
                <View
                  style={[
                    styles.statusDot,
                    isConfigured ? styles.statusDotActive : styles.statusDotInactive,
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    isConfigured ? styles.statusTextActive : styles.statusTextInactive,
                  ]}
                >
                  {isConfigured ? 'Connected' : 'Not configured'}
                </Text>
              </View>
            </View>

            {isConfigured && provider && (
              <View style={styles.providerRow}>
                <Text style={styles.statusLabel}>Provider</Text>
                <Text style={styles.providerText}>
                  {provider === 'openai'
                    ? 'OpenAI'
                    : provider === 'anthropic'
                      ? 'Anthropic'
                      : provider === 'openrouter'
                        ? 'OpenRouter'
                        : provider === 'openclaw'
                          ? 'OpenClaw'
                          : provider}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* API Key Input */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <Text style={styles.sectionLabel}>
              {isConfigured ? 'Update API Key' : 'Enter API Key'}
            </Text>

            <View style={styles.inputRow}>
              <TextInput
                value={apiKey}
                onChangeText={setApiKey}
                placeholder={
                  isConfigured ? '••••••••••••••••' : 'sk-... or sk-ant-... or sk-or-...'
                }
                placeholderTextColor={ds.colors.textQuaternary}
                secureTextEntry={!showKey}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
              <Pressable onPress={() => setShowKey(!showKey)} style={styles.eyeBtn}>
                <Feather
                  name={showKey ? 'eye-off' : 'eye'}
                  size={20}
                  color={ds.colors.textTertiary}
                />
              </Pressable>
            </View>

            <Text style={styles.hint}>Stored securely on-device. Never sent to our servers.</Text>
          </Animated.View>

          {/* Save Button */}
          <Animated.View entering={FadeInDown.delay(150).duration(300)}>
            <Pressable
              onPress={handleSave}
              disabled={!canSave}
              style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            >
              <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextDisabled]}>
                {isSaving ? 'Saving...' : 'Save API Key'}
              </Text>
            </Pressable>
          </Animated.View>

          {/* Clear Button */}
          {isConfigured && (
            <Animated.View entering={FadeIn.duration(300)}>
              <Pressable
                onPress={handleClear}
                style={styles.clearBtn}
                accessibilityLabel="Remove API key"
                accessibilityRole="button"
              >
                <Text style={styles.clearBtnText}>Remove API Key</Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Usage & Costs Section */}
          <Animated.View entering={FadeInDown.delay(160).duration(300)}>
            <Text style={styles.sectionLabel}>Usage & Costs</Text>
            <View style={styles.card}>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Session cost</Text>
                <Text style={styles.costValue}>{formatDisplayCost(sessionCost)}</Text>
              </View>
              <View style={[styles.costRow, styles.costRowBorder]}>
                <Text style={styles.costLabel}>Today&apos;s cost</Text>
                <Text style={styles.costValue}>{formatDisplayCost(dailyCost)}</Text>
              </View>

              {/* Recent usage mini chart */}
              {costHistory.length > 0 && (
                <View style={styles.historySection}>
                  <Text style={styles.historyTitle}>Recent days</Text>
                  <View style={styles.barChart}>
                    {costHistory.slice(-7).map((entry) => {
                      const maxCost = Math.max(...costHistory.map((e) => e.cost), dailyCost, 0.001);
                      const heightPct = Math.max(4, (entry.cost / maxCost) * 100);
                      return (
                        <View key={entry.date} style={styles.barColumn}>
                          <View style={[styles.bar, { height: `${heightPct}%` }]} />
                          <Text style={styles.barLabel}>{entry.date.slice(-2)}</Text>
                        </View>
                      );
                    })}
                    {/* Today */}
                    <View style={styles.barColumn}>
                      <View
                        style={[
                          styles.bar,
                          styles.barToday,
                          {
                            height: `${Math.max(4, costHistory.length > 0 ? (dailyCost / Math.max(...costHistory.map((e) => e.cost), dailyCost, 0.001)) * 100 : 100)}%`,
                          },
                        ]}
                      />
                      <Text style={[styles.barLabel, styles.barLabelToday]}>Today</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Rate Limiting Section */}
          <Animated.View entering={FadeInDown.delay(180).duration(300)}>
            <Text style={styles.sectionLabel}>Rate Limiting</Text>
            <View style={styles.card}>
              <View style={styles.toggleRow}>
                <Text style={styles.costLabel}>Enable rate limiting</Text>
                <Switch
                  value={rateLimitEnabled}
                  onValueChange={handleRateLimitToggle}
                  trackColor={{
                    false: ds.colors.bgElevated,
                    true: ds.colors.accentMuted,
                  }}
                  thumbColor={rateLimitEnabled ? ds.colors.accent : ds.colors.textTertiary}
                  accessibilityLabel="Toggle rate limiting"
                  accessibilityRole="switch"
                  accessibilityState={{ checked: rateLimitEnabled }}
                />
              </View>

              {rateLimitEnabled && (
                <>
                  <View style={[styles.costRow, styles.costRowBorder]}>
                    <Text style={styles.costLabel}>Daily limit</Text>
                    <TextInput
                      value={dailyLimitValue}
                      onChangeText={handleDailyLimitChange}
                      keyboardType="number-pad"
                      style={styles.limitInput}
                      maxLength={3}
                      accessibilityLabel="Daily message limit"
                      accessibilityHint="Enter a number between 10 and 200"
                    />
                  </View>
                  <Text style={styles.limitHint}>10–200 messages per day</Text>

                  {rateLimitStatus && (
                    <View style={[styles.costRow, styles.costRowBorder]}>
                      <Text style={styles.costLabel}>Remaining today</Text>
                      <Text
                        style={[
                          styles.costValue,
                          rateLimitStatus.remaining <= 5 && styles.costValueWarning,
                        ]}
                      >
                        {rateLimitStatus.remaining} / {rateLimitStatus.limit}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </Animated.View>

          {/* Get API Key Section */}
          <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.helpSection}>
            <Text style={styles.sectionLabel}>Get an API Key</Text>

            <Pressable
              onPress={() => Linking.openURL('https://platform.openai.com/api-keys')}
              style={({ pressed }) => [styles.providerCard, pressed && styles.providerCardPressed]}
            >
              <View>
                <Text style={styles.providerName}>OpenAI</Text>
                <Text style={styles.providerModels}>GPT-4o, GPT-4o-mini</Text>
              </View>
              <Feather name="external-link" size={18} color={ds.colors.textTertiary} />
            </Pressable>

            <Pressable
              onPress={() => Linking.openURL('https://console.anthropic.com/settings/keys')}
              style={({ pressed }) => [styles.providerCard, pressed && styles.providerCardPressed]}
            >
              <View>
                <Text style={styles.providerName}>Anthropic</Text>
                <Text style={styles.providerModels}>Claude 3.5 Sonnet</Text>
              </View>
              <Feather name="external-link" size={18} color={ds.colors.textTertiary} />
            </Pressable>

            <Pressable
              onPress={() => Linking.openURL('https://openrouter.ai/keys')}
              style={({ pressed }) => [styles.providerCard, pressed && styles.providerCardPressed]}
            >
              <View>
                <Text style={styles.providerName}>OpenRouter</Text>
                <Text style={styles.providerModels}>100+ models, one key</Text>
              </View>
              <Feather name="external-link" size={18} color={ds.colors.textTertiary} />
            </Pressable>

            <Pressable
              onPress={() => Linking.openURL('https://openclaw.ai')}
              style={({ pressed }) => [styles.providerCard, pressed && styles.providerCardPressed]}
            >
              <View>
                <Text style={styles.providerName}>OpenClaw</Text>
                <Text style={styles.providerModels}>Self-hosted AI assistant</Text>
              </View>
              <Feather name="external-link" size={18} color={ds.colors.textTertiary} />
            </Pressable>
          </Animated.View>

          {/* Privacy Note */}
          <Animated.View entering={FadeInDown.delay(250).duration(300)} style={styles.privacyCard}>
            <View style={styles.privacyIcon}>
              <Feather name="shield" size={20} color={ds.colors.success} />
            </View>
            <View style={styles.privacyContent}>
              <Text style={styles.privacyTitle}>Privacy First</Text>
              <Text style={styles.privacyText}>
                Conversations are encrypted on-device. Your API key never leaves your phone.
              </Text>
            </View>
          </Animated.View>

          <View style={{ height: ds.space[12] }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (ds: DS) =>
  ({
    container: {
      flex: 1,
      backgroundColor: ds.colors.bgPrimary,
    },
    safe: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: ds.sizes.contentPadding,
      paddingTop: ds.space[4],
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: ds.space[3],
      paddingVertical: ds.space[2],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: ds.colors.borderSubtle,
    },
    backBtn: {
      width: 48,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      ...ds.typography.body,
      fontWeight: '600',
      color: ds.colors.textPrimary,
    },
    headerSpacer: {
      width: 48,
    },

    // Status Card
    card: {
      backgroundColor: ds.colors.bgTertiary,
      borderRadius: ds.radius.lg,
      padding: ds.space[4],
      marginBottom: ds.space[6],
    },
    statusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statusLabel: {
      ...ds.typography.body,
      color: ds.colors.textTertiary,
    },
    statusValue: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: ds.space[2],
    },
    statusDotActive: {
      backgroundColor: ds.colors.success,
    },
    statusDotInactive: {
      backgroundColor: ds.colors.error,
    },
    statusText: {
      ...ds.typography.body,
    },
    statusTextActive: {
      color: ds.colors.success,
    },
    statusTextInactive: {
      color: ds.colors.error,
    },
    providerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: ds.space[3],
      paddingTop: ds.space[3],
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ds.colors.divider,
    },
    providerText: {
      ...ds.typography.body,
      color: ds.colors.textPrimary,
    },

    // Input
    sectionLabel: {
      ...ds.typography.caption,
      color: ds.colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: ds.space[2],
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: ds.colors.bgTertiary,
      borderRadius: ds.radius.lg,
      marginBottom: ds.space[2],
    },
    input: {
      flex: 1,
      ...ds.typography.body,
      color: ds.colors.textPrimary,
      paddingHorizontal: ds.space[4],
      paddingVertical: ds.space[4],
    },
    eyeBtn: {
      paddingHorizontal: ds.space[4],
      paddingVertical: ds.space[4],
    },
    hint: {
      ...ds.typography.caption,
      color: ds.colors.textQuaternary,
      marginBottom: ds.space[6],
    },

    // Buttons
    saveBtn: {
      backgroundColor: ds.colors.accent,
      borderRadius: ds.radius.lg,
      paddingVertical: ds.space[4],
      alignItems: 'center',
      marginBottom: ds.space[3],
    },
    saveBtnDisabled: {
      backgroundColor: ds.colors.bgTertiary,
    },
    saveBtnText: {
      ...ds.typography.body,
      fontWeight: '600',
      color: ds.colors.text,
    },
    saveBtnTextDisabled: {
      color: ds.colors.textQuaternary,
    },
    clearBtn: {
      backgroundColor: ds.colors.bgTertiary,
      borderRadius: ds.radius.lg,
      paddingVertical: ds.space[4],
      alignItems: 'center',
      marginBottom: ds.space[8],
    },
    clearBtnText: {
      ...ds.typography.body,
      fontWeight: '500',
      color: ds.colors.error,
    },

    // Cost & Usage
    costRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: ds.space[1],
    },
    costRowBorder: {
      marginTop: ds.space[3],
      paddingTop: ds.space[3],
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ds.colors.divider,
    },
    costLabel: {
      ...ds.typography.body,
      color: ds.colors.textSecondary,
    },
    costValue: {
      ...ds.typography.body,
      fontWeight: '600',
      color: ds.colors.textPrimary,
    },
    costValueWarning: {
      color: ds.colors.warning,
    },
    historySection: {
      marginTop: ds.space[4],
      paddingTop: ds.space[3],
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ds.colors.divider,
    },
    historyTitle: {
      ...ds.typography.caption,
      color: ds.colors.textTertiary,
      marginBottom: ds.space[2],
    },
    barChart: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      height: 60,
      gap: ds.space[2],
    },
    barColumn: {
      flex: 1,
      alignItems: 'center',
      height: '100%',
      justifyContent: 'flex-end',
    },
    bar: {
      width: '100%',
      minHeight: 3,
      backgroundColor: ds.colors.accentMuted,
      borderRadius: ds.radius.xs,
    },
    barToday: {
      backgroundColor: ds.colors.accent,
    },
    barLabel: {
      ...ds.typography.micro,
      color: ds.colors.textQuaternary,
      marginTop: ds.space[1],
    },
    barLabelToday: {
      color: ds.colors.accent,
    },

    // Rate Limiting
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    limitInput: {
      ...ds.typography.body,
      fontWeight: '600',
      color: ds.colors.textPrimary,
      backgroundColor: ds.colors.bgQuaternary,
      borderRadius: ds.radius.sm,
      paddingHorizontal: ds.space[3],
      paddingVertical: ds.space[2],
      textAlign: 'center',
      minWidth: 60,
    },
    limitHint: {
      ...ds.typography.caption,
      color: ds.colors.textQuaternary,
      marginTop: ds.space[1],
    },

    // Help Section
    helpSection: {
      marginTop: ds.space[2],
    },
    providerCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: ds.colors.bgTertiary,
      borderRadius: ds.radius.lg,
      padding: ds.space[4],
      marginBottom: ds.space[2],
    },
    providerCardPressed: {
      backgroundColor: ds.colors.bgQuaternary,
    },
    providerName: {
      ...ds.typography.body,
      fontWeight: '500',
      color: ds.colors.textPrimary,
    },
    providerModels: {
      ...ds.typography.caption,
      color: ds.colors.textTertiary,
      marginTop: 2,
    },

    // Privacy Card
    privacyCard: {
      flexDirection: 'row',
      backgroundColor: ds.colors.successMuted,
      borderRadius: ds.radius.lg,
      padding: ds.space[4],
      marginTop: ds.space[6],
    },
    privacyIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: ds.colors.successMuted,
      justifyContent: 'center',
      alignItems: 'center',
    },
    privacyContent: {
      flex: 1,
      marginLeft: ds.space[3],
    },
    privacyTitle: {
      ...ds.typography.body,
      fontWeight: '600',
      color: ds.colors.success,
    },
    privacyText: {
      ...ds.typography.caption,
      color: ds.colors.textSecondary,
      marginTop: ds.space[1],
      lineHeight: 18,
    },
  }) as const;
