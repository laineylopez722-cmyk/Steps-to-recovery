import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

type PromptModalProps = {
  visible: boolean;
  title: string;
  description?: string;
  initialValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
};

export function PromptModal({
  visible,
  title,
  description,
  initialValue = '',
  placeholder = 'Type here...',
  confirmLabel = 'Save',
  cancelLabel = 'Cancel',
  onSubmit,
  onCancel,
}: PromptModalProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
    }
  }, [visible, initialValue]);

  const handleSubmit = () => {
    onSubmit(value.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        className="flex-1 bg-black/50"
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Dismiss input modal"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-center p-6"
        >
          <Pressable
            className="bg-navy-900 rounded-2xl p-5 border border-surface-700/50"
            onPress={(e) => e.stopPropagation()}
            accessible
            accessibilityLabel={`${title} input dialog`}
          >
            <Text className="text-white text-lg font-semibold mb-2">{title}</Text>
            {description ? (
              <Text className="text-surface-400 text-sm mb-4">{description}</Text>
            ) : null}

            <View className="bg-navy-800 rounded-lg border border-surface-700/50 px-3 py-2 mb-4">
              <TextInput
                value={value}
                onChangeText={setValue}
                placeholder={placeholder}
                placeholderTextColor="#94a3b8"
                className="text-white text-base"
                autoFocus
                accessibilityLabel={placeholder}
              />
            </View>

            <View className="flex-row justify-end gap-3">
              <TouchableOpacity
                onPress={onCancel}
                className="px-4 py-2 rounded-lg border border-surface-700/80"
                accessibilityRole="button"
                accessibilityLabel={cancelLabel}
              >
                <Text className="text-surface-300 font-semibold">{cancelLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!value.trim()}
                className={`px-4 py-2 rounded-lg ${value.trim() ? 'bg-primary-500' : 'bg-surface-700/60'}`}
                accessibilityRole="button"
                accessibilityLabel={confirmLabel}
                accessibilityState={{ disabled: !value.trim() }}
              >
                <Text className="text-white font-semibold">{confirmLabel}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
