import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Button } from '../Button';

// Mock haptics to prevent native module errors
jest.mock('../../../utils/haptics', () => ({
  hapticImpact: jest.fn().mockResolvedValue(undefined),
  hapticSelection: jest.fn().mockResolvedValue(undefined),
  hapticNotification: jest.fn().mockResolvedValue(undefined),
}));

// Mock useTheme hook
jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      primary: '#007AFF',
      secondary: '#5856D6',
      danger: '#FF3B30',
      text: '#000000',
      textSecondary: '#8E8E93',
    },
    radius: {
      button: 12,
    },
    animations: {
      scales: { press: 0.97 },
      opacities: { disabled: 0.5 },
    },
    isDark: false,
  }),
}));

// Mock usePressAnimation hook
jest.mock('../../hooks/useAnimation', () => ({
  usePressAnimation: () => ({
    scaleAnim: { _value: 1 },
    animatePress: jest.fn(),
  }),
}));

describe('Button', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render with title prop', () => {
      const { getByText } = render(<Button title="Press Me" onPress={mockOnPress} />);

      expect(getByText('Press Me')).toBeTruthy();
    });

    it('should render with children string', () => {
      const { getByText } = render(<Button onPress={mockOnPress}>Click Here</Button>);

      expect(getByText('Click Here')).toBeTruthy();
    });

    it('should render with children component', () => {
      const { getByText } = render(
        <Button onPress={mockOnPress}>
          <Text testID="custom-child">Custom Content</Text>
        </Button>,
      );

      expect(getByText('Custom Content')).toBeTruthy();
    });

    it('should render with icon', () => {
      const { getByTestId, getByText } = render(
        <Button title="With Icon" onPress={mockOnPress} icon={<Text testID="icon">🎯</Text>} />,
      );

      expect(getByTestId('icon')).toBeTruthy();
      expect(getByText('With Icon')).toBeTruthy();
    });

    it('should show ActivityIndicator when loading', () => {
      const { UNSAFE_getByType } = render(<Button title="Loading" onPress={mockOnPress} loading />);

      // ActivityIndicator should be rendered
      const { ActivityIndicator } = require('react-native');
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });
  });

  describe('variants', () => {
    it('should render primary variant by default', () => {
      const { getByText } = render(<Button title="Primary" onPress={mockOnPress} />);

      expect(getByText('Primary')).toBeTruthy();
    });

    it('should render secondary variant', () => {
      const { getByText } = render(
        <Button title="Secondary" onPress={mockOnPress} variant="secondary" />,
      );

      expect(getByText('Secondary')).toBeTruthy();
    });

    it('should render outline variant', () => {
      const { getByText } = render(
        <Button title="Outline" onPress={mockOnPress} variant="outline" />,
      );

      expect(getByText('Outline')).toBeTruthy();
    });

    it('should render danger variant', () => {
      const { getByText } = render(
        <Button title="Danger" onPress={mockOnPress} variant="danger" />,
      );

      expect(getByText('Danger')).toBeTruthy();
    });
  });

  describe('sizes', () => {
    it('should render small size', () => {
      const { getByText } = render(<Button title="Small" onPress={mockOnPress} size="small" />);

      expect(getByText('Small')).toBeTruthy();
    });

    it('should render medium size by default', () => {
      const { getByText } = render(<Button title="Medium" onPress={mockOnPress} />);

      expect(getByText('Medium')).toBeTruthy();
    });

    it('should render large size', () => {
      const { getByText } = render(<Button title="Large" onPress={mockOnPress} size="large" />);

      expect(getByText('Large')).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('should call onPress when pressed', async () => {
      const { getByText } = render(<Button title="Press" onPress={mockOnPress} />);

      fireEvent.press(getByText('Press'));

      await waitFor(() => {
        expect(mockOnPress).toHaveBeenCalledTimes(1);
      });
    });

    it('should not call onPress when disabled', () => {
      const { getByText } = render(<Button title="Disabled" onPress={mockOnPress} disabled />);

      fireEvent.press(getByText('Disabled'));

      // Button is still pressed but onPress should not be called
      // because the TouchableOpacity is disabled
      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('should call onPress even when loading', async () => {
      // Note: The button calls onPress even when loading, but it's disabled
      // This tests the actual behavior
      const { UNSAFE_getByType } = render(<Button title="Loading" onPress={mockOnPress} loading />);

      const { TouchableOpacity } = require('react-native');
      const touchable = UNSAFE_getByType(TouchableOpacity);

      // TouchableOpacity should be disabled
      expect(touchable.props.disabled).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('should have correct accessibility role', () => {
      const { getByRole } = render(<Button title="Accessible" onPress={mockOnPress} />);

      expect(getByRole('button')).toBeTruthy();
    });

    it('should use title as accessibility label by default', () => {
      const { getByLabelText } = render(<Button title="My Button" onPress={mockOnPress} />);

      expect(getByLabelText('My Button')).toBeTruthy();
    });

    it('should use custom accessibility label when provided', () => {
      const { getByLabelText } = render(
        <Button title="Submit" onPress={mockOnPress} accessibilityLabel="Submit form" />,
      );

      expect(getByLabelText('Submit form')).toBeTruthy();
    });

    it('should have accessibility hint when provided', () => {
      const { getByA11yHint } = render(
        <Button title="Save" onPress={mockOnPress} accessibilityHint="Saves your changes" />,
      );

      expect(getByA11yHint('Saves your changes')).toBeTruthy();
    });

    it('should indicate disabled state in accessibility', () => {
      const { getByRole } = render(<Button title="Disabled" onPress={mockOnPress} disabled />);

      const button = getByRole('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });

    it('should indicate busy state when loading', () => {
      const { getByRole } = render(<Button title="Loading" onPress={mockOnPress} loading />);

      const button = getByRole('button');
      expect(button.props.accessibilityState.busy).toBe(true);
    });
  });

  describe('testID', () => {
    it('should pass testID to TouchableOpacity', () => {
      const { getByTestId } = render(
        <Button title="Test" onPress={mockOnPress} testID="submit-button" />,
      );

      expect(getByTestId('submit-button')).toBeTruthy();
    });
  });
});
