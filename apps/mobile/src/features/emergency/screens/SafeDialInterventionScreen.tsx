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

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Alert, BackHandler, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { useTheme, Button } from '../../../design-system';
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
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const { user } = useAuth();
  const { logCall } = useCloseCallTracking();

  const [step, setStep] = useState<InterventionStep>('stop');
  const [countdown, setCountdown] = useState(FINAL_COUNTDOWN_MS / 1000);
  const [confirmText, setConfirmText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const stopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const whyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ========================================
  // Step 1: Stop Hand (5 seconds)
  // ========================================
  useEffect(() => {
    if (step === 'stop') {
      hapticWarning();
      stopTimerRef.current = setTimeout(() => {
        setStep('why');
      }, STOP_DURATION_MS);

      return () => {
        if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      };
    }
    return undefined;
  }, [step]);

  // ========================================
  // Step 2: Why You Got Sober (10 seconds)
  // ========================================
  useEffect(() => {
    if (step === 'why') {
      whyTimerRef.current = setTimeout(() => {
        setStep('alternatives');
      }, WHY_DURATION_MS);

      return () => {
        if (whyTimerRef.current) clearTimeout(whyTimerRef.current);
      };
    }
    return undefined;
  }, [step]);

  // ========================================
  // Step 4: Final Countdown
  // ========================================
  useEffect(() => {
    if (step === 'final') {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleProceed();
            return 0;
          }
          if (prev % 10 === 0) hapticImpact();
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      };
    }
    return undefined;
  }, [step]);

  // ========================================
  // Prevent Back Button Exit
  // ========================================
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step !== 'alternatives') {
        return true; // Prevent back during forced steps
      }
      handleDismiss('dismissed');
      return true;
    });

    return () => backHandler.remove();
  }, [step]);

  // ========================================
  // Action Handlers
  // ========================================
  const handleLogAction = async (actionTaken: ActionTaken, notes?: string): Promise<void> => {
    if (!user?.id) return;

    try {
      await logCall({
        contactName: riskyContact.name,
        actionTaken,
        riskyContactId: riskyContact.id,
        notes,
      });
    } catch (error) {
      logger.error('Failed to log close call:', error);
    }
  };

  const handleCallSponsor = async (): Promise<void> => {
    if (!sponsorPhone) {
      Alert.alert('No Sponsor Set', 'Please set up your sponsor in Settings first.');
      return;
    }

    try {
      hapticSuccess();
      setIsProcessing(true);
      await handleLogAction('called_sponsor', `Called sponsor instead of ${riskyContact.name}`);
      await Linking.openURL(`tel:${sponsorPhone}`);

      setTimeout(() => {
        setStep('complete');
      }, 500);
    } catch (_error) {
      Alert.alert('Error', 'Failed to call sponsor. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSponsor = async (): Promise<void> => {
    if (!sponsorPhone) {
      Alert.alert('No Sponsor Set', 'Please set up your sponsor in Settings first.');
      return;
    }

    try {
      hapticSuccess();
      setIsProcessing(true);
      await handleLogAction('texted_sponsor', `Texted sponsor instead of ${riskyContact.name}`);
      await Linking.openURL(
        `sms:${sponsorPhone}&body=I need help. I almost called ${riskyContact.name}.`,
      );

      setTimeout(() => {
        setStep('complete');
      }, 500);
    } catch (_error) {
      Alert.alert('Error', 'Failed to text sponsor. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWait20Minutes = async (): Promise<void> => {
    hapticSuccess();
    await handleLogAction('waited', 'Chose to wait 20 minutes');

    Alert.alert(
      'Good Choice',
      "You decided to wait. Cravings usually pass in 15-20 minutes. We'll check in with you.",
      [
        {
          text: 'OK',
          onPress: () => setStep('complete'),
        },
      ],
    );
  };

  const handlePlayGame = async (): Promise<void> => {
    hapticSuccess();
    await handleLogAction('played_game', 'Chose distraction game');

    Alert.alert(
      'Coming Soon',
      'Calming games will be available in the next update. For now, try the breathing exercise.',
      [
        {
          text: 'OK',
          onPress: () => setStep('complete'),
        },
      ],
    );
  };

  const handleInsistProceed = (): void => {
    hapticWarning();
    setStep('final');
  };

  const handleProceed = async (): Promise<void> => {
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
  };

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

  // ========================================
  // Step Renderers
  // ========================================
  const renderStopStep = (): React.ReactElement => (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      style={[styles.stepContainer, { backgroundColor: theme.colors.danger }]}
    >
      <SafeAreaView style={styles.stepContent} edges={['top', 'bottom']}>
        <Animated.View entering={SlideInDown.duration(500)} style={styles.stepInner}>
          <MaterialCommunityIcons
            name="hand-back-right"
            size={120}
            color={ds.semantic.text.onDark}
          />

          <Text style={[styles.bigText, { color: ds.semantic.text.onDark, marginTop: 32 }]}>
            STOP
          </Text>

          <Text
            style={[
              styles.mediumText,
              { color: ds.semantic.text.onDark, marginTop: 24, textAlign: 'center' },
            ]}
          >
            Are you sure about this?
          </Text>

          <Text
            style={[
              styles.bodyText,
              { color: ds.semantic.text.onDark, marginTop: 16, textAlign: 'center' },
            ]}
          >
            You've been clean for {cleanDays} {cleanDays === 1 ? 'day' : 'days'}.{'\n'}
            Don't throw it away.
          </Text>

          <View style={styles.progressDots}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  { backgroundColor: i === 0 ? ds.semantic.text.onDark : ds.colors.bgTertiary },
                ]}
              />
            ))}
          </View>
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );

  const renderWhyStep = (): React.ReactElement => (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      style={[styles.stepContainer, { backgroundColor: theme.colors.primary }]}
    >
      <SafeAreaView style={styles.stepContent} edges={['top', 'bottom']}>
        <Animated.View entering={SlideInDown.duration(500)} style={styles.stepInner}>
          <Text style={[styles.bigText, { color: ds.semantic.text.onDark }]}>
            Remember Why You Started
          </Text>

          <View style={styles.whyContent}>
            <MaterialCommunityIcons name="heart" size={80} color={ds.semantic.text.onDark} />
            <Text
              style={[
                styles.bodyText,
                { color: ds.semantic.text.onDark, marginTop: 24, textAlign: 'center' },
              ]}
            >
              {whyText}
            </Text>
          </View>

          <View style={styles.progressDots}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  { backgroundColor: i === 1 ? ds.semantic.text.onDark : ds.colors.bgTertiary },
                ]}
              />
            ))}
          </View>
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );

  const renderAlternativesStep = (): React.ReactElement => (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[styles.stepContainer, { backgroundColor: theme.colors.semantic.surface.app }]}
    >
      <SafeAreaView style={styles.stepContent} edges={['top', 'bottom']}>
        <View style={styles.stepInner}>
          <Text style={[styles.bigText, { color: theme.colors.text, marginBottom: 16 }]}>
            What do you REALLY need right now?
          </Text>

          <View style={styles.alternativesContainer}>
            <Button
              title={`📞 Call ${sponsorName}`}
              onPress={handleCallSponsor}
              variant="primary"
              size="large"
              fullWidth
              disabled={isProcessing || !sponsorPhone}
              style={styles.alternativeButton}
            />

            <Button
              title="💬 Text Sponsor 'I need help'"
              onPress={handleTextSponsor}
              variant="secondary"
              size="large"
              fullWidth
              disabled={isProcessing || !sponsorPhone}
              style={styles.alternativeButton}
            />

            <Button
              title="⏱️ Just Wait 20 Minutes"
              onPress={handleWait20Minutes}
              variant="outline"
              size="large"
              fullWidth
              disabled={isProcessing}
              style={styles.alternativeButton}
            />

            <Button
              title="🎮 Play Calming Game"
              onPress={handlePlayGame}
              variant="outline"
              size="large"
              fullWidth
              disabled={isProcessing}
              style={styles.alternativeButton}
            />
          </View>

          <Text
            style={[
              styles.smallLink,
              { color: theme.colors.textSecondary, marginTop: 32, textAlign: 'center' },
            ]}
            onPress={handleInsistProceed}
          >
            I still want to make this call
          </Text>

          <View style={styles.progressDots}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  { backgroundColor: i === 2 ? theme.colors.primary : theme.colors.border },
                ]}
              />
            ))}
          </View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );

  const renderFinalStep = (): React.ReactElement => (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[styles.stepContainer, { backgroundColor: theme.colors.semantic.surface.app }]}
    >
      <SafeAreaView style={styles.stepContent} edges={['top', 'bottom']}>
        <View style={styles.stepInner}>
          <MaterialCommunityIcons name="alert-octagon" size={80} color={theme.colors.danger} />

          <Text
            style={[
              styles.bigText,
              { color: theme.colors.danger, marginTop: 24, textAlign: 'center' },
            ]}
          >
            Last Chance to Choose Recovery
          </Text>

          <Text
            style={[
              styles.bodyText,
              { color: theme.colors.text, marginTop: 16, textAlign: 'center' },
            ]}
          >
            This call could end your sobriety.{'\n'}
            Type "YES I AM RELAPSING" to proceed:
          </Text>

          <TextInput
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder="YES I AM RELAPSING"
            placeholderTextColor={theme.colors.textSecondary}
            style={[
              styles.confirmInput,
              theme.typography.body,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!isProcessing}
          />

          <View style={styles.countdownContainer}>
            <Text style={[styles.countdownText, { color: theme.colors.danger }]}>
              Call will proceed in: {countdown}s
            </Text>
          </View>

          <Button
            title="Cancel - I Changed My Mind"
            onPress={() => handleDismiss('dismissed')}
            variant="primary"
            size="large"
            fullWidth
            disabled={isProcessing}
            style={{ marginTop: 24 }}
          />

          <View style={styles.progressDots}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  { backgroundColor: i === 3 ? theme.colors.primary : theme.colors.border },
                ]}
              />
            ))}
          </View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );

  const renderCompleteStep = (): React.ReactElement => (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[styles.stepContainer, { backgroundColor: theme.colors.success }]}
    >
      <SafeAreaView style={styles.stepContent} edges={['top', 'bottom']}>
        <View style={styles.stepInner}>
          <MaterialCommunityIcons name="check-circle" size={120} color={ds.semantic.text.onDark} />

          <Text style={[styles.bigText, { color: ds.semantic.text.onDark, marginTop: 32 }]}>
            You Made the Right Choice 💙
          </Text>

          <Text
            style={[
              styles.bodyText,
              { color: ds.semantic.text.onDark, marginTop: 16, textAlign: 'center' },
            ]}
          >
            You just resisted a close call.{'\n'}
            That takes real strength.
          </Text>

          <Button
            title="Close"
            onPress={() => handleDismiss('dismissed')}
            variant="outline"
            size="large"
            fullWidth
            style={{ marginTop: 48, borderColor: ds.semantic.text.onDark }}
          />
        </View>
      </SafeAreaView>
    </Animated.View>
  );

  // ========================================
  // Main Render
  // ========================================
  switch (step) {
    case 'stop':
      return renderStopStep();
    case 'why':
      return renderWhyStep();
    case 'alternatives':
      return renderAlternativesStep();
    case 'final':
      return renderFinalStep();
    case 'complete':
      return renderCompleteStep();
    default:
      return renderAlternativesStep();
  }
}

const createStyles = (_ds: DS) =>
  ({
    stepContainer: {
      flex: 1,
    },
    stepContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepInner: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      width: '100%',
    },
    bigText: {
      fontSize: 32,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    mediumText: {
      fontSize: 24,
      fontWeight: '600',
    },
    bodyText: {
      fontSize: 18,
      lineHeight: 28,
    },
    smallLink: {
      fontSize: 14,
      textDecorationLine: 'underline',
    },
    whyContent: {
      alignItems: 'center',
      marginTop: 48,
    },
    alternativesContainer: {
      width: '100%',
      marginTop: 32,
    },
    alternativeButton: {
      marginBottom: 16,
    },
    confirmInput: {
      width: '100%',
      borderWidth: 2,
      borderRadius: 8,
      padding: 16,
      marginTop: 24,
      textAlign: 'center',
      fontSize: 18,
    },
    countdownContainer: {
      marginTop: 24,
    },
    countdownText: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    progressDots: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
      marginTop: 48,
    },
    progressDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
  }) as const;
