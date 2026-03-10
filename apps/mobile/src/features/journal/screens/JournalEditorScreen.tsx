/**
 * Journal Editor - Apple Notes Style
 *
 * Full-screen, distraction-free writing.
 * Title is first line, large and bold.
 * Bottom toolbar with actions.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import { hapticLight, hapticWarning } from '../../../utils/haptics';
import { logger } from '../../../utils/logger';
import {
  useCreateJournalEntry,
  useUpdateJournalEntry,
  useJournalEntries,
  useDeleteJournalEntry,
  useUpdateJournalAudio,
} from '../hooks/useJournalEntries';
import { extractMemories } from '../utils/memoryExtraction';
import { useMemoryStore } from '../../../hooks/useMemoryStore';
import { ShareEntryModal } from '../components/ShareEntryModal';
import { VoiceRecorder } from '../components/VoiceRecorder';

interface Props {
  userId: string;
}

export function JournalEditorScreen({ userId }: Props): React.ReactElement {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const params = route.params as { mode?: 'create' | 'edit'; entryId?: string } | undefined;

  const { entries } = useJournalEntries(userId);
  const { createEntry, isPending: _isCreating } = useCreateJournalEntry(userId);
  const { updateEntry, isPending: _isUpdating } = useUpdateJournalEntry(userId);
  const { deleteEntry } = useDeleteJournalEntry(userId);
  const { saveAudio } = useUpdateJournalAudio(userId);
  const memoryStore = useMemoryStore(userId);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSaved, setIsSaved] = useState(true);
  const [saveError, setSaveError] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [encryptedAudio, setEncryptedAudio] = useState<string | null>(null);

  const bodyRef = useRef<TextInput>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originalTitle = useRef('');
  const originalBody = useRef('');
  // Track created entry ID so subsequent auto-saves use updateEntry (not createEntry)
  const createdEntryIdRef = useRef<string | null>(null);

  const isEditMode = params?.mode === 'edit';
  const paramEntryId = params?.entryId;
  // Use created ID if we already saved a new entry, otherwise use route param
  const entryId = createdEntryIdRef.current || paramEntryId;
  const effectiveEditMode = isEditMode || !!createdEntryIdRef.current;
  const currentEntry =
    effectiveEditMode && entryId ? (entries.find((e) => e.id === entryId) ?? null) : null;

  // Load existing entry
  useEffect(() => {
    if (isEditMode && paramEntryId) {
      const entry = entries.find((e) => e.id === paramEntryId);
      if (entry) {
        setTitle(entry.title || '');
        setBody(entry.body);
        originalTitle.current = entry.title || '';
        originalBody.current = entry.body;
      }
    }
  }, [isEditMode, paramEntryId, entries]);

  // Check if content changed
  const hasChanges = title !== originalTitle.current || body !== originalBody.current;

  // Auto-save
  useEffect(() => {
    if (!hasChanges) {
      setIsSaved(true);
      return;
    }

    setIsSaved(false);

    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    saveTimeout.current = setTimeout(() => {
      handleAutoSave();
    }, 2000);

    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, [title, body]);

  const handleAutoSave = async () => {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle && !trimmedBody) return;

    try {
      if (effectiveEditMode && entryId) {
        await updateEntry(entryId, {
          title: trimmedTitle || null,
          body: trimmedBody || trimmedTitle, // Use title as body if body is empty
          mood: null,
          craving: null,
          tags: [],
        });
      } else {
        const newId = await createEntry({
          title: trimmedTitle || null,
          body: trimmedBody || trimmedTitle,
          mood: null,
          craving: null,
          tags: [],
        });
        // Store created ID so subsequent saves use updateEntry
        createdEntryIdRef.current = newId;
      }

      setIsSaved(true);
      setSaveError(false);
      originalTitle.current = title;
      originalBody.current = body;

      // Extract memories for AI companion (async, don't block)
      const fullContent = `${trimmedTitle} ${trimmedBody}`;
      extractMemories(fullContent, userId, entryId)
        .then((memories) => {
          if (memories.length > 0) {
            memoryStore.addMemories(memories);
          }
        })
        .catch((err) => {
          logger.warn('Memory extraction failed', err);
        });
    } catch (err) {
      logger.error('Auto-save failed', err);
      setSaveError(true);
    }
  };

  const handleBack = async () => {
    // Save before leaving if there are changes
    if (hasChanges && (title.trim() || body.trim())) {
      await handleAutoSave();
    }
    hapticLight();
    navigation.goBack();
  };

  const handleShare = (): void => {
    hapticLight();
    setShowShareModal(true);
  };

  const handleDelete = (): void => {
    if (!entryId) return;
    hapticWarning();
    Alert.alert('Delete Entry', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEntry(entryId);
            navigation.goBack();
          } catch (err) {
            logger.error('Failed to delete journal entry', err);
            Alert.alert('Delete failed', 'Could not delete this entry. Please try again.');
          }
        },
      },
    ]);
  };

  const handleMore = (): void => {
    hapticLight();
    handleDelete();
  };

  const handleTitleSubmit = () => {
    bodyRef.current?.focus();
  };

  const handleNewEntry = async () => {
    // Save current entry first
    if (hasChanges && (title.trim() || body.trim())) {
      await handleAutoSave();
    }

    // Reset for new entry
    setTitle('');
    setBody('');
    originalTitle.current = '';
    originalBody.current = '';
    createdEntryIdRef.current = null;
    hapticLight();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={styles.header}>
            {/* Back button */}
            <Pressable
              onPress={handleBack}
              style={styles.backBtn}
              accessibilityLabel="Go back"
              accessibilityRole="button"
              testID="journal-back-button"
            >
              <View style={styles.backBtnInner}>
                <Feather name="chevron-left" size={24} color={ds.colors.textPrimary} accessibilityElementsHidden importantForAccessibility="no" />
              </View>
            </Pressable>

            {/* Right actions pill */}
            <View style={styles.actionsPill}>
              <Pressable
                onPress={handleShare}
                style={styles.actionBtn}
                accessibilityLabel="Share journal entry"
                accessibilityRole="button"
              >
                <Feather name="share" size={18} color={ds.colors.textPrimary} accessibilityElementsHidden importantForAccessibility="no" />
              </Pressable>
              <Pressable
                onPress={handleMore}
                style={styles.actionBtn}
                accessibilityLabel="Delete journal entry"
                accessibilityRole="button"
                accessibilityHint="Permanently removes this journal entry"
              >
                <Feather name="more-horizontal" size={18} color={ds.colors.textPrimary} accessibilityElementsHidden importantForAccessibility="no" />
              </Pressable>
            </View>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title - First line, large and bold */}
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              placeholderTextColor={ds.colors.textQuaternary}
              autoFocus={!isEditMode}
              returnKeyType="next"
              onSubmitEditing={handleTitleSubmit}
              blurOnSubmit={false}
              multiline={false}
              maxLength={200}
              accessibilityLabel="Journal entry title"
              accessibilityHint="Enter a title for your journal entry, maximum 200 characters"
              testID="journal-title-input"
            />

            {/* Body */}
            <TextInput
              ref={bodyRef}
              style={styles.bodyInput}
              value={body}
              onChangeText={setBody}
              placeholder="Start writing..."
              placeholderTextColor={ds.colors.textQuaternary}
              multiline
              scrollEnabled={false}
              textAlignVertical="top"
              accessibilityLabel="Journal entry content"
              accessibilityHint="Write your thoughts, feelings, and reflections"
              testID="journal-content-input"
            />

            {/* Voice recorder (shown when toggled) */}
            {showVoiceRecorder && (
              <VoiceRecorder
                existingEncryptedAudio={encryptedAudio}
                onRecordingComplete={async (audio) => {
                  setEncryptedAudio(audio);
                  // Ensure entry exists before saving audio
                  const targetId = entryId ?? createdEntryIdRef.current;
                  if (targetId) {
                    await saveAudio(targetId, audio);
                  } else {
                    // Entry not yet created — auto-save text first, then persist audio
                    await handleAutoSave();
                    const savedId = createdEntryIdRef.current;
                    if (savedId) {
                      await saveAudio(savedId, audio);
                    }
                  }
                }}
                onDiscard={async () => {
                  setEncryptedAudio(null);
                  setShowVoiceRecorder(false);
                  const targetId = entryId ?? createdEntryIdRef.current;
                  if (targetId) {
                    await saveAudio(targetId, null);
                  }
                }}
              />
            )}
          </ScrollView>

          {/* Bottom Toolbar */}
          <Animated.View
            entering={SlideInDown.duration(300)}
            style={[styles.toolbar, { paddingBottom: insets.bottom || ds.space[4] }]}
          >
            {/* Left tools */}
            <View style={styles.toolsPill}>
              <Pressable
                style={[styles.toolBtn, styles.toolBtnDisabled]}
                disabled
                accessibilityLabel="Add checklist — coming soon"
                accessibilityRole="button"
                accessibilityState={{ disabled: true }}
              >
                <Feather name="check-square" size={20} color={ds.colors.textQuaternary} accessibilityElementsHidden importantForAccessibility="no" />
              </Pressable>
              <Pressable
                style={[styles.toolBtn, showVoiceRecorder && styles.toolBtnActive]}
                onPress={() => setShowVoiceRecorder((v) => !v)}
                accessibilityLabel={showVoiceRecorder ? 'Hide voice recorder' : 'Add voice note'}
                accessibilityRole="button"
                accessibilityState={{ selected: showVoiceRecorder }}
              >
                <Feather
                  name="mic"
                  size={20}
                  color={showVoiceRecorder ? ds.colors.accent : (encryptedAudio ? ds.colors.accent : ds.colors.textSecondary)}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
              </Pressable>
              <Pressable
                style={[styles.toolBtn, styles.toolBtnDisabled]}
                disabled
                accessibilityLabel="Add mention — coming soon"
                accessibilityRole="button"
                accessibilityHint="Mention a person or tag"
                accessibilityState={{ disabled: true }}
              >
                <Feather name="at-sign" size={20} color={ds.colors.textQuaternary} accessibilityElementsHidden importantForAccessibility="no" />
              </Pressable>
            </View>

            {/* Saving indicator */}
            <View style={styles.saveStatus} accessibilityLiveRegion="polite">
              {saveError ? (
                <Pressable onPress={handleAutoSave} accessibilityLabel="Save failed, tap to retry" accessibilityRole="button">
                  <Animated.Text entering={FadeIn} style={styles.saveErrorText}>
                    Save failed · Tap to retry
                  </Animated.Text>
                </Pressable>
              ) : !isSaved ? (
                <Animated.Text entering={FadeIn} style={styles.savingText} accessibilityLabel="Saving journal entry">
                  Saving...
                </Animated.Text>
              ) : null}
            </View>

            {/* New note button */}
            <Pressable
              onPress={handleNewEntry}
              style={styles.newNoteBtn}
              accessibilityLabel="Create new journal entry"
              accessibilityRole="button"
              accessibilityHint="Saves current entry and starts a new one"
            >
              <Feather name="edit" size={20} color={ds.colors.accent} accessibilityElementsHidden importantForAccessibility="no" />
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <ShareEntryModal
        visible={showShareModal}
        entry={currentEntry}
        onClose={() => setShowShareModal(false)}
      />
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
    kav: {
      flex: 1,
    },

    // Header
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: ds.space[4],
      paddingTop: ds.space[2],
      paddingBottom: ds.space[3],
    },
    backBtn: {
      width: 48,
      height: 48,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    backBtnInner: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: ds.colors.bgTertiary,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    actionsPill: {
      flexDirection: 'row' as const,
      backgroundColor: ds.colors.bgTertiary,
      borderRadius: 20,
      paddingHorizontal: ds.space[2],
      paddingVertical: ds.space[2],
      gap: ds.space[1],
    },
    actionBtn: {
      minWidth: 48,
      minHeight: 48,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },

    // Content
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: ds.sizes.contentPadding,
      paddingTop: ds.space[2],
      paddingBottom: ds.space[20],
    },
    titleInput: {
      fontSize: 28,
      fontWeight: '700' as const,
      color: ds.colors.textPrimary,
      marginBottom: ds.space[3],
      paddingVertical: 0,
    },
    bodyInput: {
      fontSize: 17,
      lineHeight: 26,
      color: ds.colors.textPrimary,
      minHeight: 200,
      paddingVertical: 0,
    },

    // Toolbar
    toolbar: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: ds.space[4],
      paddingTop: ds.space[3],
      backgroundColor: ds.colors.bgPrimary,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ds.colors.divider,
    },
    toolsPill: {
      flexDirection: 'row' as const,
      backgroundColor: ds.colors.bgTertiary,
      borderRadius: 20,
      paddingHorizontal: ds.space[3],
      paddingVertical: ds.space[2],
      gap: ds.space[3],
    },
    toolBtn: {
      minWidth: 48,
      minHeight: 48,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    toolBtnDisabled: {
      opacity: 0.5,
    },
    toolBtnActive: {
      backgroundColor: ds.colors.accentMuted,
      borderRadius: 10,
    },
    saveStatus: {
      flex: 1,
      alignItems: 'center' as const,
    },
    savingText: {
      ...ds.typography.caption,
      color: ds.colors.textTertiary,
    },
    saveErrorText: {
      ...ds.typography.caption,
      color: ds.colors.error,
    },
    newNoteBtn: {
      width: ds.semantic.layout.touchTarget,
      height: ds.semantic.layout.touchTarget,
      borderRadius: 12,
      backgroundColor: ds.colors.accentMuted,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
  }) as const;
