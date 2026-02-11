/**
 * Daily Reading Screen
 * Displays today's recovery reading with reflection input
 *
 * Features:
 * - Today's reading with title, content, and source
 * - Reflection prompt to guide user thinking
 * - Encrypted reflection input with word count
 * - Reading streak tracking
 * - Offline-first with sync queue integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, Card, Button, TextArea, Badge } from '../../../design-system';
import { useReadingDatabase } from '../../../hooks/useReadingDatabase';
import { hapticSuccess } from '../../../utils/haptics';
import { logger } from '../../../utils/logger';
import { PLACEHOLDER_CONTENT } from '../../../data/dailyReadings';

interface DailyReadingScreenProps {
  userId: string;
}

export function DailyReadingScreen({ userId }: DailyReadingScreenProps): React.ReactElement {
  const theme = useTheme();
  const {
    todayReading,
    todayReflection,
    readingStreak,
    isLoading,
    isReady,
    loadTodayReading,
    saveReflection,
    decryptReflectionContent,
  } = useReadingDatabase();

  const [reflectionText, setReflectionText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasReflected, setHasReflected] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isPlaceholder = todayReading?.content === PLACEHOLDER_CONTENT;

  const handleOpenReading = useCallback(async (): Promise<void> => {
    const url = todayReading?.external_url || 'https://www.jftna.org/jft/';
    try {
      await Linking.openURL(url);
    } catch (error) {
      logger.error('Failed to open reading URL', error);
    }
  }, [todayReading]);

  // Load today's reading on mount
  useEffect(() => {
    if (isReady) {
      loadTodayReading();
    }
  }, [isReady, loadTodayReading]);

  // Load existing reflection if available
  useEffect(() => {
    async function loadExistingReflection(): Promise<void> {
      if (todayReflection) {
        try {
          const decrypted = await decryptReflectionContent(todayReflection);
          setReflectionText(decrypted);
          setHasReflected(true);
        } catch (error) {
          logger.error('Failed to decrypt reflection', error);
        }
      }
    }
    loadExistingReflection();
  }, [todayReflection, decryptReflectionContent]);

  const handleSaveReflection = useCallback(async (): Promise<void> => {
    if (!reflectionText.trim() || isSaving) return;

    setIsSaving(true);
    try {
      await saveReflection(reflectionText, userId);
      await hapticSuccess();
      setHasReflected(true);
      setShowSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);

      logger.info('Reflection saved successfully', { userId });
    } catch (error) {
      logger.error('Failed to save reflection', error);
    } finally {
      setIsSaving(false);
    }
  }, [reflectionText, userId, saveReflection, isSaving]);

  // Format today's date
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (isLoading || !isReady) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading today&apos;s reading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!todayReading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="book-open-page-variant"
            size={64}
            color={theme.colors.textSecondary}
          />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No Reading Available
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            Please check back later for today&apos;s reading.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          accessibilityRole="scrollbar"
          accessibilityLabel="Daily reading content"
        >
          {/* Header with Date and Streak */}
          <View style={styles.header}>
            <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
              {todayFormatted}
            </Text>
            {readingStreak > 0 && (
              <Badge variant="success">
                <View style={styles.streakBadge}>
                  <MaterialCommunityIcons name="fire" size={14} color={theme.colors.success} />
                  <Text style={[styles.streakText, { color: theme.colors.success }]}>
                    {readingStreak} day streak
                  </Text>
                </View>
              </Badge>
            )}
          </View>

          {/* Reading Card */}
          <Card variant="elevated" style={styles.readingCard}>
            <View style={styles.readingHeader}>
              <MaterialCommunityIcons
                name="book-open-variant"
                size={24}
                color={theme.colors.primary}
              />
              <Text
                style={[styles.readingTitle, { color: theme.colors.text }]}
                accessibilityRole="header"
              >
                {todayReading.title}
              </Text>
            </View>

            {!isPlaceholder && (
              <Text style={[styles.readingContent, { color: theme.colors.text }]}>
                {todayReading.content}
              </Text>
            )}

            {todayReading.external_url && (
              <View style={styles.externalLinkSection}>
                <Button
                  title="Read Today's Meditation"
                  onPress={handleOpenReading}
                  variant="primary"
                  accessibilityLabel="Read today's meditation on the NA website"
                  accessibilityRole="button"
                  accessibilityHint="Opens the Just for Today daily meditation in your browser"
                />
                <Text style={[styles.attributionText, { color: theme.colors.textSecondary }]}>
                  Source: Narcotics Anonymous World Services
                </Text>
              </View>
            )}

            <View style={[styles.sourceContainer, { borderTopColor: theme.colors.border }]}>
              <Text style={[styles.sourceText, { color: theme.colors.textSecondary }]}>
                — {todayReading.source}
              </Text>
            </View>
          </Card>

          {/* Reflection Prompt Card */}
          <Card variant="outlined" style={styles.promptCard}>
            <View style={styles.promptHeader}>
              <MaterialCommunityIcons
                name="thought-bubble"
                size={20}
                color={theme.colors.secondary}
              />
              <Text style={[styles.promptLabel, { color: theme.colors.secondary }]}>
                Today&apos;s Reflection
              </Text>
            </View>
            <Text style={[styles.promptText, { color: theme.colors.text }]}>
              {todayReading.reflection_prompt}
            </Text>
          </Card>

          {/* Reflection Input */}
          <View style={styles.reflectionSection}>
            <TextArea
              label="Your Reflection"
              value={reflectionText}
              onChangeText={setReflectionText}
              placeholder="Take a moment to reflect on today's reading..."
              minHeight={150}
              maxLength={2000}
              showCharacterCount
              hint="Your reflection is encrypted and private"
              accessibilityLabel="Reflection text input"
              accessibilityHint="Write your thoughts about today's reading"
            />

            {/* Success Message */}
            {showSuccess && (
              <View style={[styles.successMessage, { backgroundColor: theme.colors.successLight }]}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color={theme.colors.success}
                />
                <Text style={[styles.successText, { color: theme.colors.success }]}>
                  Reflection saved successfully!
                </Text>
              </View>
            )}

            {/* Save Button */}
            <Button
              title={hasReflected ? 'Update Reflection' : 'Save Reflection'}
              onPress={handleSaveReflection}
              disabled={!reflectionText.trim() || isSaving}
              loading={isSaving}
              variant="primary"
              accessibilityLabel={hasReflected ? 'Update your reflection' : 'Save your reflection'}
              accessibilityHint="Double tap to save your reflection"
            />
          </View>

          {/* Privacy Notice */}
          <View style={styles.privacyNotice}>
            <MaterialCommunityIcons
              name="shield-lock"
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text style={[styles.privacyText, { color: theme.colors.textSecondary }]}>
              Your reflections are encrypted and stored securely on your device.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
  },
  readingCard: {
    marginBottom: 16,
  },
  readingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  readingTitle: {
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
  },
  readingContent: {
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  sourceContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  sourceText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  externalLinkSection: {
    marginTop: 16,
    alignItems: 'center',
    gap: 8,
  },
  attributionText: {
    fontSize: 12,
    textAlign: 'center',
  },
  promptCard: {
    marginBottom: 20,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  promptLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promptText: {
    fontSize: 17,
    fontWeight: '500',
    lineHeight: 24,
  },
  reflectionSection: {
    marginBottom: 16,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    fontSize: 14,
    fontWeight: '500',
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
  },
  privacyText: {
    fontSize: 12,
    flex: 1,
  },
});
