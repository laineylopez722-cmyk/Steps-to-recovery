import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '../../../design-system/components/GlassCard';
import { GradientButton } from '../../../design-system/components/GradientButton';
import { darkAccent, gradients, radius, spacing, typography } from '../../../design-system/tokens/modern';
import { useCreateJournalEntry, useUpdateJournalEntry, useJournalEntries } from '../hooks/useJournalEntries';
import { Slider } from '../../../components/Slider';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const MOOD_LABELS: Record<number, string> = {
  1: 'Struggling',
  2: 'Difficult',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
};

const MOOD_EMOJI: Record<number, string> = {
  1: '😢',
  2: '😔',
  3: '😐',
  4: '🙂',
  5: '😊',
};

const MOOD_GRADIENTS: Record<number, string[]> = {
  1: ['#EF4444', '#DC2626'],
  2: ['#F59E0B', '#D97706'],
  3: ['#6B7280', '#4B5563'],
  4: ['#10B981', '#059669'],
  5: ['#3B82F6', '#2563EB'],
};

export function JournalEditorScreenModern(): React.ReactElement {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as { 
    mode?: 'create' | 'edit'; 
    entryId?: string; 
    userId: string;
    initialTitle?: string;
    initialContent?: string;
    tags?: string[];
  } | undefined;
  
  const { entries } = useJournalEntries(params?.userId || '');
  const { createEntry, isPending: isCreating } = useCreateJournalEntry(params?.userId || '');
  const { updateEntry, isPending: isUpdating } = useUpdateJournalEntry(params?.userId || '');

  const [title, setTitle] = useState(params?.initialTitle || '');
  const [body, setBody] = useState(params?.initialContent || '');
  const [mood, setMood] = useState<number>(3);
  const [craving, setCraving] = useState<number>(0);
  const [tags, setTags] = useState<string[]>(params?.tags || []);
  const [tagInput, setTagInput] = useState('');

  const isEditMode = params?.mode === 'edit';
  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (isEditMode && params?.entryId) {
      const entry = entries.find((e) => e.id === params.entryId);
      if (entry) {
        setTitle(entry.title || '');
        setBody(entry.body);
        setMood(entry.mood || 3);
        setCraving(entry.craving || 0);
        setTags(entry.tags || []);
      }
    }
  }, [isEditMode, params?.entryId, entries]);

  const handleAddTag = useCallback(() => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [tagInput, tags]);

  const handleRemoveTag = useCallback((tag: string) => {
    setTags(tags.filter((t) => t !== tag));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [tags]);

  const handleSave = useCallback(async () => {
    if (!body.trim()) return;

    try {
      if (isEditMode && params?.entryId) {
        await updateEntry(params.entryId, {
          title: title.trim() || null,
          body: body.trim(),
          mood,
          craving,
          tags,
        });
      } else {
        await createEntry({
          title: title.trim() || null,
          body: body.trim(),
          mood,
          craving,
          tags,
        });
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [body, title, mood, craving, tags, isEditMode, params?.entryId, createEntry, updateEntry, navigation]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[darkAccent.background, '#0a0f1c', darkAccent.surface]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
            <Pressable 
              onPress={() => navigation.goBack()} 
              style={styles.backButton}
              accessibilityLabel="Go back"
              accessibilityRole="button"
              accessibilityHint="Returns to journal list"
            >
              <MaterialIcons name="arrow-back" size={24} color={darkAccent.text} accessible={false} />
            </Pressable>
            <Text style={styles.headerTitle} accessibilityRole="header">
              {isEditMode ? 'Edit Entry' : 'New Entry'}
            </Text>
            <View style={styles.headerRight}>
              <View style={styles.privacyBadge}>
                <MaterialIcons name="lock" size={14} color={darkAccent.success} accessible={false} />
                <Text style={styles.privacyText}>Encrypted</Text>
              </View>
            </View>
          </Animated.View>

          <AnimatedScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Title Input */}
            <Animated.View entering={FadeInUp.delay(100)}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Title (optional)"
                placeholderTextColor={darkAccent.textSubtle}
                style={styles.titleInput}
                accessibilityLabel="Entry title"
                accessibilityHint="Optional title for your journal entry"
              />
            </Animated.View>

            {/* Body Input */}
            <Animated.View entering={FadeInUp.delay(150)}>
              <GlassCard intensity="medium" style={styles.bodyCard}>
                <TextInput
                  value={body}
                  onChangeText={setBody}
                  placeholder="What's on your mind today? Write freely..."
                  placeholderTextColor={darkAccent.textSubtle}
                  multiline
                  textAlignVertical="top"
                  style={styles.bodyInput}
                  accessibilityLabel="Entry content"
                  accessibilityHint="Write your thoughts and feelings"
                />
                <Text style={styles.charCount}>{body.length} characters</Text>
              </GlassCard>
            </Animated.View>

            {/* Mood Selector */}
            <Animated.View entering={FadeInUp.delay(200)}>
              <Text style={styles.sectionTitle} accessibilityRole="header">How are you feeling?</Text>
              <GlassCard intensity="light" style={styles.moodCard}>
                <View style={styles.moodHeader}>
                  <LinearGradient
                    colors={MOOD_GRADIENTS[mood]}
                    style={styles.moodEmojiContainer}
                  >
                    <Text style={styles.moodEmoji} accessible={false}>{MOOD_EMOJI[mood]}</Text>
                  </LinearGradient>
                  <View style={styles.moodTextContainer}>
                    <Text style={styles.moodValue}>{MOOD_LABELS[mood]}</Text>
                    <Text style={styles.moodSubtext}>Tap to adjust</Text>
                  </View>
                </View>
                <View 
                  style={styles.sliderContainer}
                  accessibilityLabel={`Mood level: ${MOOD_LABELS[mood]}`}
                  accessibilityRole="adjustable"
                  accessibilityHint="Tap a dot to select your mood level from 1 to 5"
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Pressable
                      key={value}
                      onPress={() => {
                        setMood(value);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={[
                        styles.moodDot,
                        mood >= value && { 
                          backgroundColor: MOOD_GRADIENTS[value][0],
                          transform: [{ scale: 1.2 }]
                        },
                      ]}
                      accessibilityLabel={`Set mood to ${MOOD_LABELS[value]}`}
                      accessibilityRole="button"
                    />
                  ))}
                </View>
              </GlassCard>
            </Animated.View>

            {/* Craving Level */}
            <Animated.View entering={FadeInUp.delay(250)}>
              <Text style={styles.sectionTitle} accessibilityRole="header">Craving Level</Text>
              <GlassCard intensity="light" style={styles.cravingCard}>
                <View style={styles.cravingHeader}>
                  <Text style={styles.cravingValue}>{craving}</Text>
                  <Text style={styles.cravingLabel}>/ 10</Text>
                </View>
                <Slider
                  value={craving}
                  onValueChange={setCraving}
                  minimumValue={0}
                  maximumValue={10}
                  step={1}
                  minimumTrackTintColor={craving > 5 ? darkAccent.error : darkAccent.success}
                  maximumTrackTintColor={darkAccent.border}
                  accessibilityLabel={`Craving level ${craving} out of 10`}
                  accessibilityRole="adjustable"
                  accessibilityHint="Slide to adjust your craving level from 0 to 10"
                />
                {craving >= 7 && (
                  <View style={styles.warningContainer}>
                    <MaterialIcons name="warning" size={18} color={darkAccent.error} accessible={false} />
                    <Text style={styles.warningText}>
                      High craving. Consider reaching out to your sponsor.
                    </Text>
                  </View>
                )}
              </GlassCard>
            </Animated.View>

            {/* Tags */}
            <Animated.View entering={FadeInUp.delay(300)}>
              <Text style={styles.sectionTitle} accessibilityRole="header">Tags</Text>
              <GlassCard intensity="light" style={styles.tagsCard}>
                <View style={styles.tagInputRow}>
                  <TextInput
                    value={tagInput}
                    onChangeText={setTagInput}
                    placeholder="Add a tag..."
                    placeholderTextColor={darkAccent.textSubtle}
                    onSubmitEditing={handleAddTag}
                    style={styles.tagInput}
                    accessibilityLabel="New tag"
                    accessibilityHint="Enter a tag and submit to add it"
                  />
                  <Pressable 
                    onPress={handleAddTag} 
                    style={styles.addTagButton}
                    accessibilityLabel="Add tag"
                    accessibilityRole="button"
                    accessibilityHint="Adds the tag to your entry"
                  >
                    <MaterialIcons name="add" size={24} color={darkAccent.primary} accessible={false} />
                  </Pressable>
                </View>
                <View style={styles.tagsList}>
                  {tags.map((tag) => (
                    <Pressable
                      key={tag}
                      onPress={() => handleRemoveTag(tag)}
                      style={styles.tagChip}
                      accessibilityLabel={`Remove tag ${tag}`}
                      accessibilityRole="button"
                      accessibilityHint="Tap to remove this tag"
                    >
                      <Text style={styles.tagChipText}>{tag}</Text>
                      <MaterialIcons name="close" size={16} color={darkAccent.textMuted} accessible={false} />
                    </Pressable>
                  ))}
                </View>
              </GlassCard>
            </Animated.View>

            {/* Bottom padding */}
            <View style={{ height: 100 }} />
          </AnimatedScrollView>

          {/* Footer Save Button */}
          <View style={styles.footer}>
            <GradientButton
              title={isEditMode ? 'Update Entry' : 'Save Entry'}
              variant="primary"
              size="lg"
              fullWidth
              loading={isPending}
              disabled={!body.trim()}
              onPress={handleSave}
              accessibilityLabel={isEditMode ? 'Update journal entry' : 'Save journal entry'}
              accessibilityHint={isEditMode ? 'Saves changes to this entry' : 'Creates a new journal entry'}
              accessibilityState={{ disabled: !body.trim() }}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
    paddingBottom: spacing[2],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: darkAccent.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: darkAccent.text,
  },
  headerRight: {
    minWidth: 40,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${darkAccent.success}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  privacyText: {
    ...typography.caption,
    color: darkAccent.success,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[3],
    gap: spacing[3],
  },
  titleInput: {
    ...typography.h2,
    color: darkAccent.text,
    padding: 0,
  },
  bodyCard: {
    minHeight: 200,
  },
  bodyInput: {
    ...typography.bodyLarge,
    color: darkAccent.text,
    minHeight: 160,
    padding: 0,
  },
  charCount: {
    ...typography.caption,
    color: darkAccent.textSubtle,
    textAlign: 'right',
    marginTop: spacing[2],
  },
  sectionTitle: {
    ...typography.h4,
    color: darkAccent.text,
    marginBottom: spacing[1.5],
  },
  moodCard: {
    padding: spacing[3],
  },
  moodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  moodEmojiContainer: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: 28,
  },
  moodTextContainer: {
    marginLeft: spacing[2],
  },
  moodValue: {
    ...typography.h4,
    color: darkAccent.text,
  },
  moodSubtext: {
    ...typography.bodySmall,
    color: darkAccent.textMuted,
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[1],
  },
  moodDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: darkAccent.surfaceHigh,
    borderWidth: 2,
    borderColor: darkAccent.border,
  },
  cravingCard: {
    padding: spacing[3],
  },
  cravingHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing[2],
  },
  cravingValue: {
    ...typography.h2,
    color: darkAccent.text,
  },
  cravingLabel: {
    ...typography.body,
    color: darkAccent.textMuted,
    marginLeft: 4,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    backgroundColor: `${darkAccent.error}15`,
    padding: spacing[2],
    borderRadius: radius.md,
    marginTop: spacing[2],
  },
  warningText: {
    ...typography.bodySmall,
    color: darkAccent.error,
    flex: 1,
  },
  tagsCard: {
    padding: spacing[3],
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  tagInput: {
    flex: 1,
    ...typography.body,
    color: darkAccent.text,
    backgroundColor: darkAccent.surfaceHigh,
    borderRadius: radius.md,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1.5],
  },
  addTagButton: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: `${darkAccent.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1.5],
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${darkAccent.primary}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  tagChipText: {
    ...typography.bodySmall,
    color: darkAccent.primaryLight,
    fontWeight: '500',
  },
  footer: {
    padding: spacing[3],
    paddingBottom: spacing[4],
    borderTopWidth: 1,
    borderTopColor: darkAccent.border,
    backgroundColor: darkAccent.background,
  },
});
