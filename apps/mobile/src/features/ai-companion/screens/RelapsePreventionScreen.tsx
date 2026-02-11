/**
 * Relapse Prevention Plan Screen
 * Interactive relapse prevention plan builder.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import { loadSafetyPlan, saveSafetyPlan, type SafetyPlan } from '../services/safetyPlanService';

interface PlanSection {
  key: keyof Pick<
    SafetyPlan,
    'warningSignals' | 'copingStrategies' | 'distractions' | 'safeEnvironment' | 'reasonsToLive'
  >;
  title: string;
  emoji: string;
  prompt: string;
  placeholder: string;
}

const SECTIONS: PlanSection[] = [
  {
    key: 'warningSignals',
    title: 'Warning Signals',
    emoji: '⚠️',
    prompt: 'What are the signs that tell you a craving or crisis may be coming?',
    placeholder: 'e.g., isolation, irritability, not sleeping...',
  },
  {
    key: 'copingStrategies',
    title: 'Coping Strategies',
    emoji: '🛡️',
    prompt: "What works for you when you're struggling?",
    placeholder: 'e.g., call sponsor, go for a walk, breathing...',
  },
  {
    key: 'distractions',
    title: 'Healthy Distractions',
    emoji: '🎯',
    prompt: 'What activities can take your mind off cravings?',
    placeholder: 'e.g., exercise, music, cooking, reading...',
  },
  {
    key: 'safeEnvironment',
    title: 'Safe Places',
    emoji: '🏠',
    prompt: 'Where do you feel safe and supported?',
    placeholder: "e.g., home, meeting hall, park, friend's house...",
  },
  {
    key: 'reasonsToLive',
    title: 'Reasons to Keep Going',
    emoji: '💛',
    prompt: 'What gives you purpose? Who are you doing this for?',
    placeholder: 'e.g., my kids, my health, my future...',
  },
];

export function RelapsePreventionScreen(): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const navigation = useNavigation();
  const [plan, setPlan] = useState<SafetyPlan | null>(null);
  const [newItem, setNewItem] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSafetyPlan().then(setPlan);
  }, []);

  const handleAddItem = useCallback(
    async (sectionKey: keyof SafetyPlan): Promise<void> => {
      if (!plan || !newItem.trim()) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

      const updated = { ...plan };
      const arr = updated[sectionKey];
      if (Array.isArray(arr)) {
        (arr as string[]).push(newItem.trim());
      }

      setPlan(updated);
      setNewItem('');
      setSaving(true);
      await saveSafetyPlan(updated);
      setSaving(false);
    },
    [plan, newItem],
  );

  const handleRemoveItem = useCallback(
    async (sectionKey: keyof SafetyPlan, index: number): Promise<void> => {
      if (!plan) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      const updated = { ...plan };
      const arr = updated[sectionKey];
      if (Array.isArray(arr)) {
        (arr as string[]).splice(index, 1);
      }

      setPlan(updated);
      setSaving(true);
      await saveSafetyPlan(updated);
      setSaving(false);
    },
    [plan],
  );

  if (!plan) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Feather name="chevron-left" size={26} color={ds.colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>My Prevention Plan</Text>
            <View style={styles.headerRight}>
              {saving && <Text style={styles.savingText}>Saving...</Text>}
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {SECTIONS.map((section, sIdx) => {
              const items = plan[section.key] as string[];
              const isActive = activeSection === section.key;

              return (
                <Animated.View
                  key={section.key}
                  entering={FadeInDown.delay(sIdx * 50).duration(300)}
                  style={styles.section}
                >
                  <Pressable
                    onPress={() => setActiveSection(isActive ? null : section.key)}
                    style={styles.sectionHeader}
                    accessibilityRole="button"
                    accessibilityLabel={`${section.title}, ${items.length} items`}
                    accessibilityState={{ expanded: isActive }}
                  >
                    <Text style={styles.sectionEmoji}>{section.emoji}</Text>
                    <View style={styles.sectionTitleArea}>
                      <Text style={styles.sectionTitle}>{section.title}</Text>
                      <Text style={styles.sectionCount}>{items.length} items</Text>
                    </View>
                    <Feather
                      name={isActive ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={ds.colors.textTertiary}
                    />
                  </Pressable>

                  {isActive && (
                    <View style={styles.sectionBody}>
                      <Text style={styles.sectionPrompt}>{section.prompt}</Text>

                      {items.map((item, i) => (
                        <View key={`${item}-${i}`} style={styles.itemRow}>
                          <Text style={styles.itemText}>{item}</Text>
                          <Pressable
                            onPress={() => handleRemoveItem(section.key, i)}
                            style={styles.removeBtn}
                            accessibilityRole="button"
                            accessibilityLabel={`Remove ${item}`}
                          >
                            <Feather name="x" size={16} color={ds.colors.textQuaternary} />
                          </Pressable>
                        </View>
                      ))}

                      <View style={styles.addRow}>
                        <TextInput
                          value={newItem}
                          onChangeText={setNewItem}
                          placeholder={section.placeholder}
                          placeholderTextColor={ds.colors.textQuaternary}
                          style={styles.addInput}
                          onSubmitEditing={() => handleAddItem(section.key)}
                          returnKeyType="done"
                          accessibilityLabel={`Add ${section.title.toLowerCase()}`}
                        />
                        <Pressable
                          onPress={() => handleAddItem(section.key)}
                          disabled={!newItem.trim()}
                          style={({ pressed }) => [
                            styles.addBtn,
                            !newItem.trim() && styles.addBtnDisabled,
                            pressed && styles.addBtnPressed,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel="Add item"
                          accessibilityState={{ disabled: !newItem.trim() }}
                        >
                          <Feather name="plus" size={20} color={ds.colors.text} />
                        </Pressable>
                      </View>
                    </View>
                  )}
                </Animated.View>
              );
            })}

            {/* Support Contacts section */}
            <Animated.View
              entering={FadeInDown.delay(SECTIONS.length * 50).duration(300)}
              style={styles.contactsCard}
            >
              <Text style={styles.contactsTitle}>📞 Emergency Contacts</Text>
              {plan.professionalContacts.map((c, i) => (
                <View key={`${c.name}-${i}`} style={styles.contactRow}>
                  <Text style={styles.contactName}>{c.name}</Text>
                  <Text style={styles.contactPhone}>{c.phone || ''}</Text>
                </View>
              ))}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (ds: DS) =>
  ({
    container: { flex: 1, backgroundColor: ds.colors.bgPrimary },
    safe: { flex: 1 },
    keyboardView: { flex: 1 },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: ds.space[3],
      paddingVertical: ds.space[2],
    },
    backBtn: {
      width: 44,
      height: 44,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    headerTitle: {
      ...ds.typography.body,
      fontWeight: '600' as const,
      color: ds.colors.textPrimary,
    },
    headerRight: { width: 60 },
    savingText: { ...ds.typography.micro, color: ds.colors.textQuaternary },

    scroll: { flex: 1 },
    content: { paddingHorizontal: ds.space[4], paddingBottom: ds.space[10] },

    section: {
      backgroundColor: ds.colors.bgSecondary,
      borderRadius: ds.radius.lg,
      marginBottom: ds.space[3],
      overflow: 'hidden' as const,
    },
    sectionHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: ds.space[4],
    },
    sectionEmoji: { fontSize: 24, marginRight: ds.space[3] },
    sectionTitleArea: { flex: 1 },
    sectionTitle: {
      ...ds.typography.body,
      fontWeight: '600' as const,
      color: ds.colors.textPrimary,
    },
    sectionCount: { ...ds.typography.micro, color: ds.colors.textTertiary },
    sectionBody: { paddingHorizontal: ds.space[4], paddingBottom: ds.space[4] },
    sectionPrompt: {
      ...ds.typography.caption,
      color: ds.colors.textSecondary,
      marginBottom: ds.space[3],
      fontStyle: 'italic' as const,
    },

    itemRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: ds.colors.bgTertiary,
      borderRadius: ds.radius.md,
      paddingHorizontal: ds.space[3],
      paddingVertical: ds.space[2],
      marginBottom: ds.space[2],
    },
    itemText: { ...ds.typography.caption, color: ds.colors.textPrimary, flex: 1 },
    removeBtn: { padding: ds.space[1] },

    addRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginTop: ds.space[2],
    },
    addInput: {
      flex: 1,
      ...ds.typography.caption,
      color: ds.colors.textPrimary,
      backgroundColor: ds.colors.bgTertiary,
      borderRadius: ds.radius.md,
      paddingHorizontal: ds.space[3],
      paddingVertical: ds.space[2],
      marginRight: ds.space[2],
    },
    addBtn: {
      width: 40,
      height: 40,
      borderRadius: ds.radius.full,
      backgroundColor: ds.colors.accent,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    addBtnDisabled: { opacity: 0.4 },
    addBtnPressed: { opacity: 0.8 },

    contactsCard: {
      backgroundColor: ds.colors.bgSecondary,
      borderRadius: ds.radius.lg,
      padding: ds.space[4],
      marginBottom: ds.space[3],
    },
    contactsTitle: {
      ...ds.typography.body,
      fontWeight: '600' as const,
      color: ds.colors.textPrimary,
      marginBottom: ds.space[3],
    },
    contactRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: ds.space[2],
      borderBottomWidth: 0.5,
      borderBottomColor: ds.colors.borderSubtle,
    },
    contactName: { ...ds.typography.caption, color: ds.colors.textPrimary },
    contactPhone: { ...ds.typography.caption, color: ds.colors.accent },
  }) as const;
