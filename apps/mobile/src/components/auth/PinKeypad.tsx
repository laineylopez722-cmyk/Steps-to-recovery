import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

interface PinKeypadProps {
  onDigitPress: (digit: string) => void;
  onBackspacePress: () => void;
  disabled?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

function PinKeypadComponent({ onDigitPress, onBackspacePress, disabled }: PinKeypadProps) {
  const rows = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    ['', 0, 'backspace'],
  ];

  return (
    <View className="w-full max-w-sm">
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row justify-center gap-6 mb-6">
          {row.map((item, i) => {
            if (item === '') return <View key={`spacer-${i}`} className="w-20 h-20" />;

            const isBackspace = item === 'backspace';
            const digit = typeof item === 'number' ? item.toString() : item;

            return (
              <AnimatedTouchableOpacity
                key={`${rowIndex}-${i}`}
                entering={FadeIn.delay(rowIndex * 50 + i * 20)}
                disabled={disabled}
                onPress={() => {
                  if (isBackspace) {
                    onBackspacePress();
                  } else {
                    onDigitPress(digit as string);
                  }
                }}
                className={`w-20 h-20 items-center justify-center rounded-full ${
                  isBackspace
                    ? 'bg-transparent'
                    : 'bg-white/5 active:bg-white/10 border border-white/10'
                }`}
                accessibilityRole="button"
                accessibilityLabel={isBackspace ? 'Delete recent digit' : `Enter ${digit}`}
              >
                {isBackspace ? (
                  <Feather name="delete" size={24} color="#94a3b8" />
                ) : (
                  <Text className="text-3xl text-white font-medium">{digit}</Text>
                )}
              </AnimatedTouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export const PinKeypad = memo(PinKeypadComponent);
