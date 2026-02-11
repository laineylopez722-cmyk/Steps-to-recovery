/**
 * Guided Meditation Screen
 * AI-guided breathing and meditation exercise.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';

type Phase = 'ready' | 'inhale' | 'hold' | 'exhale' | 'complete';

const BREATH_CYCLES = 5;
const INHALE_MS = 4000;
const HOLD_MS = 4000;
const EXHALE_MS = 6000;

export function GuidedMeditationScreen(): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const navigation = useNavigation();
  const [phase, setPhase] = useState<Phase>('ready');
  const [cycleCount, setCycleCount] = useState(0);
  const [instruction, setInstruction] = useState('Tap to begin');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const circleScale = useSharedValue(1);
  const circleOpacity = useSharedValue(0.3);

  const animatedCircle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
    opacity: circleOpacity.value,
  }));

  const runBreathCycle = useCallback(
    (cycle: number): void => {
      if (cycle >= BREATH_CYCLES) {
        setPhase('complete');
        setInstruction('Well done');
        circleScale.value = withTiming(1, { duration: 1000 });
        circleOpacity.value = withTiming(0.5, { duration: 1000 });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        return;
      }

      // Inhale
      setPhase('inhale');
      setInstruction('Breathe in...');
      setCycleCount(cycle + 1);
      circleScale.value = withTiming(1.6, {
        duration: INHALE_MS,
        easing: Easing.inOut(Easing.ease),
      });
      circleOpacity.value = withTiming(0.8, { duration: INHALE_MS });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

      timerRef.current = setTimeout(() => {
        // Hold
        setPhase('hold');
        setInstruction('Hold...');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

        timerRef.current = setTimeout(() => {
          // Exhale
          setPhase('exhale');
          setInstruction('Breathe out...');
          circleScale.value = withTiming(1, {
            duration: EXHALE_MS,
            easing: Easing.inOut(Easing.ease),
          });
          circleOpacity.value = withTiming(0.3, { duration: EXHALE_MS });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

          timerRef.current = setTimeout(() => {
            runBreathCycle(cycle + 1);
          }, EXHALE_MS);
        }, HOLD_MS);
      }, INHALE_MS);
    },
    [circleScale, circleOpacity],
  );

  const handleStart = useCallback((): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    runBreathCycle(0);
  }, [runBreathCycle]);

  const handleStop = useCallback((): void => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPhase('ready');
    setInstruction('Tap to begin');
    setCycleCount(0);
    circleScale.value = withTiming(1, { duration: 500 });
    circleOpacity.value = withTiming(0.3, { duration: 500 });
  }, [circleScale, circleOpacity]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              handleStop();
              navigation.goBack();
            }}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Feather name="chevron-left" size={26} color={ds.colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Breathing</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.centerArea}>
          {/* Breathing circle */}
          <Pressable
            onPress={phase === 'ready' ? handleStart : undefined}
            disabled={phase !== 'ready' && phase !== 'complete'}
            accessibilityRole="button"
            accessibilityLabel={phase === 'ready' ? 'Start breathing exercise' : instruction}
          >
            <Animated.View style={[styles.circle, animatedCircle]}>
              <Text style={styles.circleEmoji}>{phase === 'complete' ? '🌿' : '🫁'}</Text>
            </Animated.View>
          </Pressable>

          {/* Instruction */}
          <Text style={styles.instruction}>{instruction}</Text>

          {/* Cycle counter */}
          {phase !== 'ready' && phase !== 'complete' && (
            <Text style={styles.counter}>
              Breath {cycleCount} of {BREATH_CYCLES}
            </Text>
          )}

          {/* Complete state */}
          {phase === 'complete' && (
            <Animated.View entering={FadeIn.duration(500)} style={styles.completeSection}>
              <Text style={styles.completeBody}>
                You just took {BREATH_CYCLES} deep breaths. Your body and mind thank you.
              </Text>

              <View style={styles.btnRow}>
                <Pressable
                  onPress={() => {
                    handleStop();
                    handleStart();
                  }}
                  style={({ pressed }) => [styles.againBtn, pressed && styles.btnPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Do it again"
                >
                  <Text style={styles.againBtnText}>Again</Text>
                </Pressable>

                <Pressable
                  onPress={() => navigation.goBack()}
                  style={({ pressed }) => [styles.doneBtn, pressed && styles.btnPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Done"
                >
                  <Text style={styles.doneBtnText}>Done</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (ds: DS) =>
  ({
    container: { flex: 1, backgroundColor: ds.colors.bgPrimary },
    safe: { flex: 1 },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: ds.space[3],
      paddingVertical: ds.space[2],
    },
    backBtn: {
      width: 44,
      height: 44,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    headerTitle: {
      ...ds.typography.body,
      fontWeight: '600' as const,
      color: ds.colors.textPrimary,
    },
    headerSpacer: { width: 44 },

    centerArea: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingHorizontal: ds.space[8],
    },

    circle: {
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: ds.colors.accent,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: ds.space[8],
    },
    circleEmoji: { fontSize: 48 },

    instruction: {
      ...ds.typography.h2,
      color: ds.colors.textPrimary,
      textAlign: 'center' as const,
      marginBottom: ds.space[3],
    },
    counter: {
      ...ds.typography.caption,
      color: ds.colors.textTertiary,
    },

    completeSection: { alignItems: 'center' as const, marginTop: ds.space[4] },
    completeBody: {
      ...ds.typography.body,
      color: ds.colors.textSecondary,
      textAlign: 'center' as const,
      marginBottom: ds.space[6],
      lineHeight: 24,
    },

    btnRow: { flexDirection: 'row' as const, gap: ds.space[3] },
    againBtn: {
      paddingHorizontal: ds.space[6],
      paddingVertical: ds.space[3],
      borderRadius: ds.radius.full,
      backgroundColor: ds.colors.bgTertiary,
    },
    againBtnText: { ...ds.typography.body, color: ds.colors.textSecondary },
    doneBtn: {
      paddingHorizontal: ds.space[6],
      paddingVertical: ds.space[3],
      borderRadius: ds.radius.full,
      backgroundColor: ds.colors.accent,
    },
    doneBtnText: { ...ds.typography.body, fontWeight: '600' as const, color: ds.colors.text },
    btnPressed: { opacity: 0.8 },
  }) as const;
