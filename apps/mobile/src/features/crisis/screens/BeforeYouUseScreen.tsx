/**
 * BeforeYouUseScreen - Crisis Checkpoint
 *
 * Life-saving intervention flow when user is considering using.
 * Multi-stage process with sponsor quick-dial and delay tactics.
 */

import { useEffect, useState, type ReactElement } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInDown, ZoomIn } from 'react-native-reanimated';
import Slider from '@react-native-community/slider';
import { useNavigation, type NavigationProp as RNNavigationProp } from '@react-navigation/native';

import { darkAccent, spacing, radius, typography } from '../../../design-system/tokens/modern';
import { GlassCard } from '../../../design-system/components/GlassCard';
import { GradientButton } from '../../../design-system/components/GradientButton';

import {
  startCrisisCheckpoint,
  updateTriggerDescription,
  markWaitedTenMinutes,
  markSponsorContact,
  saveReflection,
  completeCrisisCheckpoint,
  COMMON_EMOTIONS,
} from '../../../services/crisisCheckpointService';

import { useSponsorInfo } from '../../../hooks/useSponsorInfo';
import { RootStackParamList } from '../../../navigation/types';
import { SponsorInfo } from '../../../types/index';
import { makePhoneCall, sendSMS } from '@recovery/shared';

// ========================================
// Types
// ========================================

type Stage = 'initial' | 'pause' | 'reflect' | 'contact' | 'complete';
type ContactType = 'call' | 'text';
type Outcome = 'resisted' | 'used';

interface BeforeYouUseScreenProps {
  userId: string;
}

// ========================================
// Component
// ========================================

