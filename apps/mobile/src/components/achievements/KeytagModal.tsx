/**
 * Keytag Modal Component
 * Full-screen modal showing keytag details and celebration
 */

import { memo, useState } from 'react';
import type { ReactElement } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientButton } from '../../design-system/components';
import type { KeytagWithStatus } from '@recovery/shared';
import { ds } from '../../design-system/tokens/ds';

interface KeytagModalProps {
  keytag: KeytagWithStatus | null;
  visible: boolean;
  onClose: () => void;
  onSaveReflection?: (reflection: string) => void;
}

export const KeytagModal = memo(function KeytagModal({
  keytag,
  visible,
  onClose,
  onSaveReflection,
}: KeytagModalProps): ReactElement | null {
  const [reflection, setReflection] = useState('');
  const [showReflectionInput, setShowReflectionInput] = useState(false);

  if (!keytag) return null as unknown as ReactElement;

  const { title, hexColor, color, days, description, message, isEarned, daysUntil } = keytag;
  const isWhite = color === 'white';

  const handleSaveReflection = (): void => {
    if (reflection.trim() && onSaveReflection) {
      onSaveReflection(reflection.trim());
      setReflection('');
      setShowReflectionInput(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-4 py-3 border-b border-surface-200 dark:border-surface-700">
            <TouchableOpacity onPress={onClose}>
              <Text className="text-primary-600 text-base">Close</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100">
              {title}
            </Text>
            <View className="w-12" />
          </View>

          <ScrollView className="flex-1 px-6 py-8">
            {/* Keytag Display */}
            <View className="items-center mb-8">
              <View
                className={`w-32 h-32 rounded-full items-center justify-center shadow-lg ${
                  !isEarned ? 'opacity-40' : ''
                }`}
                style={[
                  { backgroundColor: isEarned ? hexColor : ds.colors.textTertiary },
                  isWhite && isEarned
                    ? { borderWidth: 3, borderColor: ds.colors.borderSubtle }
                    : undefined,
                ]}
              >
                {/* Keytag hole */}
                <View className="absolute top-3 w-4 h-4 rounded-full bg-surface-100 dark:bg-surface-800" />

                {/* Days text */}
                <Text
                  className={`text-3xl font-bold ${
                    isWhite || color === 'yellow' ? 'text-surface-800' : 'text-white'
                  }`}
                >
                  {days === 0 ? 'JFT' : formatDaysLong(days)}
                </Text>
              </View>

              {/* Status */}
              {isEarned ? (
                <View className="mt-4 items-center">
                  <Text className="text-secondary-500 text-2xl">✓ Earned</Text>
                  {keytag.earnedAt && (
                    <Text className="text-surface-500 text-sm mt-1">
                      {formatFullDate(keytag.earnedAt)}
                    </Text>
                  )}
                </View>
              ) : (
                <View className="mt-4 items-center">
                  <Text className="text-surface-500 text-lg">{daysUntil} days to go</Text>
                  <View className="w-48 h-2 bg-surface-200 dark:bg-surface-700 rounded-full mt-2 overflow-hidden">
                    <View
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: keytag.progress ? `${keytag.progress}%` : 0 }}
                    />
                  </View>
                  <Text className="text-surface-400 text-sm mt-1">{keytag.progress}% progress</Text>
                </View>
              )}
            </View>

            {/* Description */}
            <View className="mb-6">
              <Text className="text-xl font-semibold text-surface-900 dark:text-surface-100 text-center mb-2">
                {description}
              </Text>
              <Text className="text-base text-surface-600 dark:text-surface-400 text-center leading-relaxed">
                {message}
              </Text>
            </View>

            {/* What this milestone means section */}
            {isEarned && (
              <View className="bg-surface-100 dark:bg-surface-800 rounded-xl p-4 mb-6">
                <Text className="text-base font-medium text-surface-900 dark:text-surface-100 mb-2">
                  What {title} means:
                </Text>
                <Text className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
                  {getKeytagMeaning(days)}
                </Text>
              </View>
            )}

            {/* Reflection section */}
            {isEarned && (
              <View className="mb-6">
                {!showReflectionInput ? (
                  <GradientButton
                    title="Add a Reflection"
                    variant="secondary"
                    onPress={() => setShowReflectionInput(true)}
                    fullWidth
                  />
                ) : (
                  <View>
                    <Text className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      What does this milestone mean to you?
                    </Text>
                    <TextInput
                      value={reflection}
                      onChangeText={setReflection}
                      placeholder="Write your reflection..."
                      placeholderTextColor={ds.colors.textTertiary}
                      multiline
                      numberOfLines={4}
                      className="bg-surface-100 dark:bg-surface-800 rounded-xl p-4 text-surface-900 dark:text-surface-100 min-h-[120px]"
                      textAlignVertical="top"
                    />
                    <View className="flex-row gap-3 mt-3">
                      <GradientButton
                        title="Cancel"
                        variant="secondary"
                        onPress={() => {
                          setShowReflectionInput(false);
                          setReflection('');
                        }}
                        fullWidth
                      />
                      <GradientButton
                        title="Save"
                        variant="primary"
                        onPress={handleSaveReflection}
                        disabled={!reflection.trim()}
                        fullWidth
                      />
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
});

/**
 * Achievement Unlock Celebration Modal
 */
export const UnlockCelebrationModal = memo(function UnlockCelebrationModal({
  achievement,
  visible,
  onClose,
}: {
  achievement: { title: string; icon: string; description: string } | null;
  visible: boolean;
  onClose: () => void;
}): ReactElement | null {
  if (!achievement) return null as unknown as ReactElement;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="bg-white dark:bg-surface-800 rounded-2xl p-8 items-center max-w-sm w-full shadow-xl">
          {/* Celebration icon */}
          <Text className="text-6xl mb-4">{achievement.icon}</Text>

          {/* Title */}
          <Text className="text-xl font-bold text-surface-900 dark:text-surface-100 text-center mb-2">
            Achievement Unlocked!
          </Text>

          {/* Achievement name */}
          <Text className="text-lg text-secondary-600 dark:text-secondary-400 text-center mb-2">
            {achievement.title}
          </Text>

          {/* Description */}
          <Text className="text-sm text-surface-500 text-center mb-6">
            {achievement.description}
          </Text>

          {/* Close button */}
          <GradientButton title="Awesome!" variant="primary" onPress={onClose} fullWidth />
        </View>
      </View>
    </Modal>
  );
});

export const formatDaysLong = (days: number): string => {
  if (days >= 730) return `${Math.floor(days / 365)}yr`;
  if (days >= 365) return '1yr';
  if (days >= 180) return `${Math.floor(days / 30)}mo`;
  return `${days}d`;
};

export const formatFullDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

export const getKeytagMeaning = (days: number): string => {
  const meanings: Record<number, string> = {
    0: "You showed up. You admitted you need help. That takes incredible courage. Just for today, you're here.",
    30: "Thirty days of choosing recovery, one day at a time. Your brain is starting to heal, and you're building new patterns.",
    60: "Two months of commitment. You've faced challenges and kept going. Your support network is growing.",
    90: "The foundation is set. 90 days is a cornerstone of early recovery. You've proven you can do this.",
    180: "Half a year of freedom. You're becoming comfortable in your own skin. Life is changing.",
    270: "Nine months of growth. You've weathered seasons clean. Your recovery is maturing.",
    365: 'A full year! Every season, every holiday, every challenge - you did it clean. This is a miracle.',
    547: "Eighteen months of living in recovery. You're not just staying clean, you're thriving.",
    730: 'Multiple years! You are proof that recovery works. Your experience, strength, and hope help others.',
  };

  return meanings[days] || 'Every clean day is a victory worth celebrating.';
};
