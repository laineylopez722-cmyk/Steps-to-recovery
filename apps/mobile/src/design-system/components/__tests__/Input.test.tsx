import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../Input';

// Mock MaterialIcons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

// Mock useTheme hook
jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      surface: '#FFFFFF',
      border: '#E5E5EA',
      primary: '#007AFF',
      danger: '#FF3B30',
      text: '#000000',
      textSecondary: '#8E8E93',
    },
    radius: {
      input: 10,
    },
    typography: {
      label: { fontSize: 15, fontWeight: '500' },
      body: { fontSize: 17 },
      caption: { fontSize: 12 },
    },
  }),
}));

describe('Input', () => {
  const mockOnChangeText = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render with label', () => {
      const { getByText } = render(
        <Input label="Email" value="" onChangeText={mockOnChangeText} />,
      );

      expect(getByText('Email')).toBeTruthy();
    });

    it('should render with required indicator', () => {
      const { getByText } = render(
        <Input label="Email" value="" onChangeText={mockOnChangeText} required />,
      );

      expect(getByText('*')).toBeTruthy();
    });

    it('should display value', () => {
      const { getByDisplayValue } = render(
        <Input label="Email" value="test@example.com" onChangeText={mockOnChangeText} />,
      );

      expect(getByDisplayValue('test@example.com')).toBeTruthy();
    });

    it('should display placeholder', () => {
      const { getByPlaceholderText } = render(
        <Input
          label="Email"
          value=""
          onChangeText={mockOnChangeText}
          placeholder="Enter your email"
        />,
      );

      expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    });
  });

  describe('error states', () => {
    it('should display error message', () => {
      const { getByText } = render(
        <Input label="Email" value="" onChangeText={mockOnChangeText} error="Email is required" />,
      );

      expect(getByText('Email is required')).toBeTruthy();
    });

    it('should display hint when no error', () => {
      const { getByText, queryByText } = render(
        <Input
          label="Password"
          value=""
          onChangeText={mockOnChangeText}
          hint="Must be at least 8 characters"
        />,
      );

      expect(getByText('Must be at least 8 characters')).toBeTruthy();
      expect(queryByText('error')).toBeNull();
    });

    it('should show error instead of hint when both provided', () => {
      const { getByText, queryByText } = render(
        <Input
          label="Email"
          value=""
          onChangeText={mockOnChangeText}
          error="Invalid email"
          hint="Enter your email address"
        />,
      );

      expect(getByText('Invalid email')).toBeTruthy();
      expect(queryByText('Enter your email address')).toBeNull();
    });
  });

  describe('interactions', () => {
    it('should call onChangeText when text changes', () => {
      const { getByDisplayValue } = render(
        <Input label="Email" value="" onChangeText={mockOnChangeText} />,
      );

      // Note: We need to find the TextInput by placeholder since value is empty
      const input = getByDisplayValue('');
      fireEvent.changeText(input, 'new@email.com');

      expect(mockOnChangeText).toHaveBeenCalledWith('new@email.com');
    });
  });

  describe('password toggle', () => {
    it('should show password toggle button when secureTextEntry is provided', () => {
      const { getByLabelText } = render(
        <Input label="Password" value="secret" onChangeText={mockOnChangeText} secureTextEntry />,
      );

      // Initially should show "Show password" since password is hidden
      expect(getByLabelText('Show password')).toBeTruthy();
    });

    it('should toggle password visibility', () => {
      const { getByLabelText } = render(
        <Input label="Password" value="secret" onChangeText={mockOnChangeText} secureTextEntry />,
      );

      const toggleButton = getByLabelText('Show password');
      fireEvent.press(toggleButton);

      // After press, should show "Hide password"
      expect(getByLabelText('Hide password')).toBeTruthy();
    });
  });

  describe('focus states', () => {
    it('should handle focus event', () => {
      const mockOnFocus = jest.fn();
      const { getByDisplayValue } = render(
        <Input label="Email" value="test" onChangeText={mockOnChangeText} onFocus={mockOnFocus} />,
      );

      const input = getByDisplayValue('test');
      fireEvent(input, 'focus');

      expect(mockOnFocus).toHaveBeenCalled();
    });

    it('should handle blur event', () => {
      const mockOnBlur = jest.fn();
      const { getByDisplayValue } = render(
        <Input label="Email" value="test" onChangeText={mockOnChangeText} onBlur={mockOnBlur} />,
      );

      const input = getByDisplayValue('test');
      fireEvent(input, 'blur');

      expect(mockOnBlur).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have accessibility label on password toggle', () => {
      const { getByLabelText } = render(
        <Input label="Password" value="" onChangeText={mockOnChangeText} secureTextEntry />,
      );

      const toggle = getByLabelText('Show password');
      expect(toggle.props.accessibilityRole).toBe('button');
    });
  });

  describe('multiline', () => {
    it('should render as multiline when specified', () => {
      const { getByDisplayValue } = render(
        <Input
          label="Notes"
          value="Some notes"
          onChangeText={mockOnChangeText}
          multiline
          numberOfLines={4}
        />,
      );

      const input = getByDisplayValue('Some notes');
      expect(input.props.multiline).toBe(true);
    });
  });
});
