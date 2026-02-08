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

// WCAG AAA compliant touch target: 48x48dp minimum
const BUTTON_SIZE = 56; // 56dp for comfortable tapping
const BUTTON_RADIUS = BUTTON_SIZE / 2;

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
    <View style={{ width: '100%', maxWidth: 280 } as ViewStyle}>
      {rows.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={
            {
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 12,
              marginBottom: 12,
            } as ViewStyle
          }
        >
          {row.map((item, i) => {
            if (item === '')
              return (
                <View
                  key={`spacer-${i}`}
                  style={{ width: BUTTON_SIZE, height: BUTTON_SIZE } as ViewStyle}
                />
              );

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
                    width: BUTTON_SIZE,
                    height: BUTTON_SIZE,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: BUTTON_RADIUS,
                    backgroundColor: disabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                  } as ViewStyle
                }
                accessibilityRole="button"
                accessibilityLabel={isBackspace ? 'Delete recent digit' : `Enter ${digit}`}
                accessibilityHint={isBackspace ? 'Removes the last entered digit' : `Adds ${digit} to your PIN`}
                accessibilityState={{ disabled: disabled === true }}
                // Additional hit slop for motor accessibility
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {isBackspace ? (
                  <Feather name="delete" size={24} color="#94a3b8" />
                ) : (
                  <Text
                    style={
                      {
                        fontSize: 24,
                        color: disabled ? '#64748b' : 'white',
                        fontWeight: '500' as RNTextStyle['fontWeight'],
                      } as RNTextStyle
                    }
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
