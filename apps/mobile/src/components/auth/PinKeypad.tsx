import { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  type ViewStyle,
  type TextStyle as RNTextStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { ReactElement } from 'react';

interface PinKeypadProps {
  onDigitPress: (digit: string) => void;
  onBackspacePress: () => void;
  disabled?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const PinKeypadComponent = memo(function PinKeypadComponent({
  onDigitPress,
  onBackspacePress,
  disabled,
}: PinKeypadProps): ReactElement {
  const rows = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    ['', 0, 'backspace'],
  ];

  return (
    <View style={{ width: '100%', maxWidth: 200 } as ViewStyle}>
      {rows.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={
            { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 6 } as ViewStyle
          }
        >
          {row.map((item, i) => {
            if (item === '')
              return <View key={`spacer-${i}`} style={{ width: 20, height: 20 } as ViewStyle} />;

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
                style={
                  {
                    width: 20,
                    height: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                  } as ViewStyle
                }
                accessibilityRole="button"
                accessibilityLabel={isBackspace ? 'Delete recent digit' : `Enter ${digit}`}
              >
                {isBackspace ? (
                  <Feather name="delete" size={24} color="#94a3b8" />
                ) : (
                  <Text
                    style={
                      {
                        fontSize: 24,
                        color: 'white',
                        fontWeight: '500' as RNTextStyle['fontWeight'],
                      } as RNTextStyle
                    }
                    accessibilityLabel={`Enter ${digit}`}
                    accessibilityRole="button"
                  >
                    {digit}
                  </Text>
                )}
              </AnimatedTouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
});
