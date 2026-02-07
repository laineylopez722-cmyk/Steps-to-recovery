import { memo } from 'react';
import { View, type ViewStyle } from 'react-native';
import type { ReactElement } from 'react';

interface PinIndicatorsProps {
  length: number;
  filledCount: number;
  error?: boolean;
}

export const PinIndicatorsComponent = memo(function PinIndicatorsComponent({
  length = 4,
  filledCount,
  error,
}: PinIndicatorsProps): ReactElement {
  return (
    <View
      style={
        { flexDirection: 'row', gap: 6, marginBottom: 10, justifyContent: 'center' } as ViewStyle
      }
    >
      {Array.from({ length }).map((_, i) => (
        <View
          key={i}
          style={
            {
              width: 4,
              height: 4,
              borderRadius: 4,
              borderWidth: 1,
              borderColor: 'white/20',
            } as ViewStyle
          }
        >
          {i < filledCount && (
            <View
              style={
                {
                  backgroundColor: error ? 'red' : 'white',
                  shadowColor: error ? 'red' : 'primary',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                } as ViewStyle
              }
            />
          )}
        </View>
      ))}
    </View>
  );
});
