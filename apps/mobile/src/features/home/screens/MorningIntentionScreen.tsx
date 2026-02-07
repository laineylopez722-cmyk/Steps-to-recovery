/**
 * Morning Intention Screen
 * 
 * Clean journaling interface.
 * No distractions, just writing.
 */

import React, { useState, useCallback } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  View, 
  Text, 
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useCreateCheckIn } from '../hooks/useCheckIns';
import { AnimatedCheckmark } from '../../../design-system/components';
import { hapticSuccess, hapticSelection } from '../../../utils/haptics';
import { ds } from '../../../design-system/tokens/ds';

interface Props {
  userId: string;
}

export function MorningIntentionScreen({ userId }: Props): React.ReactElement {
  const navigation = useNavigation();
  const { createCheckIn, isPending } = useCreateCheckIn(userId);

  const [text, setText] = useState('');
  const [mood, setMood] = useState(3);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleMood = useCallback((val: number) => {
    if (val !== mood) {
      hapticSelection();
      setMood(val);
    }
  }, [mood]);

  const handleSubmit = async () => {
    if (!text.trim() || isPending) return;
    
    try {
      await createCheckIn({ type: 'morning', intention: text.trim(), mood });
      hapticSuccess();
      setShowSuccess(true);
    } catch {}
  };

  const handleDone = () => {
    setShowSuccess(false);
    navigation.goBack();
  };

  const moods = [
    { val: 1, label: 'Struggling' },
    { val: 2, label: 'Low' },
    { val: 3, label: 'Okay' },
    { val: 4, label: 'Good' },
    { val: 5, label: 'Great' },
  ];

  const canSubmit = text.trim().length > 0 && !isPending;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView 
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
              <Feather name="x" size={ds.sizes.iconLg} color={ds.colors.textSecondary} />
            </Pressable>
            
            <Text style={styles.headerTitle}>Morning</Text>
            
            <Pressable 
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={[styles.saveBtn, !canSubmit && styles.saveBtnDisabled]}
            >
              <Text style={[styles.saveBtnText, !canSubmit && styles.saveBtnTextDisabled]}>
                Save
              </Text>
            </Pressable>
          </View>

          <ScrollView 
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Date */}
            <Animated.View entering={FadeInDown.duration(300)}>
              <Text style={styles.date}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </Animated.View>

            {/* Main Input */}
            <Animated.View entering={FadeIn.delay(100).duration(400)}>
              <Text style={styles.label}>What's your intention for today?</Text>
              <TextInput
                style={styles.input}
                value={text}
                onChangeText={setText}
                placeholder="I will..."
                placeholderTextColor={ds.colors.textQuaternary}
                multiline
                autoFocus
                scrollEnabled={false}
                textAlignVertical="top"
              />
            </Animated.View>

            {/* Mood */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.moodSection}>
              <Text style={styles.label}>How are you feeling?</Text>
              <Text style={styles.moodValue}>{moods.find(m => m.val === mood)?.label}</Text>
              
              <View style={styles.moodTrack}>
                {moods.map((m) => (
                  <Pressable
                    key={m.val}
                    onPress={() => handleMood(m.val)}
                    style={[
                      styles.moodDot,
                      mood >= m.val && styles.moodDotActive,
                    ]}
                  />
                ))}
              </View>
              
              <View style={styles.moodLabels}>
                <Text style={styles.moodLabelText}>Struggling</Text>
                <Text style={styles.moodLabelText}>Great</Text>
              </View>
            </Animated.View>

            <View style={{ height: ds.space[16] }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <AnimatedCheckmark 
              size={64} 
              color={ds.colors.success} 
              onAnimationComplete={handleDone} 
            />
            <Text style={styles.modalTitle}>Saved</Text>
            <Text style={styles.modalSub}>Have a good day</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ds.colors.bgPrimary,
  },
  safe: {
    flex: 1,
  },
  kav: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: ds.sizes.headerHeight,
    paddingHorizontal: ds.sizes.contentPadding,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.divider,
  },
  headerBtn: {
    width: ds.sizes.touchMin,
    height: ds.sizes.touchMin,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -ds.space[2],
  },
  headerTitle: {
    ...ds.typography.body,
    fontWeight: ds.fontWeight.semibold,
    color: ds.colors.textPrimary,
  },
  saveBtn: {
    paddingHorizontal: ds.space[4],
    paddingVertical: ds.space[2],
    backgroundColor: ds.colors.accent,
    borderRadius: ds.radius.sm,
  },
  saveBtnDisabled: {
    backgroundColor: ds.colors.bgTertiary,
  },
  saveBtnText: {
    ...ds.typography.bodySm,
    fontWeight: ds.fontWeight.semibold,
    color: ds.colors.bgPrimary,
  },
  saveBtnTextDisabled: {
    color: ds.colors.textQuaternary,
  },

  // Content
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: ds.sizes.contentPadding,
    paddingTop: ds.space[6],
  },

  date: {
    ...ds.typography.caption,
    color: ds.colors.textTertiary,
    marginBottom: ds.space[8],
  },

  label: {
    ...ds.typography.caption,
    color: ds.colors.textSecondary,
    marginBottom: ds.space[3],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  input: {
    ...ds.typography.h3,
    color: ds.colors.textPrimary,
    minHeight: 160,
    marginBottom: ds.space[10],
  },

  // Mood
  moodSection: {
    paddingTop: ds.space[6],
    borderTopWidth: 1,
    borderTopColor: ds.colors.divider,
  },
  moodValue: {
    ...ds.typography.h2,
    color: ds.colors.textPrimary,
    marginBottom: ds.space[6],
  },
  moodTrack: {
    flexDirection: 'row',
    gap: ds.space[2],
    marginBottom: ds.space[2],
  },
  moodDot: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: ds.colors.bgTertiary,
  },
  moodDotActive: {
    backgroundColor: ds.colors.accent,
  },
  moodLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodLabelText: {
    ...ds.typography.micro,
    color: ds.colors.textQuaternary,
  },

  // Modal
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: ds.colors.bgTertiary,
    borderRadius: ds.radius.xl,
    paddingVertical: ds.space[12],
    paddingHorizontal: ds.space[10],
    alignItems: 'center',
    minWidth: 240,
  },
  modalTitle: {
    ...ds.typography.h2,
    color: ds.colors.textPrimary,
    marginTop: ds.space[6],
  },
  modalSub: {
    ...ds.typography.body,
    color: ds.colors.textSecondary,
    marginTop: ds.space[2],
  },
});
