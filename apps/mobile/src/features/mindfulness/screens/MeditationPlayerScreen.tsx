/**
 * MeditationPlayerScreen
 *
 * Full-screen audio player for a single guided meditation.
 * Shows animated progress ring, elapsed/total time, play/pause/stop controls.
 * Works 100% offline — audio is bundled with the app.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useDs } from '../../../design-system/DsProvider';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useMeditationPlayer } from '../hooks/useMeditationPlayer';
import { getMeditationById, formatDuration } from '../data/meditations';

interface RouteParams {
  meditationId: string;
}

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function MeditationPlayerScreen(): React.ReactElement {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const ds = useDs();
  const styles = useThemedStyles(createStyles);
  const { meditationId } = route.params as RouteParams;

  const meditation = getMeditationById(meditationId);
  const { playerState, elapsedSeconds, progressRatio, errorMessage, play, pause, resume, stop } =
    useMeditationPlayer();

  // Animated progress bar width (0 → 100%)
  const progressWidth = useSharedValue(0);
  const animProgressStyle = useAnimatedStyle(() => ({ width: `${progressWidth.value * 100}%` as `${number}%` }));

  useEffect(() => {
    progressWidth.value = withTiming(progressRatio, {
      duration: 800,
      easing: Easing.out(Easing.ease),
    });
  }, [progressRatio]);

  // Auto-start when screen mounts
  useEffect(() => {
    if (meditation) {
      play(meditation).catch(() => {});
    }
  }, []);

  const handleBack = (): void => {
    stop();
    navigation.goBack();
  };

  const isPlaying = playerState === 'playing';
  const isFinished = playerState === 'finished';
  const isLoading = playerState === 'loading';

  if (!meditation) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Meditation not found.</Text>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.backLink}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={styles.backBtn}
          accessibilityLabel="Back to meditation library"
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={22} color={ds.semantic.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {meditation.title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Icon / visual */}
        <View style={styles.iconContainer} accessibilityElementsHidden>
          <Text style={styles.iconEmoji}>{meditation.icon}</Text>
        </View>

        {/* Title & description */}
        <Text style={styles.title}>{meditation.title}</Text>
        <Text style={styles.description}>{meditation.description}</Text>

        {/* Progress bar */}
        <View
          style={styles.progressTrack}
          accessibilityLabel={`Progress: ${Math.round(progressRatio * 100)} percent`}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: Math.round(progressRatio * 100) }}
        >
          <Animated.View style={[styles.progressFill, animProgressStyle]} />
        </View>

        {/* Time */}
        <View style={styles.timeRow}>
          <Text style={styles.timeText} accessibilityLabel={`Elapsed: ${formatSeconds(elapsedSeconds)}`}>
            {formatSeconds(elapsedSeconds)}
          </Text>
          <Text style={styles.timeText} accessibilityLabel={`Total duration: ${formatDuration(meditation.durationSeconds)}`}>
            {formatDuration(meditation.durationSeconds)}
          </Text>
        </View>

        {/* Error */}
        {errorMessage && (
          <Text style={styles.errorText} accessibilityRole="alert">
            {errorMessage}
          </Text>
        )}

        {/* Finished message */}
        {isFinished && (
          <Text style={styles.finishedText} accessibilityRole="alert">
            Session complete. Well done.
          </Text>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {/* Stop */}
          <Pressable
            style={styles.stopBtn}
            onPress={handleBack}
            accessibilityLabel="Stop and go back"
            accessibilityRole="button"
          >
            <Feather name="square" size={20} color={ds.semantic.text.secondary} />
          </Pressable>

          {/* Play / Pause */}
          <Pressable
            style={[styles.playBtn, { backgroundColor: ds.semantic.intent.primary.solid }]}
            onPress={isPlaying ? pause : resume}
            disabled={isLoading || isFinished}
            accessibilityLabel={isPlaying ? 'Pause meditation' : 'Resume meditation'}
            accessibilityRole="button"
            accessibilityState={{ disabled: isLoading || isFinished, busy: isLoading }}
          >
            <Feather
              name={isLoading ? 'loader' : isPlaying ? 'pause' : 'play'}
              size={28}
              color="#fff"
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          </Pressable>

          {/* Restart (visible when finished) */}
          <Pressable
            style={styles.stopBtn}
            onPress={() => {
              if (meditation) play(meditation).catch(() => {});
            }}
            accessibilityLabel="Restart meditation"
            accessibilityRole="button"
          >
            <Feather name="refresh-cw" size={20} color={ds.semantic.text.secondary} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (ds: DS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ds.semantic.surface.app,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: ds.space[4],
      paddingVertical: ds.space[3],
      borderBottomWidth: 1,
      borderBottomColor: ds.colors.borderDefault,
    },
    backBtn: {
      width: 40,
      height: 40,
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      ...ds.typography.h2,
      color: ds.semantic.text.primary,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 40,
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: ds.space[6],
      paddingTop: ds.space[8],
      paddingBottom: ds.space[4],
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: ds.semantic.surface.card,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: ds.space[6],
      borderWidth: 1,
      borderColor: ds.colors.borderDefault,
    },
    iconEmoji: {
      fontSize: 52,
    },
    title: {
      ...ds.typography.h2,
      color: ds.semantic.text.primary,
      textAlign: 'center',
      marginBottom: ds.space[2],
    },
    description: {
      ...ds.typography.body,
      color: ds.semantic.text.secondary,
      textAlign: 'center',
      marginBottom: ds.space[8],
      lineHeight: 22,
    },
    progressTrack: {
      width: '100%',
      height: 6,
      backgroundColor: ds.semantic.surface.card,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: ds.space[2],
    },
    progressFill: {
      height: '100%',
      backgroundColor: ds.semantic.intent.primary.solid,
      borderRadius: 3,
    },
    timeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: ds.space[6],
    },
    timeText: {
      ...ds.typography.caption,
      color: ds.semantic.text.tertiary,
      fontVariant: ['tabular-nums'],
    },
    errorText: {
      ...ds.typography.caption,
      color: ds.semantic.intent.alert.solid,
      textAlign: 'center',
      marginBottom: ds.space[4],
    },
    finishedText: {
      ...ds.typography.body,
      color: ds.semantic.intent.success.solid,
      textAlign: 'center',
      fontWeight: '600',
      marginBottom: ds.space[4],
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ds.space[6],
      marginTop: ds.space[2],
    },
    playBtn: {
      width: 72,
      height: 72,
      borderRadius: 36,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stopBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: ds.semantic.surface.card,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: ds.colors.borderDefault,
    },
    backLink: {
      ...ds.typography.body,
      color: ds.semantic.intent.primary.solid,
      marginTop: ds.space[3],
      textAlign: 'center',
    },
  });
