import { View, Text, TouchableOpacity } from 'react-native';
import { memo } from 'react';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface StepTimelineCardProps {
  step: {
    step: number;
    title: string;
    description: string;
  };
  isCurrent: boolean;
  progress: 'none' | 'started' | 'completed';
  onPress: () => void;
  index: number;
  isLast: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const StepTimelineCard = memo(function StepTimelineCard({
  step,
  isCurrent,
  progress,
  onPress,
  index,
  isLast,
}: StepTimelineCardProps) {
  const isLocked = progress === 'none' && !isCurrent;
  const isCompleted = progress === 'completed';

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()} className="flex-row">
      {/* Timeline Column */}
      <View className="items-center mr-4 w-10">
        {/* Connector Line */}
        {!isLast && (
          <View
            className={`absolute top-10 bottom-[-24] w-0.5 ${
              isCompleted ? 'bg-success-500/50' : 'bg-surface-700/30'
            }`}
          />
        )}

        {/* Step Node */}
        <View
          className={`w-10 h-10 rounded-full items-center justify-center border-2 z-10 ${
            isCurrent
              ? 'bg-navy-900 border-primary-500 shadow-lg shadow-primary-500/50'
              : isCompleted
                ? 'bg-success-900 border-success-500'
                : 'bg-navy-900 border-surface-700'
          }`}
        >
          {isCompleted ? (
            <Feather name="check" size={20} color="#22c55e" />
          ) : isLocked ? (
            <Feather name="lock" size={16} color="#475569" />
          ) : (
            <Text className={`font-bold ${isCurrent ? 'text-primary-400' : 'text-white'}`}>
              {step.step}
            </Text>
          )}
        </View>
      </View>

      {/* Card Content */}
      <View className="flex-1 pb-6">
        <AnimatedTouchableOpacity
          onPress={onPress}
          disabled={isLocked}
          activeOpacity={0.8}
          className="rounded-2xl overflow-hidden"
          accessibilityRole="button"
          accessibilityLabel={`Step ${step.step}: ${step.title}${isCompleted ? ', completed' : isCurrent ? ', current step' : isLocked ? ', locked' : ''}`}
          accessibilityHint={
            isLocked
              ? 'Complete previous steps to unlock'
              : isCompleted
                ? 'Review completed step work'
                : 'Continue working on this step'
          }
          accessibilityState={{ disabled: isLocked }}
        >
          <BlurView
            intensity={isCurrent ? 40 : 20}
            tint="dark"
            className={`p-5 border ${
              isCurrent ? 'border-primary-500/30 bg-primary-500/5' : 'border-white/5 bg-navy-800/40'
            }`}
          >
            <View className="flex-row justify-between items-start mb-2">
              <Text
                className={`text-base font-bold ${isCurrent ? 'text-white' : 'text-surface-300'}`}
              >
                Step {step.step}: {step.title}
              </Text>

              {isCurrent && (
                <View className="bg-primary-500 px-2 py-0.5 rounded-full">
                  <Text className="text-white text-[10px] uppercase font-bold tracking-wider">
                    Current
                  </Text>
                </View>
              )}
            </View>

            <Text
              className={`text-sm leading-5 ${isLocked ? 'text-surface-600' : 'text-surface-400'}`}
            >
              {step.description}
            </Text>

            {/* CTA specific to state */}
            {!isLocked && (
              <View className="flex-row items-center mt-4">
                <Text
                  className={`text-xs font-semibold mr-2 ${
                    isCurrent ? 'text-primary-400' : 'text-surface-500'
                  }`}
                >
                  {isCompleted ? 'Review Step' : 'Continue Step Work'}
                </Text>
                <Feather name="arrow-right" size={14} color={isCurrent ? '#60a5fa' : '#64748b'} />
              </View>
            )}
          </BlurView>
        </AnimatedTouchableOpacity>
      </View>
    </Animated.View>
  );
});
