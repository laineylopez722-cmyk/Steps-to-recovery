/**
 * Morning Check-In Screen
 * Daily intention setting and mood tracking with premium animations
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
import { useCreateCheckIn } from '../hooks/useCheckIns';
import { useTheme } from '../../../design-system/hooks/useTheme';
import {
  TextArea,
  Button,
  Card,
  Toast,
  AnimatedCheckmark,
} from '../../../design-system/components';
import { Slider } from '../../../components/Slider';
import { hapticSuccess, hapticSelection, hapticError } from '../../../utils/haptics';

interface MorningIntentionScreenProps {
  userId: string;
}

export function MorningIntentionScreen({
  userId,
}: MorningIntentionScreenProps): React.ReactElement {
  const navigation = useNavigation();
  const theme = useTheme();
  const { createCheckIn, isPending } = useCreateCheckIn(userId);

  const [intention, setIntention] = useState('');
  const [mood, setMood] = useState(3);
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
        type: 'morning',
        intention: intention.trim(),
        mood,
      });

      // Show success modal with animated checkmark
      setShowSuccessModal(true);
      hapticSuccess();
    } catch (err) {
      hapticError();
      setToastMessage('Failed to save check-in. Please try again.');
      setToastVariant('error');
      setShowToast(true);
    }
  };

  const moodEmojis = ['😢', '😔', '😐', '🙂', '😊'];
  const moodLabels = ['Very Low', 'Low', 'Okay', 'Good', 'Great'];

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
              Good Morning
            </Text>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
              Set your intention for today
            </Text>
          </Card>
        </Animated.View>

        {/* Intention Input */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <TextArea
            label="Today's Intention"
            value={intention}
            onChangeText={setIntention}
            placeholder="I intend to stay present and grateful today..."
            minHeight={140}
            maxLength={500}
            showCharacterCount
            accessibilityLabel="Daily intention"
            accessibilityHint="Enter your intention for the day"
          />
        </Animated.View>

        {/* Mood Section */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Card variant="flat" style={styles.moodCard}>
            <Text style={[theme.typography.title3, { color: theme.colors.text, marginBottom: 4 }]}>
              How are you feeling right now?
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
            <Animated.View
              style={styles.moodEmojiContainer}
              entering={FadeIn.delay(400)}
              key={mood} // Re-animate on mood change
            >
              <Animated.Text
                entering={FadeInUp.springify().damping(8)}
                exiting={FadeOut.duration(100)}
                style={styles.moodEmoji}
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

        {/* Submit Button */}
        <Animated.View entering={FadeInUp.delay(400).springify()}>
          <Button
            variant="primary"
            size="large"
            onPress={handleSubmit}
            disabled={!intention.trim() || isPending}
            loading={isPending}
            accessibilityLabel="Submit morning check-in"
            accessibilityHint="Complete your morning check-in and start your day"
            style={styles.submitButton}
          >
            Start My Day
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
              Great Start!
            </Text>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center' },
              ]}
            >
              Have a wonderful day
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
  moodCard: {
    marginBottom: 24,
    padding: 20,
  },
  moodEmojiContainer: {
    alignItems: 'center',
    marginBottom: 16,
    height: 80,
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: 64,
  },
  slider: {
    height: 40,
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
