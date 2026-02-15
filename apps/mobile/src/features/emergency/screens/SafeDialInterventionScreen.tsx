/**
 * Safe Dial Intervention Screen
 *
 * CRITICAL: Full-screen intervention when user tries to call risky contact
 * Multi-step flow designed to interrupt autopilot behavior and offer alternatives
 *
 * Psychological Design:
 * - Creates friction (forces conscious choice)
 * - Delays action (cravings peak ~15 min)
 * - Offers alternatives (sponsor, wait, distraction)
 * - Uses commitment device pattern (Ulysses Pact)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, Alert, BackHandler, Linking, Pressable } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { Button } from '../../../design-system';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import { hapticWarning, hapticSuccess, hapticImpact } from '../../../utils/haptics';
import { logger } from '../../../utils/logger';
import { useAuth } from '../../../contexts/AuthContext';
import { useCloseCallTracking, type RiskyContact, type ActionTaken } from '../hooks';

type InterventionStep = 'stop' | 'why' | 'alternatives' | 'final' | 'complete';

interface SafeDialInterventionScreenProps {
  riskyContact: RiskyContact;
  sponsorPhone?: string;
  sponsorName?: string;
  cleanDays?: number;
  whyPhotoUri?: string;
  whyText?: string;
  onDismiss: () => void;
  onProceed?: () => void;
}

const STOP_DURATION_MS = 5000;
const WHY_DURATION_MS = 10000;
const FINAL_COUNTDOWN_MS = 30000;

export function SafeDialInterventionScreen({
  riskyContact,
  sponsorPhone,
  sponsorName = 'Your Sponsor',
  cleanDays = 0,
  whyPhotoUri: _whyPhotoUri,
  whyText = 'Remember why you got sober',
  onDismiss,
  onProceed,
}: SafeDialInterventionScreenProps): React.ReactElement {
  useKeepAwake();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const { user } = useAuth();
  const { logCall } = useCloseCallTracking();

  const [step, setStep] = useState<InterventionStep>('stop');
  const [countdown, setCountdown] = useState(FINAL_COUNTDOWN_MS / 1000);
  const [confirmText, setConfirmText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  // Track whether countdown has expired to avoid repeated handleProceed calls
  const countdownExpiredRef = useRef(false);

  const stopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const whyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (step === 'stop') {
      hapticWarning();
      stopTimerRef.current = setTimeout(() => setStep('why'), STOP_DURATION_MS);
      return () => { if (stopTimerRef.current) clearTimeout(stopTimerRef.current); };
    }
    if (step === 'final') {
      // Reset expired flag when entering final step
      countdownExpiredRef.current = false;
    }
    return undefined;
  }, [step]);

  useEffect(() => {
    if (step === 'why') {
      whyTimerRef.current = setTimeout(() => setStep('alternatives'), WHY_DURATION_MS);
      return () => { if (whyTimerRef.current) clearTimeout(whyTimerRef.current); };
    }
    return undefined;
  }, [step]);

  // Countdown timer for final step — counts down once, then stops.
  // handleProceed is called outside the setState updater to avoid side effects.
  useEffect(() => {
    if (step === 'final') {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Clear interval and mark expired — handleProceed is called below via separate effect
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            countdownExpiredRef.current = true;
            if (prev % 10 === 0) hapticImpact();
            return 0;
          }
          if (prev % 10 === 0) hapticImpact();
          return prev - 1;
        });
      }, 1000);
      return () => { if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current); };
    }
    return undefined;
  }, [step]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step !== 'alternatives') return true;
      void handleDismiss('dismissed');
      return true;
    });
    return () => backHandler.remove();
  }, [step]);

  const handleLogAction = useCallback(async (actionTaken: ActionTaken, notes?: string): Promise<void> => {
    if (!user?.id) return;
    try {
      await logCall({ contactName: riskyContact.name, actionTaken, riskyContactId: riskyContact.id, notes });
    } catch (error) {
      logger.error('Failed to log close call:', error);
    }
  }, [user?.id, logCall, riskyContact.name, riskyContact.id]);

  const handleProceed = useCallback(async (): Promise<void> => {
    if (step === 'final' && confirmText !== 'YES I AM RELAPSING') {
      Alert.alert('Confirmation Required', 'Please type the confirmation phrase exactly as shown.');
      return;
    }
    try {
      setIsProcessing(true);
      await handleLogAction('proceeded', `User chose to proceed with call to ${riskyContact.name}`);
      onProceed?.();
    } finally {
      setIsProcessing(false);
    }
  }, [step, confirmText, handleLogAction, riskyContact.name, onProceed]);

  // When countdown expires, call handleProceed outside setState
  useEffect(() => {
    if (countdown === 0 && countdownExpiredRef.current) {
      countdownExpiredRef.current = false; // Prevent repeated calls
      void handleProceed();
    }
  }, [countdown, handleProceed]);

  const handleCallSponsor = async (): Promise<void> => {
    if (!sponsorPhone) { Alert.alert('No Sponsor Set', 'Please set up your sponsor in Settings first.'); return; }
    try {
      hapticSuccess();
      setIsProcessing(true);
      await handleLogAction('called_sponsor', `Called sponsor instead of ${riskyContact.name}`);
      await Linking.openURL(`tel:${sponsorPhone}`);
      setTimeout(() => setStep('complete'), 500);
    } catch {
      Alert.alert('Error', 'Failed to call sponsor. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSponsor = async (): Promise<void> => {
    if (!sponsorPhone) { Alert.alert('No Sponsor Set', 'Please set up your sponsor in Settings first.'); return; }
    try {
      hapticSuccess();
      setIsProcessing(true);
      await handleLogAction('texted_sponsor', `Texted sponsor instead of ${riskyContact.name}`);
      await Linking.openURL(`sms:${sponsorPhone}&body=I need help. I almost called ${riskyContact.name}.`);
      setTimeout(() => setStep('complete'), 500);
    } catch {
      Alert.alert('Error', 'Failed to text sponsor. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWait20Minutes = async (): Promise<void> => {
    hapticSuccess();
    await handleLogAction('waited', 'Chose to wait 20 minutes');
    Alert.alert('Good Choice', "You decided to wait. Cravings usually pass in 15-20 minutes.", [
      { text: 'OK', onPress: () => setStep('complete') },
    ]);
  };

  const handlePlayGame = async (): Promise<void> => {
    hapticSuccess();
    await handleLogAction('played_game', 'Chose distraction game');
    Alert.alert('Coming Soon', 'Calming games will be available in the next update. For now, try the breathing exercise.', [
      { text: 'OK', onPress: () => setStep('complete') },
    ]);
  };

  const handleInsistProceed = (): void => { hapticWarning(); setStep('final'); };

  const handleDismiss = async (actionTaken: ActionTaken = 'dismissed'): Promise<void> => {
    try {
      setIsProcessing(true);
      await handleLogAction(actionTaken);
      hapticSuccess();
      onDismiss();
    } finally {
      setIsProcessing(false);
    }
  };

  // ========== STEP RENDERERS ==========

  const renderStopStep = (): React.ReactElement => (
    <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={[styles.stepContainer, { backgroundColor: ds.semantic.intent.alert.solid }]}>
      <SafeAreaView style={styles.stepContent} edges={['top', 'bottom']}>
        <Animated.View entering={SlideInDown.duration(500)} style={styles.stepInner}>
          <MaterialCommunityIcons name="hand-back-right" size={120} color={ds.semantic.text.onDark} accessibilityElementsHidden />
          <Text style={[styles.bigText, { color: ds.semantic.text.onDark, marginTop: ds.space[8] }]} accessibilityRole="header">STOP</Text>
          <Text style={[styles.mediumText, { color: ds.semantic.text.onDark, marginTop: ds.space[6], textAlign: 'center' }]}>Are you sure about this?</Text>
          <Text style={[styles.bodyText, { color: ds.semantic.text.onDark, marginTop: ds.space[4], textAlign: 'center' }]}>
            You've been clean for {cleanDays} {cleanDays === 1 ? 'day' : 'days'}.{'\n'}Don't throw it away.
          </Text>
          <View style={styles.progressDots} accessibilityLabel="Step 1 of 4" accessibilityRole="text">
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.progressDot, { backgroundColor: i === 0 ? ds.semantic.text.onDark : ds.semantic.surface.overlay }]} />
            ))}
          </View>
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );

  const renderWhyStep = (): React.ReactElement => (
    <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={[styles.stepContainer, { backgroundColor: ds.semantic.intent.primary.solid }]}>
      <SafeAreaView style={styles.stepContent} edges={['top', 'bottom']}>
        <Animated.View entering={SlideInDown.duration(500)} style={styles.stepInner}>
          <Text style={[styles.bigText, { color: ds.semantic.text.onDark }]} accessibilityRole="header">Remember Why You Started</Text>
          <View style={styles.whyContent}>
            <MaterialCommunityIcons name="heart" size={80} color={ds.semantic.text.onDark} accessibilityElementsHidden />
            <Text style={[styles.bodyText, { color: ds.semantic.text.onDark, marginTop: ds.space[6], textAlign: 'center' }]}>{whyText}</Text>
          </View>
          <View style={styles.progressDots} accessibilityLabel="Step 2 of 4" accessibilityRole="text">
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.progressDot, { backgroundColor: i === 1 ? ds.semantic.text.onDark : ds.semantic.surface.overlay }]} />
            ))}
          </View>
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );

  const renderAlternativesStep = (): React.ReactElement => (
    <Animated.View entering={FadeIn.duration(300)} style={[styles.stepContainer, { backgroundColor: ds.semantic.surface.app }]}>
      <SafeAreaView style={styles.stepContent} edges={['top', 'bottom']}>
        <View style={styles.stepInner}>
          <Text style={[styles.bigText, { color: ds.semantic.text.primary, marginBottom: ds.space[4] }]} accessibilityRole="header">What do you REALLY need right now?</Text>
          <View style={styles.alternativesContainer}>
            <Button title={`📞 Call ${sponsorName}`} onPress={handleCallSponsor} variant="primary" size="large" fullWidth disabled={isProcessing || !sponsorPhone} style={styles.alternativeButton} accessibilityLabel={`Call ${sponsorName}`} accessibilityHint="Makes a phone call to your sponsor" />
            <Button title="💬 Text Sponsor 'I need help'" onPress={handleTextSponsor} variant="secondary" size="large" fullWidth disabled={isProcessing || !sponsorPhone} style={styles.alternativeButton} accessibilityLabel="Text sponsor for help" accessibilityHint="Sends a text message to your sponsor" />
            <Button title="⏱️ Just Wait 20 Minutes" onPress={handleWait20Minutes} variant="outline" size="large" fullWidth disabled={isProcessing} style={styles.alternativeButton} accessibilityLabel="Wait 20 minutes" accessibilityHint="Cravings usually pass in 15 to 20 minutes" />
            <Button title="🎮 Play Calming Game" onPress={handlePlayGame} variant="outline" size="large" fullWidth disabled={isProcessing} style={styles.alternativeButton} accessibilityLabel="Play a calming game" />
          </View>
          <Pressable
            onPress={handleInsistProceed}
            style={styles.insistLink}
            accessibilityLabel="I still want to make this call"
            accessibilityRole="button"
            accessibilityHint="Proceeds to final confirmation step"
          >
            <Text style={[styles.smallLink, { color: ds.semantic.text.tertiary }]}>I still want to make this call</Text>
          </Pressable>
          <View style={styles.progressDots} accessibilityLabel="Step 3 of 4" accessibilityRole="text">
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.progressDot, { backgroundColor: i === 2 ? ds.semantic.intent.primary.solid : ds.semantic.surface.overlay }]} />
            ))}
          </View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );

  const renderFinalStep = (): React.ReactElement => (
    <Animated.View entering={FadeIn.duration(300)} style={[styles.stepContainer, { backgroundColor: ds.semantic.surface.app }]}>
      <SafeAreaView style={styles.stepContent} edges={['top', 'bottom']}>
        <View style={styles.stepInner}>
          <MaterialCommunityIcons name="alert-octagon" size={80} color={ds.semantic.intent.alert.solid} accessibilityElementsHidden />
          <Text style={[styles.bigText, { color: ds.semantic.intent.alert.solid, marginTop: ds.space[6], textAlign: 'center' }]} accessibilityRole="header">Last Chance to Choose Recovery</Text>
          <Text style={[styles.bodyText, { color: ds.semantic.text.primary, marginTop: ds.space[4], textAlign: 'center' }]}>
            This call could end your sobriety.{'\n'}Type "YES I AM RELAPSING" to proceed:
          </Text>
          <TextInput
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder="YES I AM RELAPSING"
            placeholderTextColor={ds.semantic.text.muted}
            style={styles.confirmInput}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!isProcessing}
            accessibilityLabel="Type YES I AM RELAPSING to confirm"
            accessibilityHint="You must type the exact phrase to proceed with the call"
          />
          <View style={styles.countdownContainer}>
            <Text
              style={[styles.countdownText, { color: ds.semantic.intent.alert.solid }]}
              accessibilityLabel={`Call will proceed in ${countdown} seconds`}
              accessibilityLiveRegion="polite"
            >
              Call will proceed in: {countdown}s
            </Text>
          </View>
          <Button title="Cancel - I Changed My Mind" onPress={() => handleDismiss('dismissed')} variant="primary" size="large" fullWidth disabled={isProcessing} style={{ marginTop: ds.space[6] }} accessibilityLabel="Cancel, I changed my mind" accessibilityHint="Cancels the call and returns to safety" />
          <View style={styles.progressDots} accessibilityLabel="Step 4 of 4" accessibilityRole="text">
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.progressDot, { backgroundColor: i === 3 ? ds.semantic.intent.primary.solid : ds.semantic.surface.overlay }]} />
            ))}
          </View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );

  const renderCompleteStep = (): React.ReactElement => (
    <Animated.View entering={FadeIn.duration(300)} style={[styles.stepContainer, { backgroundColor: ds.semantic.intent.success.solid }]}>
      <SafeAreaView style={styles.stepContent} edges={['top', 'bottom']}>
        <View style={styles.stepInner}>
          <MaterialCommunityIcons name="check-circle" size={120} color={ds.semantic.text.onDark} accessibilityElementsHidden />
          <Text style={[styles.bigText, { color: ds.semantic.text.onDark, marginTop: ds.space[8] }]} accessibilityRole="header">You Made the Right Choice 💙</Text>
          <Text style={[styles.bodyText, { color: ds.semantic.text.onDark, marginTop: ds.space[4], textAlign: 'center' }]}>
            You just resisted a close call.{'\n'}That takes real strength.
          </Text>
          <Button title="Close" onPress={() => handleDismiss('dismissed')} variant="outline" size="large" fullWidth style={{ marginTop: ds.space[12], borderColor: ds.semantic.text.onDark }} accessibilityLabel="Close intervention screen" />
        </View>
      </SafeAreaView>
    </Animated.View>
  );

  switch (step) {
    case 'stop': return renderStopStep();
    case 'why': return renderWhyStep();
    case 'alternatives': return renderAlternativesStep();
    case 'final': return renderFinalStep();
    case 'complete': return renderCompleteStep();
    default: return renderAlternativesStep();
  }
}

const createStyles = (ds: DS) =>
  ({
    stepContainer: {
      flex: 1,
    },
    stepContent: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    stepInner: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingHorizontal: ds.space[8],
      width: '100%' as const,
    },
    bigText: {
      fontSize: 32,
      fontWeight: 'bold' as const,
      textAlign: 'center' as const,
    },
    mediumText: {
      fontSize: 24,
      fontWeight: '600' as const,
    },
    bodyText: {
      fontSize: 18,
      lineHeight: 28,
    },
    smallLink: {
      fontSize: 14,
      textDecorationLine: 'underline' as const,
    },
    insistLink: {
      marginTop: ds.space[8],
      padding: ds.space[2],
      minHeight: 48,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    whyContent: {
      alignItems: 'center' as const,
      marginTop: ds.space[12],
    },
    alternativesContainer: {
      width: '100%' as const,
      marginTop: ds.space[8],
    },
    alternativeButton: {
      marginBottom: ds.space[4],
    },
    confirmInput: {
      width: '100%' as const,
      borderWidth: 2,
      borderRadius: ds.radius.lg,
      padding: ds.space[4],
      marginTop: ds.space[6],
      textAlign: 'center' as const,
      fontSize: 18,
      backgroundColor: ds.semantic.surface.elevated,
      color: ds.semantic.text.primary,
      borderColor: ds.semantic.surface.overlay,
    },
    countdownContainer: {
      marginTop: ds.space[6],
    },
    countdownText: {
      fontSize: 20,
      fontWeight: 'bold' as const,
    },
    progressDots: {
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
      gap: ds.space[3],
      marginTop: ds.space[12],
    },
    progressDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
  }) as const;
