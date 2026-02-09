import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { STEP_PROMPTS } from '../../lib/constants/stepPrompts';
import { useJournalStore } from '../../lib/store';
import { StepTimelineCard } from '../../components/steps/StepTimelineCard';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

// Get progress indicator based on journal entries
function getStepProgress(step: number, entries: { type: string; stepNumber?: number }[]): 'none' | 'started' | 'completed' {
  const stepEntries = entries.filter(
    (e) => e.type === 'step-work' && e.stepNumber === step
  );
  if (stepEntries.length === 0) return 'none';
  if (stepEntries.length >= 3) return 'completed';
  return 'started';
}

export default function StepsScreen() {
  const router = useRouter();
  const { entries } = useJournalStore();

  // Determine current step (first incomplete step)
  const getCurrentStep = () => {
    for (const step of STEP_PROMPTS) {
      const progress = getStepProgress(step.step, entries);
      if (progress !== 'completed') return step.step;
    }
    return 12; // All complete
  };

  const currentStep = getCurrentStep();

  return (
    <View className="flex-1 bg-navy-950">
      {/* Background Ambience */}
      <View className="absolute top-0 left-0 right-0 h-96 overflow-hidden pointer-events-none">
        <View className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-primary-900/10 rounded-full blur-3xl" />
        <View className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] bg-secondary-900/10 rounded-full blur-3xl" />
      </View>

      <SafeAreaView className="flex-1">
        <FlatList
          data={STEP_PROMPTS}
          keyExtractor={(item) => item.step.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          ListHeaderComponent={() => (
            <Animated.View entering={FadeIn.duration(800)} className="mb-8">
              <View className="flex-row items-center gap-3 mb-2">
                <BlurView intensity={20} tint="light" className="p-3 rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                  <Feather name="map" size={24} color="#60a5fa" />
                </BlurView>
                <View>
                  <Text className="text-3xl font-bold text-white tracking-tight">The Journey</Text>
                  <Text className="text-primary-400 font-medium">12 Steps to Recovery</Text>
                </View>
              </View>
              <Text className="text-surface-400 leading-6 mt-2">
                "Here are the steps we took, which are suggested as a program of recovery."
              </Text>
            </Animated.View>
          )}
          renderItem={({ item, index }) => {
            const progress = getStepProgress(item.step, entries);
            const isCurrent = item.step === currentStep;

            return (
              <StepTimelineCard
                step={item}
                isCurrent={isCurrent}
                progress={progress}
                onPress={() => router.push(`/step-work/${item.step}` as Href)}
                index={index}
                isLast={index === STEP_PROMPTS.length - 1}
              />
            );
          }}
        />
      </SafeAreaView>
    </View>
  );
}

