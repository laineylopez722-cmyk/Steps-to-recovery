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

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { Card, Button, TextArea, Badge } from '../../../design-system';
import { useReadingDatabase } from '../../../hooks/useReadingDatabase';
import { hapticSuccess } from '../../../utils/haptics';
import { logger } from '../../../utils/logger';
import { PLACEHOLDER_CONTENT } from '../../../data/dailyReadings';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';

interface DailyReadingScreenProps {
  userId: string;
}

export function DailyReadingScreen({ userId }: DailyReadingScreenProps): React.ReactElement {
  const styles = useThemedStyles(createStyles);
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
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const isPlaceholder = todayReading?.content === PLACEHOLDER_CONTENT;

  const handleOpenReading = useCallback(async (): Promise<void> => {
    const url = todayReading?.external_url || 'https://www.jftna.org/jft/';
    try {
      await Linking.openURL(url);
    } catch (error) {
      logger.error('Failed to open reading URL', error);
    }
  }, [todayReading]);

  useEffect(() => {
    if (isReady) {
      loadTodayReading();
    }
  }, [isReady, loadTodayReading]);

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

      successTimerRef.current = setTimeout(() => setShowSuccess(false), 3000);

      logger.info('Reflection saved successfully', { userId });
    } catch (error) {
      logger.error('Failed to save reflection', error);
    } finally {
      setIsSaving(false);
    }
  }, [reflectionText, userId, saveReflection, isSaving]);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (isLoading || !isReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={styles.primaryColor.color} />
          <Text style={styles.loadingText}>Loading today&apos;s reading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!todayReading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="book-open-page-variant"
            size={64}
            color={styles.textSecondary.color}
          />
          <Text style={styles.emptyTitle}>No Reading Available</Text>
          <Text style={styles.emptySubtitle}>Please check back later for today&apos;s reading.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
          <View style={styles.header}>
            <Text style={styles.dateText}>{todayFormatted}</Text>
            {readingStreak > 0 && (
              <Badge variant="success">
                <View style={styles.streakBadge}>
                  <MaterialCommunityIcons name="fire" size={14} color={styles.successColor.color} />
                  <Text style={styles.streakText}>{readingStreak} day streak</Text>
                </View>
              </Badge>
            )}
          </View>

          <Card variant="elevated" style={styles.readingCard}>
            <View style={styles.readingHeader}>
              <MaterialCommunityIcons
                name="book-open-variant"
                size={24}
                color={styles.primaryColor.color}
              />
              <Text style={styles.readingTitle} accessibilityRole="header">
                {todayReading.title}
              </Text>
            </View>

            {!isPlaceholder && <Text style={styles.readingContent}>{todayReading.content}</Text>}

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
                <Text style={styles.attributionText}>Source: Narcotics Anonymous World Services</Text>
              </View>
            )}

            <View style={styles.sourceContainer}>
              <Text style={styles.sourceText}>— {todayReading.source}</Text>
            </View>
          </Card>

          <Card variant="outlined" style={styles.promptCard}>
            <View style={styles.promptHeader}>
              <MaterialCommunityIcons
                name="thought-bubble"
                size={20}
                color={styles.secondaryColor.color}
              />
              <Text style={styles.promptLabel}>Today&apos;s Reflection</Text>
            </View>
            <Text style={styles.promptText}>{todayReading.reflection_prompt}</Text>
          </Card>

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

            {showSuccess && (
              <View style={styles.successMessage}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color={styles.successColor.color}
                />
                <Text style={styles.successText}>Reflection saved successfully!</Text>
              </View>
            )}

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

          <View style={styles.privacyNotice}>
            <MaterialCommunityIcons name="shield-lock" size={16} color={styles.textSecondary.color} />
            <Text style={styles.privacyText}>
              Your reflections are encrypted and stored securely on your device.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (ds: DS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ds.semantic.surface.app,
    },
    keyboardView: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      padding: ds.space[5],
      paddingBottom: ds.space[10],
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      ...ds.typography.bodySm,
      color: ds.semantic.text.secondary,
      marginTop: ds.space[3],
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: ds.space[10],
    },
    emptyTitle: {
      ...ds.typography.h3,
      color: ds.semantic.text.primary,
      marginTop: ds.space[4],
      textAlign: 'center',
    },
    emptySubtitle: {
      ...ds.typography.bodySm,
      color: ds.semantic.text.secondary,
      marginTop: ds.space[2],
      textAlign: 'center',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: ds.space[4],
    },
    dateText: {
      ...ds.typography.bodySm,
      fontWeight: ds.fontWeight.medium,
      color: ds.semantic.text.secondary,
    },
    streakBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ds.space[1],
    },
    streakText: {
      ...ds.typography.caption,
      fontWeight: ds.fontWeight.semibold,
      color: ds.semantic.intent.success.solid,
    },
    readingCard: {
      marginBottom: ds.space[4],
    },
    readingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: ds.space[4],
      gap: ds.space[3],
    },
    readingTitle: {
      ...ds.typography.h2,
      color: ds.semantic.text.primary,
      flex: 1,
    },
    readingContent: {
      ...ds.typography.body,
      color: ds.semantic.text.primary,
      letterSpacing: 0.2,
    },
    sourceContainer: {
      marginTop: ds.space[5],
      paddingTop: ds.space[4],
      borderTopWidth: 1,
      borderTopColor: ds.semantic.surface.overlay,
    },
    sourceText: {
      ...ds.typography.bodySm,
      color: ds.semantic.text.secondary,
      fontStyle: 'italic',
    },
    externalLinkSection: {
      marginTop: ds.space[4],
      alignItems: 'center',
      gap: ds.space[2],
    },
    attributionText: {
      ...ds.typography.caption,
      color: ds.semantic.text.secondary,
      textAlign: 'center',
    },
    promptCard: {
      marginBottom: ds.space[5],
    },
    promptHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ds.space[2],
      marginBottom: ds.space[2],
    },
    promptLabel: {
      ...ds.typography.caption,
      color: ds.semantic.intent.secondary.solid,
      fontWeight: ds.fontWeight.semibold,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    promptText: {
      ...ds.typography.body,
      color: ds.semantic.text.primary,
      fontWeight: ds.fontWeight.medium,
    },
    reflectionSection: {
      marginBottom: ds.space[4],
    },
    successMessage: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ds.space[2],
      padding: ds.space[3],
      borderRadius: ds.radius.sm,
      marginBottom: ds.space[4],
      backgroundColor: ds.semantic.intent.success.muted,
    },
    successText: {
      ...ds.typography.caption,
      color: ds.semantic.intent.success.solid,
      fontWeight: ds.fontWeight.medium,
    },
    privacyNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ds.space[2],
      paddingTop: ds.space[2],
    },
    privacyText: {
      ...ds.typography.caption,
      color: ds.semantic.text.secondary,
      flex: 1,
    },
    primaryColor: { color: ds.semantic.intent.primary.solid },
    secondaryColor: { color: ds.semantic.intent.secondary.solid },
    successColor: { color: ds.semantic.intent.success.solid },
    textSecondary: { color: ds.semantic.text.secondary },
  });
