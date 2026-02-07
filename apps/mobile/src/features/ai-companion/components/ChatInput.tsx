/**
 * Chat Input Component
 * Text input with send button, haptics, and polish.
 */

import React, { useState, useRef, useCallback } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Keyboard,
  Animated,
} from 'react-native';
import { Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Icon } from '@/components/ui/Icon';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isLoading,
  placeholder = "What's on your mind?",
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleSend = useCallback(() => {
    if (text.trim() && !isLoading) {
      // Haptic feedback on send
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      
      // Animate button
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      onSend(text.trim());
      setText('');
      Keyboard.dismiss();
    }
  }, [text, isLoading, onSend, scaleAnim]);

  const canSend = text.trim().length > 0 && !isLoading;

  return (
    <View 
      className={`
        flex-row items-end px-4 py-3 bg-black border-t
        ${isFocused ? 'border-amber-500/30' : 'border-gray-800'}
      `}
    >
      <TextInput
        ref={inputRef}
        value={text}
        onChangeText={setText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        placeholderTextColor="#4B5563"
        multiline
        maxLength={2000}
        className="flex-1 bg-gray-900 rounded-2xl px-4 py-3 text-white text-base max-h-32 min-h-[44px]"
        style={{ textAlignVertical: 'center' }}
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
        returnKeyType="default"
        editable={!isLoading}
        accessibilityLabel="Message input"
        accessibilityHint="Type your message here"
      />

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={handleSend}
          disabled={!canSend}
          activeOpacity={0.7}
          className={`
            ml-3 w-11 h-11 rounded-full items-center justify-center
            ${canSend ? 'bg-amber-500' : 'bg-gray-800'}
          `}
          accessibilityRole="button"
          accessibilityLabel={isLoading ? 'Sending message' : 'Send message'}
          accessibilityState={{ disabled: !canSend }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#9CA3AF" />
          ) : (
            <Icon 
              as={Send} 
              size={20} 
              className={canSend ? 'text-black' : 'text-gray-600'} 
              style={{ marginLeft: 2 }}
            />
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
