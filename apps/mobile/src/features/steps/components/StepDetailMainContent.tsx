import React from 'react';
import { Animated, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import {
  StepDetailMainSections,
  type StepDetailMainSectionsProps,
} from './StepDetailMainSections';

export interface StepDetailMainContentProps extends StepDetailMainSectionsProps {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

export function StepDetailMainContent({
  fadeAnim,
  slideAnim,
  ...sectionsProps
}: StepDetailMainContentProps): React.ReactElement {
  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <StepDetailMainSections {...sectionsProps} />
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
  },
});
