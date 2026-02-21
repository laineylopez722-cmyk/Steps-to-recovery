/**
 * Chat Input Component
 *
 * Clean input with animated send button.
 * No harsh borders.
 */

import React, { useState, useRef, useCallback } from 'react';
import { View, TextInput, Pressable, ActivityIndicator, Keyboard } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { Send } from 'lucide-react-native';
import * as Haptics from '@/platform/haptics';
import { Icon } from '../../../components/ui/Icon';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading, placeholder = 'Message...' }) => {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleSend = useCallback(() => {
    if (text.trim() && !isLoading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      // Bounce animation using withSequence (no setTimeout cleanup needed)
      scale.value = withSequence(
        withSpring(0.85, ds.spring.snappy),
        withSpring(1, ds.spring.smooth),
      );

      onSend(text.trim());
      setText('');
      Keyboard.dismiss();
    }
  }, [text, isLoading, onSend, scale]);

  const canSend = text.trim().length > 0 && !isLoading;

  return (
    <View style={styles.container}>
      <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={ds.colors.textQuaternary}
          multiline
          maxLength={2000}
          style={styles.input}
          onSubmitEditing={handleSend}
          // blurOnSubmit removed (deprecated)
          returnKeyType="default"
          editable={!isLoading}
          accessibilityLabel="Message input"
          accessibilityHint="Type your message here"
        />
      </View>

      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          style={[styles.sendButton, canSend ? styles.sendButtonActive : styles.sendButtonInactive]}
          accessibilityRole="button"
          accessibilityLabel={isLoading ? 'Sending message' : 'Send message'}
          accessibilityState={{ disabled: !canSend }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={ds.colors.textTertiary} />
          ) : (
            <Icon
              as={Send}
              size={20}
              className={canSend ? 'text-black' : 'text-gray-600'}
              style={{ marginLeft: 2 }}
            />
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const createStyles = (ds: DS) =>
  ({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: ds.space[4],
      paddingVertical: ds.space[3],
      backgroundColor: ds.colors.bgPrimary,
      gap: ds.space[3],
    },

    inputContainer: {
      flex: 1,
      backgroundColor: ds.colors.bgTertiary,
      borderRadius: 24,
      paddingHorizontal: ds.space[4],
      paddingVertical: ds.space[3],
      minHeight: 48,
      maxHeight: 120,
    },
    inputContainerFocused: {
      backgroundColor: ds.colors.bgQuaternary,
    },

    input: {
      fontSize: 17,
      color: ds.colors.textPrimary,
      lineHeight: 24,
    },

    sendButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonActive: {
      backgroundColor: ds.colors.accent,
    },
    sendButtonInactive: {
      backgroundColor: ds.colors.bgTertiary,
    },
  }) as const;

