/**
 * Craving Surfing Guide Screen
 *
 * Multi-step CBT-based urge surfing flow:
 * 1. Rate initial craving (1-10)
 * 2. Breathing exercise (4-7-8 pattern, ~2 min)
 * 3. Choose a distraction technique
 * 4. Rate craving again
 * 5. Show results with encouragement
 */

import React from 'react';
import { ScrollView, View } from 'react-native';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import { ProgressBar } from '../../../design-system/components/ProgressBar';
import { useCravingSurf } from '../hooks/useCravingSurf';
import { CravingRatingSlider } from '../components/CravingRatingSlider';
import { BreathingExercise } from '../components/BreathingExercise';
import { DistractionPicker } from '../components/DistractionPicker';
import { CravingResult } from '../components/CravingResult';
import type { HomeStackScreenProps } from '../../../navigation/types';

type CravingSurfScreenProps = HomeStackScreenProps<'CravingSurf'>;

const PHASE_PROGRESS: Record<string, number> = {
  'rate-initial': 0,
  breathing: 0.25,
  distraction: 0.5,
  'rate-final': 0.75,
  complete: 1,
};

const createStyles = (ds: DS) =>
  ({
    container: {
      flex: 1,
      backgroundColor: ds.semantic.surface.app,
    },
    progressContainer: {
      paddingHorizontal: ds.space[4],
      paddingTop: ds.space[2],
      paddingBottom: ds.space[1],
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center' as const,
      paddingBottom: ds.space[8],
    },
  }) as const;

export function CravingSurfScreen({ navigation }: CravingSurfScreenProps): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const {
    session,
    phase,
    breathingState,
    isBreathing,
    reductionPercent,
    startSession,
    startBreathing,
    selectDistraction,
    submitFinalRating,
    reset,
  } = useCravingSurf();

  const handleDone = (): void => {
    reset();
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <ProgressBar
          progress={PHASE_PROGRESS[phase] ?? 0}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {phase === 'rate-initial' && (
          <CravingRatingSlider
            title="Rate Your Craving"
            subtitle="How intense is your craving right now?"
            onSubmit={startSession}
            submitLabel="Next"
            testID="craving-rate-initial"
          />
        )}

        {phase === 'breathing' && (
          <BreathingExercise
            breathingState={breathingState}
            isBreathing={isBreathing}
            onStart={startBreathing}
            onComplete={() => {
              selectDistraction('breathing-only');
            }}
            testID="craving-breathing"
          />
        )}

        {phase === 'distraction' && (
          <DistractionPicker
            onSelect={selectDistraction}
            testID="craving-distraction"
          />
        )}

        {phase === 'rate-final' && (
          <CravingRatingSlider
            title="Rate Your Craving Now"
            subtitle="How intense is your craving after the exercise?"
            onSubmit={submitFinalRating}
            submitLabel="See Results"
            testID="craving-rate-final"
          />
        )}

        {phase === 'complete' && session && (
          <CravingResult
            initialRating={session.initialRating}
            finalRating={session.finalRating ?? session.initialRating}
            reductionPercent={reductionPercent ?? 0}
            distractionUsed={session.distractionUsed}
            onDone={handleDone}
            testID="craving-result"
          />
        )}
      </ScrollView>
    </View>
  );
}
