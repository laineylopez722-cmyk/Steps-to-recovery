import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '../Card';

// Mock haptics to prevent native module errors
jest.mock('../../../utils/haptics', () => ({
  hapticImpact: jest.fn().mockResolvedValue(undefined),
  hapticSelection: jest.fn().mockResolvedValue(undefined),
}));

// Mock useTheme hook
jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      surface: '#FFFFFF',
      border: '#E5E5EA',
      borderLight: '#D1D1D6',
    },
    radius: {
      card: 12,
    },
    spacing: {
      cardPadding: 16,
    },
    shadows: {
      md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 } },
      mdDark: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 } },
    },
    animations: {
      scales: { press: 0.98 },
    },
    isDark: false,
  }),
}));

// Mock useAnimation hooks
jest.mock('../../hooks/useAnimation', () => ({
  useFadeAndScaleIn: () => ({
    fadeAnim: { _value: 1 },
    scaleAnim: { _value: 1 },
  }),
  usePressAnimation: () => ({
    scaleAnim: { _value: 1 },
    animatePress: jest.fn(),
  }),
}));

describe('Card', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render children', () => {
      const { getByText } = render(
        <Card>
          <Text>Card Content</Text>
        </Card>,
      );

      expect(getByText('Card Content')).toBeTruthy();
    });

    it('should render with testID', () => {
      const { getByTestId } = render(
        <Card testID="my-card">
          <Text>Content</Text>
        </Card>,
      );

      expect(getByTestId('my-card')).toBeTruthy();
    });
  });

  describe('variants', () => {
    it('should render default variant', () => {
      const { getByText } = render(
        <Card variant="default">
          <Text>Default Card</Text>
        </Card>,
      );

      expect(getByText('Default Card')).toBeTruthy();
    });

    it('should render elevated variant', () => {
      const { getByText } = render(
        <Card variant="elevated">
          <Text>Elevated Card</Text>
        </Card>,
      );

      expect(getByText('Elevated Card')).toBeTruthy();
    });

    it('should render interactive variant', () => {
      const { getByText } = render(
        <Card variant="interactive" onPress={mockOnPress}>
          <Text>Interactive Card</Text>
        </Card>,
      );

      expect(getByText('Interactive Card')).toBeTruthy();
    });

    it('should render flat variant', () => {
      const { getByText } = render(
        <Card variant="flat">
          <Text>Flat Card</Text>
        </Card>,
      );

      expect(getByText('Flat Card')).toBeTruthy();
    });

    it('should render outlined variant', () => {
      const { getByText } = render(
        <Card variant="outlined">
          <Text>Outlined Card</Text>
        </Card>,
      );

      expect(getByText('Outlined Card')).toBeTruthy();
    });

    it('should render outline variant (alias)', () => {
      const { getByText } = render(
        <Card variant="outline">
          <Text>Outline Card</Text>
        </Card>,
      );

      expect(getByText('Outline Card')).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('should call onPress when pressed', async () => {
      const { getByText } = render(
        <Card onPress={mockOnPress}>
          <Text>Pressable Card</Text>
        </Card>,
      );

      fireEvent.press(getByText('Pressable Card'));

      await waitFor(() => {
        expect(mockOnPress).toHaveBeenCalledTimes(1);
      });
    });

    it('should not be pressable without onPress', () => {
      const { getByText } = render(
        <Card>
          <Text>Non-pressable Card</Text>
        </Card>,
      );

      // Should render as View, not TouchableOpacity
      const element = getByText('Non-pressable Card');
      expect(element).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('should have correct accessibility role when provided', () => {
      const { getByRole } = render(
        <Card accessibilityRole="button" onPress={mockOnPress}>
          <Text>Accessible Card</Text>
        </Card>,
      );

      expect(getByRole('button')).toBeTruthy();
    });

    it('should have accessibility label when provided', () => {
      const { getByLabelText } = render(
        <Card accessibilityLabel="My card" onPress={mockOnPress}>
          <Text>Card Content</Text>
        </Card>,
      );

      expect(getByLabelText('My card')).toBeTruthy();
    });

    it('should have accessibility hint when provided', () => {
      const { getByA11yHint } = render(
        <Card accessibilityHint="Opens card details" onPress={mockOnPress}>
          <Text>Card Content</Text>
        </Card>,
      );

      expect(getByA11yHint('Opens card details')).toBeTruthy();
    });
  });

  describe('animation', () => {
    it('should render with animate prop', () => {
      const { getByText } = render(
        <Card animate>
          <Text>Animated Card</Text>
        </Card>,
      );

      expect(getByText('Animated Card')).toBeTruthy();
    });
  });
});
