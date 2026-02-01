/**
 * Evening Pulse Check Screen
 * Daily reflection, mood tracking, and craving assessment with premium animations
 */

import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Text, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideOutDown,
} from 'react-native-reanimated';
import { useCreateCheckIn, useTodayCheckIns } from '../hooks/useCheckIns';
import { useTheme } from '../../../design-system/hooks/useTheme';
import {
  TextArea,
  Button,
  Card,
  Toast,
  AnimatedCheckmark,
} from '../../../design-system/components';
import { Slider } from '../../../components/Slider';
import { hapticSuccess, hapticSelection, hapticError, hapticWarning } from '../../../utils/haptics';

interface EveningPulseScreenProps {
  userId: string;
}

export function EveningPulseScreen({ userId }: EveningPulseScreenProps): React.ReactElement {
  const navigation = useNavigation();
  const theme = useTheme();
  const { createCheckIn, isPending } = useCreateCheckIn(userId);
  const { morning } = useTodayCheckIns(userId);

  const [reflection, setReflection] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [mood, setMood] = useState(3);
  const [craving, setCraving] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Handle mood slider change with haptic feedback
  const handleMoodChange = useCallback(
    (value: number) => {
      if (value !== mood) {
        hapticSelection();
      }
      setMood(value);
    },
    [mood],
  );

  // Handle craving slider change with haptic feedback
  const handleCravingChange = useCallback(
    (value: number) => {
      if (value !== craving) {
        hapticSelection();
        // Warning haptic for high craving
        if (value > 6 && craving <= 6) {
          hapticWarning();
        }
      }
      setCraving(value);
    },
    [craving],
  );

  // Handle successful completion animation
  const handleSuccessAnimationComplete = useCallback(() => {
    setTimeout(() => {
      setShowSuccessModal(false);
      navigation.goBack();
    }, 300);
  }, [navigation]);

  const handleSubmit = async (): Promise<void> => {
    try {
      await createCheckIn({
        type: 'evening',
        reflection: reflection.trim(),
        gratitude: gratitude.trim() || undefined,
        mood,
        craving,
      });

      // Show success modal with animated checkmark
      setShowSuccessModal(true);
      hapticSuccess();
    } catch (_err) {
      hapticError();
      setToastMessage('Failed to save check-in. Please try again.');
      setToastVariant('error');
      setShowToast(true);
    }
  };

  const moodEmojis = ['😢', '😔', '😐', '🙂', '😊'];
  const moodLabels = ['Very Low', 'Low', 'Okay', 'Good', 'Great'];

  const getCravingColor = (value: number): string => {
    if (value === 0) return theme.colors.success;
    if (value <= 3) return theme.colors.primary;
    if (value <= 6) return '#FF9800'; // Orange
    return theme.colors.danger;
  };

  const getCravingLabel = (value: number): string => {
    if (value === 0) return 'None';
    if (value <= 3) return 'Mild';
    if (value <= 6) return 'Moderate';
    return 'Strong';
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Card variant="flat" style={styles.headerCard}>
            <Text
              style={[theme.typography.largeTitle, { color: theme.colors.text, marginBottom: 4 }]}
            >
              Good Evening
            </Text>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
              Reflect on your day
            </Text>
          </Card>
        </Animated.View>

        {/* Morning Intention Reminder (if exists) */}
        {morning?.intention && (
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <Card
              variant="flat"
              style={[styles.intentionCard, { backgroundColor: theme.colors.primaryLight }]}
            >
              <Text
                style={[theme.typography.caption, { color: theme.colors.primary, marginBottom: 4 }]}
              >
                This morning's intention:
              </Text>
              <Text
                style={[theme.typography.body, { color: theme.colors.text, fontStyle: 'italic' }]}
              >
                "{morning.intention}"
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* Reflection Input */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <TextArea
            label="How did your day go?"
            value={reflection}
            onChangeText={setReflection}
            placeholder="I stayed present during difficult moments..."
            minHeight={140}
            maxLength={500}
            showCharacterCount
            accessibilityLabel="Daily reflection"
            accessibilityHint="Reflect on your day"
          />
        </Animated.View>

        {/* Gratitude Section */}
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <Card
            variant="flat"
            style={[styles.gratitudeCard, { backgroundColor: theme.colors.successLight }]}
          >
            <View style={styles.gratitudeHeader}>
              <Text style={styles.gratitudeEmoji}>🙏</Text>
              <Text style={[theme.typography.title3, { color: theme.colors.text }]}>Gratitude</Text>
            </View>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, marginBottom: 12 },
              ]}
            >
              What are you grateful for today? (optional)
            </Text>
            <TextArea
              label=""
              value={gratitude}
              onChangeText={setGratitude}
              placeholder="Today I'm grateful for..."
              minHeight={80}
              maxLength={300}
              showCharacterCount
              containerStyle={styles.gratitudeInput}
              accessibilityLabel="Gratitude entry"
              accessibilityHint="Write what you are grateful for today"
            />
          </Card>
        </Animated.View>

        {/* Mood Section */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Card variant="flat" style={styles.sectionCard}>
            <Text style={[theme.typography.title3, { color: theme.colors.text, marginBottom: 4 }]}>
              How are you feeling now?
            </Text>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, marginBottom: 20 },
              ]}
            >
              {moodLabels[mood - 1]}
            </Text>

            {/* Mood Emoji Display */}
            <Animated.View style={styles.emojiContainer} key={mood}>
              <Animated.Text
                entering={FadeInUp.springify().damping(8)}
                exiting={FadeOut.duration(100)}
                style={styles.emoji}
              >
                {moodEmojis[mood - 1]}
              </Animated.Text>
            </Animated.View>

            {/* Slider */}
            <Slider
              value={mood}
              onValueChange={handleMoodChange}
              minimumValue={1}
              maximumValue={5}
              step={1}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor={theme.colors.border}
              style={styles.slider}
              accessibilityLabel={`Mood level: ${moodLabels[mood - 1]}`}
              accessibilityRole="adjustable"
            />
          </Card>
        </Animated.View>

        {/* Craving Level Section */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Card variant="flat" style={styles.sectionCard}>
            <Text style={[theme.typography.title3, { color: theme.colors.text, marginBottom: 4 }]}>
              Craving level
            </Text>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, marginBottom: 20 },
              ]}
            >
              {getCravingLabel(craving)} ({craving}/10)
            </Text>

            {/* Craving Value Display */}
            <Animated.View style={styles.emojiContainer} key={`craving-${craving}`}>
              <Animated.Text
                entering={FadeInUp.springify().damping(8)}
                style={[styles.cravingValue, { color: getCravingColor(craving) }]}
              >
                {craving}
              </Animated.Text>
            </Animated.View>

            {/* Slider */}
            <Slider
              value={craving}
              onValueChange={handleCravingChange}
              minimumValue={0}
              maximumValue={10}
              step={1}
              minimumTrackTintColor={getCravingColor(craving)}
              maximumTrackTintColor={theme.colors.border}
              style={styles.slider}
              accessibilityLabel={`Craving level: ${getCravingLabel(craving)}, ${craving} out of 10`}
              accessibilityRole="adjustable"
            />

            {/* High Craving Warning */}
            {craving > 6 && (
              <Animated.View
                entering={FadeIn.duration(300)}
                style={[styles.warningContainer, { backgroundColor: theme.colors.dangerLight }]}
              >
                <Text style={[theme.typography.caption, { color: theme.colors.danger }]}>
                  Consider reaching out to your sponsor or attending a meeting if cravings are
                  strong.
                </Text>
              </Animated.View>
            )}
          </Card>
        </Animated.View>

        {/* Submit Button */}
        <Animated.View entering={FadeInUp.delay(500).springify()}>
          <Button
            variant="primary"
            size="large"
            onPress={handleSubmit}
            disabled={!reflection.trim() || isPending}
            loading={isPending}
            accessibilityLabel="Submit evening check-in"
            accessibilityHint="Complete your evening check-in"
            style={styles.submitButton}
          >
            Complete Day
          </Button>
        </Animated.View>
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.successModalOverlay}>
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={SlideOutDown.duration(300)}
            style={[
              styles.successModalContent,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.xl,
                ...(theme.isDark ? theme.shadows.lgDark : theme.shadows.lg),
              },
            ]}
          >
            <AnimatedCheckmark
              size={100}
              color={theme.colors.success}
              onAnimationComplete={handleSuccessAnimationComplete}
            />
            <Text
              style={[
                theme.typography.h2,
                { color: theme.colors.text, marginTop: 20, textAlign: 'center' },
              ]}
            >
              Day Complete!
            </Text>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center' },
              ]}
            >
              Rest well tonight
            </Text>
          </Animated.View>
        </View>
      </Modal>

      {/* Toast Notification */}
      <Toast
        visible={showToast}
        message={toastMessage}
        variant={toastVariant}
        duration={3000}
        onDismiss={() => setShowToast(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  headerCard: {
    marginBottom: 24,
  },
  intentionCard: {
    marginBottom: 24,
    padding: 16,
  },
  gratitudeCard: {
    marginBottom: 24,
    padding: 16,
  },
  gratitudeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  gratitudeEmoji: {
    fontSize: 24,
  },
  gratitudeInput: {
    marginBottom: 0,
  },
  sectionCard: {
    marginBottom: 24,
    padding: 20,
  },
  emojiContainer: {
    alignItems: 'center',
    marginBottom: 16,
    height: 80,
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 64,
  },
  cravingValue: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  slider: {
    height: 40,
  },
  warningContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  submitButton: {
    marginTop: 8,
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successModalContent: {
    padding: 40,
    alignItems: 'center',
    minWidth: 280,
  },
});
