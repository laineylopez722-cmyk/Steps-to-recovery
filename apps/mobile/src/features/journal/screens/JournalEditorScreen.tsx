/**
 * Journal Editor - Apple Notes Style
 * 
 * Full-screen, distraction-free writing.
 * Title is first line, large and bold.
 * Bottom toolbar with actions.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
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
import Animated, { 
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';
import { ds } from '../../../design-system/tokens/ds';
import { hapticSuccess, hapticLight } from '../../../utils/haptics';
import { logger } from '../../../utils/logger';
import {
  useCreateJournalEntry,
  useUpdateJournalEntry,
  useJournalEntries,
} from '../hooks/useJournalEntries';
import { extractMemories } from '../utils/memoryExtraction';
import { useMemoryStore } from '../../../hooks/useMemoryStore';

interface Props {
  userId: string;
}

export function JournalEditorScreen({ userId }: Props): React.ReactElement {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const params = route.params as { mode?: 'create' | 'edit'; entryId?: string } | undefined;
  
  const { entries } = useJournalEntries(userId);
  const { createEntry, isPending: isCreating } = useCreateJournalEntry(userId);
  const { updateEntry, isPending: isUpdating } = useUpdateJournalEntry(userId);
  const memoryStore = useMemoryStore(userId);
  
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSaved, setIsSaved] = useState(true);
  
  const bodyRef = useRef<TextInput>(null);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const originalTitle = useRef('');
  const originalBody = useRef('');
  
  const isEditMode = params?.mode === 'edit';
  const entryId = params?.entryId;
  
  // Load existing entry
  useEffect(() => {
    if (isEditMode && entryId) {
      const entry = entries.find((e) => e.id === entryId);
      if (entry) {
        setTitle(entry.title || '');
        setBody(entry.body);
        originalTitle.current = entry.title || '';
        originalBody.current = entry.body;
      }
    }
  }, [isEditMode, entryId, entries]);
  
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
      if (isEditMode && entryId) {
        await updateEntry(entryId, {
          title: trimmedTitle || null,
          body: trimmedBody || trimmedTitle, // Use title as body if body is empty
          mood: null,
          craving: null,
          tags: [],
        });
      } else {
        await createEntry({
          title: trimmedTitle || null,
          body: trimmedBody || trimmedTitle,
          mood: null,
          craving: null,
          tags: [],
        });
      }
      
      setIsSaved(true);
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
  
  const handleShare = () => {
    hapticLight();
    // TODO: Implement share
  };
  
  const handleMore = () => {
    hapticLight();
    // TODO: Show more options (delete, etc.)
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
            >
              <View style={styles.backBtnInner}>
                <Feather name="chevron-left" size={24} color={ds.colors.textPrimary} />
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
                <Feather name="share" size={18} color={ds.colors.textPrimary} />
              </Pressable>
              <Pressable
                onPress={handleMore}
                style={styles.actionBtn}
                accessibilityLabel="More options"
                accessibilityRole="button"
                accessibilityHint="Opens menu with additional entry options"
              >
                <Feather name="more-horizontal" size={18} color={ds.colors.textPrimary} />
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
            />
          </ScrollView>
          
          {/* Bottom Toolbar */}
          <Animated.View 
            entering={SlideInDown.duration(300)}
            style={[styles.toolbar, { paddingBottom: insets.bottom || ds.space[4] }]}
          >
            {/* Left tools */}
            <View style={styles.toolsPill}>
              <Pressable
                style={styles.toolBtn}
                accessibilityLabel="Add checklist"
                accessibilityRole="button"
              >
                <Feather name="check-square" size={20} color={ds.colors.textSecondary} />
              </Pressable>
              <Pressable
                style={styles.toolBtn}
                accessibilityLabel="Attach file"
                accessibilityRole="button"
              >
                <Feather name="paperclip" size={20} color={ds.colors.textSecondary} />
              </Pressable>
              <Pressable
                style={styles.toolBtn}
                accessibilityLabel="Add mention"
                accessibilityRole="button"
                accessibilityHint="Mention a person or tag"
              >
                <Feather name="at-sign" size={20} color={ds.colors.textSecondary} />
              </Pressable>
            </View>
            
            {/* Saving indicator */}
            <View style={styles.saveStatus}>
              {!isSaved && (
                <Animated.Text entering={FadeIn} style={styles.savingText}>
                  Saving...
                </Animated.Text>
              )}
            </View>
            
            {/* New note button */}
            <Pressable
              onPress={handleNewEntry}
              style={styles.newNoteBtn}
              accessibilityLabel="Create new journal entry"
              accessibilityRole="button"
              accessibilityHint="Saves current entry and starts a new one"
            >
              <Feather name="edit" size={20} color={ds.colors.accent} />
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
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
  kav: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ds.space[4],
    paddingTop: ds.space[2],
    paddingBottom: ds.space[3],
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ds.colors.bgTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsPill: {
    flexDirection: 'row',
    backgroundColor: ds.colors.bgTertiary,
    borderRadius: 20,
    paddingHorizontal: ds.space[2],
    paddingVertical: ds.space[2],
    gap: ds.space[1],
  },
  actionBtn: {
    width: 36,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '700',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ds.space[4],
    paddingTop: ds.space[3],
    backgroundColor: ds.colors.bgPrimary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ds.colors.divider,
  },
  toolsPill: {
    flexDirection: 'row',
    backgroundColor: ds.colors.bgTertiary,
    borderRadius: 20,
    paddingHorizontal: ds.space[3],
    paddingVertical: ds.space[2],
    gap: ds.space[3],
  },
  toolBtn: {
    width: 32,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveStatus: {
    flex: 1,
    alignItems: 'center',
  },
  savingText: {
    ...ds.typography.caption,
    color: ds.colors.textTertiary,
  },
  newNoteBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: ds.colors.accentMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