export default function BeforeYouUseScreen({ userId }: BeforeYouUseScreenProps): ReactElement {
  const navigation = useNavigation<RNNavigationProp<RootStackParamList>>();

  const { sponsor, isLoading: sponsorLoading } = useSponsorInfo(userId);
  const sponsorInfo = sponsor as SponsorInfo | null | undefined;
  const sponsorName = sponsorInfo?.name ?? '';
  const sponsorPhoneRaw = sponsorInfo?.phone ?? '';
  const sponsorPhone = sponsorPhoneRaw ? sponsorPhoneRaw.replace(/\s+/g, '') : '';

  // Stage management
  const [stage, setStage] = useState<Stage>('initial');
  const [checkpointId, setCheckpointId] = useState<string>('');

  // Stage 1: Initial
  const [cravingIntensity, setCravingIntensity] = useState(5);
  const [triggerText, setTriggerText] = useState('');

  // Stage 2: Pause (10 minute timer)
  const [secondsRemaining, setSecondsRemaining] = useState(600);
  const [timerActive, setTimerActive] = useState(false);

  // Stage 3: Reflect
  const [journalEntry, setJournalEntry] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);

  // Stage 4: Contact + complete
  const [finalIntensity, setFinalIntensity] = useState(5);

  // Timer effect
  useEffect(() => {
    if (!timerActive) return;

    if (secondsRemaining <= 0) {
      void handleTimerComplete();
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive, secondsRemaining]);

  // ========================================
  // Handlers
  // ========================================

  const handleStart = async (): Promise<void> => {
    try {
      const result = await startCrisisCheckpoint(userId, cravingIntensity);

      if (result.success && result.checkpointId) {
        setCheckpointId(result.checkpointId);

        if (triggerText.trim()) {
          await updateTriggerDescription(result.checkpointId, userId, triggerText.trim());
        }

        setSecondsRemaining(600);
        setStage('pause');
        setTimerActive(true);
        return;
      }

      Alert.alert('Error', 'Could not start checkpoint. Please try again.');
    } catch {
      Alert.alert('Error', 'Could not start checkpoint. Please try again.');
    }
  };

  const handleTimerComplete = async (): Promise<void> => {
    try {
      setTimerActive(false);

      if (checkpointId) {
        await markWaitedTenMinutes(checkpointId, userId);
      }

      setStage('reflect');
    } catch {
      // Even if logging fails, continue the flow
      setStage('reflect');
    }
  };

  const handleSkipTimer = (): void => {
    Alert.alert(
      'Skip the Wait?',
      'Waiting 10 minutes helps the craving pass. Are you sure you want to skip?',
      [
        { text: 'Keep Waiting', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => {
            setTimerActive(false);
            setStage('reflect');
          },
        },
      ],
    );
  };

  const toggleEmotion = (emotion: string): void => {
    setSelectedEmotions((prev) =>
      prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion],
    );
  };

  const handleSaveReflection = async (): Promise<void> => {
    try {
      if (checkpointId) {
        await saveReflection(checkpointId, userId, journalEntry.trim(), selectedEmotions);
      }
    } finally {
      setStage('contact');
    }
  };

  const handleContactSponsor = async (type: ContactType): Promise<void> => {
    if (!checkpointId) return;

    if (!sponsorPhone) {
      Alert.alert('No sponsor phone number', 'Add a sponsor phone number in settings.');
      return;
    }

    try {
      if (type === 'call') {
        const ok = await makePhoneCall(sponsorPhone);
        if (!ok) return;
      } else {
        // If sendSMS returns boolean, treat false as failure. If it returns void, this still works.
        const maybeOk = await sendSMS(sponsorPhone, "Hey, I'm having a hard time. Can you talk?");
        if (maybeOk.success === false) return;
      }

      await markSponsorContact(checkpointId, userId, type);
    } catch {
      Alert.alert('Could not contact sponsor', 'Please try again.');
    }
  };

  const handleComplete = async (outcome: Outcome): Promise<void> => {
    if (!checkpointId) {
      // If somehow we got here without an id, just exit safely.
      navigation.goBack();
      return;
    }

    try {
      await completeCrisisCheckpoint(checkpointId, userId, outcome, finalIntensity);
    } catch {
      // Still allow user to proceed; logging failure shouldn't trap them.
    } finally {
      setStage('complete');
      Alert.alert(
        'Checkpoint saved',
        outcome === 'resisted' ? 'Good work. Keep going.' : 'Logged. Reach out for support if you can.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    }
  };

  // ========================================
  // Render Stages
  // ========================================

  const renderInitialStage = (): ReactElement => (
    <Animated.View entering={FadeIn} style={styles.stageContainer}>
      <GlassCard intensity="heavy" glow glowColor={darkAccent.error}>
        <View style={styles.header}>
          <MaterialIcons name="pause-circle-filled" size={48} color={darkAccent.error} />
          <Text style={styles.title}>Before You Use</Text>
          <Text style={styles.subtitle}>Let's pause for a moment. You're here because you're still fighting.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>How strong is the craving right now?</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderValue}>{cravingIntensity}/10</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={cravingIntensity}
              onValueChange={setCravingIntensity}
              minimumTrackTintColor={darkAccent.error}
              maximumTrackTintColor="rgba(148,163,184,0.2)"
              thumbTintColor={darkAccent.error}
              accessibilityLabel={`Craving intensity: ${cravingIntensity} out of 10`}
              accessibilityRole="adjustable"
              accessibilityHint="Slide to rate your craving intensity from 1 to 10"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>Mild</Text>
              <Text style={styles.sliderLabel}>Intense</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>What triggered this? (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Stress, boredom, specific situation..."
            placeholderTextColor={darkAccent.textMuted}
            value={triggerText}
            onChangeText={setTriggerText}
            multiline
            numberOfLines={3}
            accessibilityLabel="Describe what triggered this craving"
            accessibilityHint="Optional: describe the stress, boredom, or situation"
          />
        </View>

        <GradientButton title="Start Checkpoint" onPress={handleStart} accessibilityLabel="Start crisis checkpoint" />
      </GlassCard>
    </Animated.View>
  );

  const renderPauseStage = (): ReactElement => {
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;

    return (
      <Animated.View entering={SlideInDown} style={styles.stageContainer}>
        <GlassCard intensity="heavy" glow glowColor={darkAccent.warning}>
          <View style={styles.header}>
            <Animated.View entering={ZoomIn.duration(800)} style={styles.timerCircle}>
              <Text style={styles.timerText}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </Text>
            </Animated.View>
            <Text style={styles.title}>Wait 10 Minutes</Text>
            <Text style={styles.subtitle}>Cravings peak and pass. Just 10 minutes. You can do this.</Text>
          </View>

          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>While you wait:</Text>
            <TipItem icon="directions-walk" text="Take a walk around the block" />
            <TipItem icon="water-drop" text="Drink a glass of water" />
            <TipItem icon="air" text="Practice deep breathing" />
            <TipItem icon="call" text="Call your sponsor" />
          </View>

          <Pressable
            style={styles.skipButton}
            onPress={handleSkipTimer}
            accessibilityLabel="Skip waiting period"
            accessibilityRole="button"
          >
            <Text style={styles.skipText}>Skip (not recommended)</Text>
          </Pressable>
        </GlassCard>
      </Animated.View>
    );
  };

  const renderReflectStage = (): ReactElement => (
    <Animated.View entering={FadeIn} style={styles.stageContainer}>
      <GlassCard intensity="heavy">
        <View style={styles.header}>
          <MaterialIcons name="edit-note" size={48} color={darkAccent.primary} />
          <Text style={styles.title}>What Are You Feeling?</Text>
          <Text style={styles.subtitle}>Name the emotions. They lose power when we acknowledge them.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Select all that apply:</Text>
          <View style={styles.emotionsGrid}>
            {COMMON_EMOTIONS.map((emotion) => {
              const selected = selectedEmotions.includes(emotion);
              return (
                <Pressable
                  key={emotion}
                  style={[styles.emotionChip, selected && styles.emotionChipSelected]}
                  onPress={() => toggleEmotion(emotion)}
                  accessibilityLabel={`${emotion}${selected ? ' selected' : ''}`}
                  accessibilityRole="button"
                >
                  <Text style={[styles.emotionChipText, selected && styles.emotionChipTextSelected]}>{emotion}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Write it out (optional):</Text>
          <TextInput
            style={[styles.input, styles.journalInput]}
            placeholder="What's really going on right now?"
            placeholderTextColor={darkAccent.textMuted}
            value={journalEntry}
            onChangeText={setJournalEntry}
            multiline
            numberOfLines={6}
          />
        </View>

        <GradientButton title="Continue" onPress={handleSaveReflection} accessibilityLabel="Save reflection and continue" />
      </GlassCard>
    </Animated.View>
  );

  const renderContactStage = (): ReactElement => (
    <Animated.View entering={FadeIn} style={styles.stageContainer}>
      <GlassCard intensity="heavy" glow glowColor={darkAccent.success}>
        <View style={styles.header}>
          <MaterialIcons name="support-agent" size={48} color={darkAccent.success} />
          <Text style={styles.title}>Reach Out</Text>
          <Text style={styles.subtitle}>You don't have to do this alone. Your sponsor is here for moments like this.</Text>
        </View>

        {sponsorInfo && !sponsorLoading ? (
          <View style={styles.sponsorCard}>
            {!!sponsorName && <Text style={styles.sponsorName}>{sponsorName}</Text>}
            {!!sponsorPhoneRaw && <Text style={styles.sponsorPhone}>{sponsorPhoneRaw}</Text>}

            {!!sponsorPhone && (
              <View style={styles.contactButtons}>
                <Pressable
                  style={[styles.contactButton, styles.callButton]}
                  onPress={() => void handleContactSponsor('call')}
                  accessibilityLabel="Call sponsor"
                  accessibilityRole="button"
                >
                  <MaterialIcons name="call" size={24} color="#fff" />
                  <Text style={styles.contactButtonText}>Call</Text>
                </Pressable>

                <Pressable
                  style={[styles.contactButton, styles.textButton]}
                  onPress={() => void handleContactSponsor('text')}
                  accessibilityLabel="Text sponsor"
                  accessibilityRole="button"
                >
                  <MaterialIcons name="message" size={24} color="#fff" />
                  <Text style={styles.contactButtonText}>Text</Text>
                </Pressable>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noSponsorCard}>
            <Text style={styles.noSponsorText}>No sponsor set up yet. You can add one in settings.</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>How's the craving now?</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderValue}>{finalIntensity}/10</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={finalIntensity}
              onValueChange={setFinalIntensity}
              minimumTrackTintColor={darkAccent.success}
              maximumTrackTintColor="rgba(148,163,184,0.2)"
              thumbTintColor={darkAccent.success}
            />
          </View>
        </View>

        <View style={styles.outcomeButtons}>
          <GradientButton
            title="I Resisted 🎉"
            onPress={() => void handleComplete('resisted')}
            variant="success"
            accessibilityLabel="Mark as resisted"
          />

          <Pressable
            style={styles.usedButton}
            onPress={() => void handleComplete('used')}
            accessibilityLabel="Mark as used"
            accessibilityRole="button"
          >
            <Text style={styles.usedButtonText}>I used</Text>
          </Pressable>
        </View>
      </GlassCard>
    </Animated.View>
  );

  const renderCompleteStage = (): ReactElement => (
    <Animated.View entering={FadeIn} style={styles.stageContainer}>
      <GlassCard intensity="heavy">
        <View style={styles.header}>
          <MaterialIcons name="check-circle" size={48} color={darkAccent.success} />
          <Text style={styles.title}>Saved</Text>
          <Text style={styles.subtitle}>Your checkpoint has been saved.</Text>
        </View>

        <GradientButton title="Done" onPress={() => navigation.goBack()} accessibilityLabel="Done" />
      </GlassCard>
    </Animated.View>
  );

  // ========================================
  // Main Render
  // ========================================

  return (
    <View style={styles.container}>
      <LinearGradient colors={[darkAccent.background, '#0a0f1c', darkAccent.surface]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerBar}>
          <Pressable onPress={() => navigation.goBack()} accessibilityLabel="Go back" accessibilityRole="button">
            <MaterialIcons name="close" size={28} color={darkAccent.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Crisis Checkpoint</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {stage === 'initial' && renderInitialStage()}
          {stage === 'pause' && renderPauseStage()}
          {stage === 'reflect' && renderReflectStage()}
          {stage === 'contact' && renderContactStage()}
          {stage === 'complete' && renderCompleteStage()}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ========================================
// Helper Components
// ========================================

interface TipItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  text: string;
}

function TipItem({ icon, text }: TipItemProps): ReactElement {
  return (
    <View style={styles.tipItem}>
      <MaterialIcons name={icon} size={20} color={darkAccent.warning} />
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

// ========================================
// Styles
// ========================================

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  headerTitle: {
    ...typography.h3,
    color: darkAccent.text,
  },

  scrollView: { flex: 1 },
  scrollContent: { padding: spacing[4] },

  stageContainer: { flex: 1 },

  header: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  title: {
    ...typography.h2,
    color: darkAccent.text,
    marginTop: spacing[3],
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: darkAccent.textMuted,
    marginTop: spacing[2],
    textAlign: 'center',
    lineHeight: 22,
  },

  section: { marginBottom: spacing[6] },
  label: {
    ...typography.label,
    color: darkAccent.text,
    marginBottom: spacing[2],
    fontWeight: '600',
  },

  sliderContainer: { alignItems: 'center' },
  sliderValue: {
    fontSize: 48,
    fontWeight: '700',
    color: darkAccent.primary,
    marginBottom: spacing[2],
  },
  slider: { width: '100%', height: 40 },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing[2],
  },
  sliderLabel: { ...typography.caption, color: darkAccent.textMuted },

  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.lg,
    padding: spacing[3],
    color: darkAccent.text,
    ...typography.body,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  journalInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },

  timerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderWidth: 4,
    borderColor: darkAccent.warning,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: darkAccent.warning,
  },

  tipsContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  tipsTitle: {
    ...typography.label,
    color: darkAccent.text,
    fontWeight: '600',
    marginBottom: spacing[3],
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  tipText: {
    ...typography.body,
    color: darkAccent.textMuted,
    flex: 1,
  },

  skipButton: { alignItems: 'center', padding: spacing[3] },
  skipText: { ...typography.body, color: darkAccent.textMuted, textDecorationLine: 'underline' },

  emotionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  emotionChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emotionChipSelected: {
    backgroundColor: darkAccent.primary,
    borderColor: darkAccent.primary,
  },
  emotionChipText: {
    ...typography.body,
    color: darkAccent.textMuted,
    fontSize: 14,
  },
  emotionChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },

  sponsorCard: {
    backgroundColor: 'rgba(52,211,153,0.1)',
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[6],
    borderWidth: 1,
    borderColor: darkAccent.success,
  },
  sponsorName: { ...typography.h3, color: darkAccent.text, marginBottom: spacing[1] },
  sponsorPhone: { ...typography.body, color: darkAccent.textMuted, marginBottom: spacing[4] },

  contactButtons: { flexDirection: 'row', gap: spacing[3] },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.lg,
  },
  callButton: { backgroundColor: darkAccent.success },
  textButton: { backgroundColor: darkAccent.primary },
  contactButtonText: { ...typography.body, color: '#fff', fontWeight: '600' },

  noSponsorCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[6],
  },
  noSponsorText: { ...typography.body, color: darkAccent.textMuted, textAlign: 'center' },

  outcomeButtons: { gap: spacing[3] },
  usedButton: {
    padding: spacing[3],
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  usedButtonText: { ...typography.body, color: darkAccent.textMuted },
});
