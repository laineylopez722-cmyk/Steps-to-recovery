/**
 * Literature Progress Tracker
 * Track your reading of recovery literature
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card } from '../../components/ui';
import {
  useLiteratureStore,
  AVAILABLE_BOOKS,
  type Chapter,
} from '../../lib/store/literatureStore';
import { ChapterCard } from '../../components/literature/ChapterCard';

export default function LiteratureProgressScreen() {
  const router = useRouter();
  const {
    progress,
    currentBook,
    loadProgress,
    toggleChapterComplete,
    saveChapterNotes,
    getChapterNotes,
    getBookProgress,
    setCurrentBook,
    isLoading,
  } = useLiteratureStore();

  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  useEffect(() => {
    if (currentBook) {
      loadProgress(currentBook.id);
    }
  }, [currentBook]);

  const bookProgress = currentBook ? getBookProgress(currentBook.id) : 0;

  const isChapterCompleted = (chapterId: string) => {
    return progress.some((p) => p.chapterId === chapterId && p.isCompleted);
  };

  const completedCount = currentBook
    ? currentBook.chapters.filter((c) => isChapterCompleted(c.id)).length
    : 0;

  const handleChapterPress = async (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setNotes('');
    setIsLoadingNotes(true);

    if (currentBook) {
      try {
        const existingNotes = await getChapterNotes(currentBook.id, chapter.id);
        if (existingNotes) {
          setNotes(existingNotes);
        }
      } catch (error) {
        console.error('Failed to load notes:', error);
      } finally {
        setIsLoadingNotes(false);
      }
    }
  };

  const handleToggleComplete = async () => {
    if (!selectedChapter || !currentBook) return;
    await toggleChapterComplete(currentBook.id, selectedChapter.id);
  };

  const handleSaveNotes = async () => {
    if (!selectedChapter || !currentBook || !notes.trim()) {
      setSelectedChapter(null);
      return;
    }
    await saveChapterNotes(currentBook.id, selectedChapter.id, notes.trim());
    setSelectedChapter(null);
  };

  const handleClose = () => {
    setSelectedChapter(null);
    setNotes('');
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <FlatList
        className="flex-1 px-4"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 24 }}
        data={currentBook?.chapters || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChapterCard
            chapter={item}
            isCompleted={isChapterCompleted(item.id)}
            hasNotes={progress.some((p) => p.chapterId === item.id && p.notes)}
            onPress={() => handleChapterPress(item)}
          />
        )}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View className="flex-row items-center mb-6">
              <TouchableOpacity onPress={() => router.back()} className="mr-4">
                <Text className="text-primary-600 text-base">← Back</Text>
              </TouchableOpacity>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                  Literature Progress
                </Text>
                <Text className="text-surface-500 text-sm">
                  Track your reading journey
                </Text>
              </View>
            </View>

            {/* Book Selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-6"
            >
              {AVAILABLE_BOOKS.map((book) => (
                <TouchableOpacity
                  key={book.id}
                  onPress={() => setCurrentBook(book)}
                  className={`px-4 py-2 rounded-full mr-2 ${currentBook?.id === book.id
                      ? 'bg-primary-500'
                      : 'bg-surface-100 dark:bg-surface-800'
                    }`}
                >
                  <Text
                    className={
                      currentBook?.id === book.id
                        ? 'text-white font-medium'
                        : 'text-surface-600 dark:text-surface-400'
                    }
                  >
                    {book.shortTitle}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Progress Card */}
            {currentBook && (
              <Card variant="elevated" className="mb-6">
                <View className="items-center py-2">
                  <Text className="text-4xl mb-2">📚</Text>
                  <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 text-center">
                    {currentBook.title}
                  </Text>
                  <Text className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-2">
                    {completedCount} / {currentBook.chapters.length}
                  </Text>
                  <Text className="text-surface-500 text-sm mb-3">
                    Chapters Completed
                  </Text>

                  {/* Progress Bar */}
                  <View className="w-full h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${bookProgress}%` }}
                    />
                  </View>
                  <Text className="text-xs text-surface-500 mt-2">
                    {bookProgress}% complete
                  </Text>
                </View>
              </Card>
            )}
          </>
        }
        ListFooterComponent={
          <>
            {/* Tips Card */}
            <Card variant="outlined" className="mt-4 mb-4">
              <View className="flex-row items-start gap-3">
                <Text className="text-xl">💡</Text>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Reading Tips
                  </Text>
                  <Text className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
                    Read with your sponsor. Take notes on what stands out. Don't rush—let the wisdom sink in. Return to chapters as your recovery deepens.
                  </Text>
                </View>
              </View>
            </Card>
            <View className="h-6" />
          </>
        }
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />

      {/* Chapter Detail Modal */}
      <Modal
        visible={selectedChapter !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
            <ScrollView className="flex-1 px-4 py-6">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-6">
                <TouchableOpacity onPress={handleClose}>
                  <Text className="text-primary-600 text-base">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-surface-500 text-sm">
                  Chapter {selectedChapter?.number}
                </Text>
                <TouchableOpacity onPress={handleSaveNotes}>
                  <Text className="text-primary-600 text-base font-semibold">
                    Save
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Chapter Info */}
              <Card variant="elevated" className="mb-6">
                <View className="items-center">
                  <Text className="text-4xl mb-2">📖</Text>
                  <Text className="text-xl font-bold text-surface-900 dark:text-surface-100 text-center">
                    {selectedChapter?.title}
                  </Text>
                  <Text className="text-surface-500 mt-1">
                    Chapter {selectedChapter?.number} • {currentBook?.shortTitle}
                  </Text>
                </View>
              </Card>

              {/* Completed Toggle */}
              <TouchableOpacity onPress={handleToggleComplete} activeOpacity={0.7}>
                <Card
                  variant="default"
                  className={`mb-6 ${selectedChapter && isChapterCompleted(selectedChapter.id)
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : ''
                    }`}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className={`w-8 h-8 rounded-full items-center justify-center ${selectedChapter && isChapterCompleted(selectedChapter.id)
                          ? 'bg-green-500'
                          : 'border-2 border-surface-300 dark:border-surface-600'
                        }`}
                    >
                      {selectedChapter && isChapterCompleted(selectedChapter.id) && (
                        <Text className="text-white text-lg">✓</Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-medium text-surface-900 dark:text-surface-100">
                        Mark as completed
                      </Text>
                      <Text className="text-sm text-surface-500">
                        Tap to {selectedChapter && isChapterCompleted(selectedChapter.id) ? 'unmark' : 'mark'} this chapter
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>

              {/* Notes Section */}
              <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
                Your Notes
              </Text>
              <Text className="text-sm text-surface-500 mb-3">
                What stood out to you? What questions came up? What do you want to discuss with your sponsor?
              </Text>

              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder={
                  isLoadingNotes
                    ? 'Loading...'
                    : 'Write your notes about this chapter...'
                }
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                className="bg-surface-100 dark:bg-surface-800 rounded-xl p-4 text-base text-surface-900 dark:text-surface-100 min-h-[200px] mb-6"
                editable={!isLoadingNotes}
              />

              <View className="h-6" />
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}


