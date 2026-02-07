/**
 * Chat Input Component
 * Text input with send button for chat messages.
 */

import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Send } from 'lucide-react-native';
import { Icon } from '@/components/ui/Icon';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isLoading,
  placeholder = 'Type a message...',
}: ChatInputProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    if (text.trim() && !isLoading) {
      onSend(text.trim());
      setText('');
    }
  };

  const canSend = text.trim() && !isLoading;

  return (
    <View className="flex-row items-end px-4 py-3 bg-gray-900 border-t border-gray-800">
      <TextInput
        ref={inputRef}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor="#6B7280"
        multiline
        maxLength={2000}
        className="flex-1 bg-gray-800 rounded-2xl px-4 py-3 text-white text-base max-h-32"
        onSubmitEditing={handleSend}
        editable={!isLoading}
        accessibilityLabel="Message input"
        accessibilityHint="Type your message here"
      />

      <TouchableOpacity
        onPress={handleSend}
        disabled={!canSend}
        className={`
          ml-2 w-11 h-11 rounded-full items-center justify-center
          ${canSend ? 'bg-amber-500' : 'bg-gray-700'}
        `}
        accessibilityRole="button"
        accessibilityLabel={isLoading ? 'Sending message' : 'Send message'}
        accessibilityState={{ disabled: !canSend }}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#6B7280" />
        ) : (
          <Icon as={Send} size={20} className={canSend ? 'text-black' : 'text-gray-500'} />
        )}
      </TouchableOpacity>
    </View>
  );
}
