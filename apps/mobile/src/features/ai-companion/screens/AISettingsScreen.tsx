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
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ds } from '../../../design-system/tokens/ds';
import { getAIService } from '../services/aiService';

export function AISettingsScreen() {
  const navigation = useNavigation();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [provider, setProvider] = useState<'openai' | 'anthropic' | null>(null);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
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
    Alert.alert(
      'Remove API Key?',
      'The AI companion will stop working until you add a new key.',
      [
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
      ]
    );
  }, []);

  const canSave = apiKey.trim().length > 0 && !isSaving;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable 
            onPress={() => navigation.goBack()} 
            style={styles.backBtn}
          >
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
                <View style={[
                  styles.statusDot,
                  isConfigured ? styles.statusDotActive : styles.statusDotInactive
                ]} />
                <Text style={[
                  styles.statusText,
                  isConfigured ? styles.statusTextActive : styles.statusTextInactive
                ]}>
                  {isConfigured ? 'Connected' : 'Not configured'}
                </Text>
              </View>
            </View>

            {isConfigured && provider && (
              <View style={styles.providerRow}>
                <Text style={styles.statusLabel}>Provider</Text>
                <Text style={styles.providerText}>{provider === 'openai' ? 'OpenAI' : 'Anthropic'}</Text>
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
                placeholder={isConfigured ? '••••••••••••••••' : 'sk-... or sk-ant-...'}
                placeholderTextColor={ds.colors.textQuaternary}
                secureTextEntry={!showKey}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
              <Pressable
                onPress={() => setShowKey(!showKey)}
                style={styles.eyeBtn}
              >
                <Feather 
                  name={showKey ? 'eye-off' : 'eye'} 
                  size={20} 
                  color={ds.colors.textTertiary} 
                />
              </Pressable>
            </View>

            <Text style={styles.hint}>
              Stored securely on-device. Never sent to our servers.
            </Text>
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
              <Pressable onPress={handleClear} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>Remove API Key</Text>
              </Pressable>
            </Animated.View>
          )}

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

const styles = StyleSheet.create({
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
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...ds.typography.body,
    fontWeight: '600',
    color: ds.colors.textPrimary,
  },
  headerSpacer: {
    width: 44,
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
    color: '#000',
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
});
