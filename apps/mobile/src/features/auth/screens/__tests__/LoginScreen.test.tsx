import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { LoginScreen } from "../LoginScreen.tsx";
import React from 'react';
import '@testing-library/jest-dom';

// --- Mocks ---

const mockSignIn = jest.fn();
const mockSignInAnonymously = jest.fn();

jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signInAnonymously: mockSignInAnonymously,
  }),
}));

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const React = require('react');
  const AnimatedView = React.forwardRef((props: Record<string, unknown>, ref: unknown) =>
    React.createElement(View, { ...props, ref }),
  );
  AnimatedView.displayName = 'AnimatedView';

  const chainable = (): Record<string, unknown> => {
    const obj: Record<string, (...args: unknown[]) => Record<string, unknown>> = {};
    const methods = [
      'duration', 'delay', 'springify', 'damping', 'mass', 'stiffness', 'build',
      'easing', 'withInitialValues', 'withCallback', 'randomDelay',
    ];
    for (const m of methods) {
      obj[m] = () => obj;
    }
    return obj;
  };
  const identity = (v: unknown): unknown => v;

  return {
    __esModule: true,
    default: {
      View: AnimatedView,
      createAnimatedComponent: (C: React.ComponentType) => C,
      Value: jest.fn(),
    },
    FadeIn: chainable(),
    FadeInUp: chainable(),
    FadeInDown: chainable(),
    FadeOut: chainable(),
    SlideInDown: chainable(),
    Layout: chainable(),
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    useReducedMotion: jest.fn(() => false),
    withTiming: jest.fn(identity),
    withSpring: jest.fn(identity),
    withSequence: jest.fn((...args: unknown[]) => args[0]),
    Easing: {
      bezier: jest.fn(() => identity),
      inOut: jest.fn(() => identity),
      out: jest.fn(() => identity),
      in: jest.fn(() => identity),
      cubic: identity,
      ease: identity,
      linear: identity,
      bounce: identity,
      elastic: jest.fn(() => identity),
    },
  };
});

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
  Feather: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
  MaterialIcons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

jest.mock('../../../../design-system/hooks/useThemedStyles', () => ({
  useThemedStyles: (factory: (ds: Record<string, unknown>) => Record<string, unknown>) => {
    const { StyleSheet } = require('react-native');
    const mockDs = {
      semantic: {
        surface: { app: '#000', card: '#111', overlay: '#222' },
        text: { primary: '#fff', secondary: '#aaa', tertiary: '#666', onPrimary: '#fff', onSecondary: '#000', onAlert: '#fff' },
        intent: {
          primary: { solid: '#0a0', muted: '#030' },
          secondary: { solid: '#333' },
          alert: { solid: '#f00', muted: '#300', subtle: '#200' },
        },
        layout: { screenPadding: 16 },
        typography: {
          screenTitle: { fontSize: 24, fontWeight: '700' },
          body: { fontSize: 16 },
          sectionLabel: { fontSize: 12 },
        },
      },
      space: { 2: 8, 3: 12, 4: 16, 10: 40 },
      radius: { xl: 16, lg: 12 },
      typography: { body: { fontSize: 16 }, caption: { fontSize: 12 } },
    };
    return StyleSheet.create(factory(mockDs as never));
  },
}));

jest.mock('../../../../design-system/DsProvider', () => ({
  useDs: () => ({
    semantic: {
      surface: { app: '#000', card: '#111', overlay: '#222' },
      text: { primary: '#fff', secondary: '#aaa', tertiary: '#666', onPrimary: '#fff', onSecondary: '#000', onAlert: '#fff' },
      intent: {
        primary: { solid: '#0a0', muted: '#030' },
        secondary: { solid: '#333' },
        alert: { solid: '#f00', muted: '#300', subtle: '#200' },
      },
      layout: { screenPadding: 16 },
      typography: {
        screenTitle: { fontSize: 24, fontWeight: '700' },
        body: { fontSize: 16 },
        sectionLabel: { fontSize: 12 },
      },
    },
    space: { 2: 8, 3: 12, 4: 16, 10: 40 },
    radius: { xl: 16, lg: 12, input: 8, button: 8 },
    typography: { body: { fontSize: 16 }, caption: { fontSize: 12 } },
  }),
}));

jest.mock('../../../../design-system/hooks/useTheme', () => ({
  useTheme: () => ({
    colors: { background: '#000', text: '#fff', primary: '#0a0', border: '#222', surface: '#111' },
    radius: { input: 8, button: 8, xl: 16 },
    animations: { scales: { press: 0.97 }, opacities: { disabled: 0.5 } },
  }),
}));

jest.mock('../../../../design-system/hooks/useAnimation', () => ({
  usePressAnimation: () => ({
    scaleAnim: { setValue: jest.fn(), interpolate: jest.fn() },
    animatePress: jest.fn(),
  }),
}));

jest.mock('../../../../utils/haptics', () => ({
  hapticImpact: jest.fn(() => Promise.resolve()),
  hapticLight: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../hooks/useKeyboardOffset', () => ({
  useKeyboardConfig: () => ({ behavior: 'padding' as const, keyboardVerticalOffset: 0 }),
  useKeyboardOffset: () => 0,
  useKeyboardBehavior: () => 'padding' as const,
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
  notificationAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: 'Success', Warning: 'Warning', Error: 'Error' },
  selectionAsync: jest.fn(() => Promise.resolve()),
}));

// --- Helpers ---

const mockNavigate = jest.fn();

function renderLoginScreen(): ReturnType<typeof render> {
  return render(
    <LoginScreen
      route={{ key: 'Login-key', name: 'Login', params: undefined } as never}
      navigation={{ navigate: mockNavigate } as never}
    />,
  );
}

// --- Tests ---

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders email input, password input, and login button', () => {
    renderLoginScreen();

    expect(screen.getByTestId('login-email-input')).toBeTruthy();
    expect(screen.getByTestId('login-password-input')).toBeTruthy();
    expect(screen.getByTestId('login-submit-button')).toBeTruthy();
  });

  it('renders the app brand header', () => {
    renderLoginScreen();

    expect(screen.getByText('Steps to Recovery')).toBeTruthy();
    expect(screen.getByText('Your journey continues here')).toBeTruthy();
  });

  it('shows validation error when email is empty', () => {
    renderLoginScreen();

    fireEvent.changeText(screen.getByTestId('login-password-input'), 'password123');
    fireEvent.press(screen.getByTestId('login-submit-button'));

    expect(screen.getByText('Email is required')).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('shows validation error when password is empty', () => {
    renderLoginScreen();

    fireEvent.changeText(screen.getByTestId('login-email-input'), 'user@example.com');
    fireEvent.press(screen.getByTestId('login-submit-button'));

    expect(screen.getByText('Password is required')).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('shows validation error for both empty fields', () => {
    renderLoginScreen();

    fireEvent.press(screen.getByTestId('login-submit-button'));

    expect(screen.getByText('Email is required')).toBeTruthy();
    expect(screen.getByText('Password is required')).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('shows validation error for invalid email format', () => {
    renderLoginScreen();

    fireEvent.changeText(screen.getByTestId('login-email-input'), 'not-an-email');
    fireEvent.changeText(screen.getByTestId('login-password-input'), 'password123');
    fireEvent.press(screen.getByTestId('login-submit-button'));

    expect(screen.getByText('Please enter a valid email')).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('shows validation error when password is too short', () => {
    renderLoginScreen();

    fireEvent.changeText(screen.getByTestId('login-email-input'), 'user@example.com');
    fireEvent.changeText(screen.getByTestId('login-password-input'), '12345');
    fireEvent.press(screen.getByTestId('login-submit-button'));

    expect(screen.getByText('Password must be at least 6 characters')).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('calls signIn with trimmed lowercase email on valid submit', async () => {
    mockSignIn.mockResolvedValue(undefined);
    renderLoginScreen();

    fireEvent.changeText(screen.getByTestId('login-email-input'), '  User@Example.COM  ');
    fireEvent.changeText(screen.getByTestId('login-password-input'), 'password123');
    fireEvent.press(screen.getByTestId('login-submit-button'));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('user@example.com', 'password123');
    });
  });

  it('shows form error on invalid credentials', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid login credentials'));
    renderLoginScreen();

    fireEvent.changeText(screen.getByTestId('login-email-input'), 'user@example.com');
    fireEvent.changeText(screen.getByTestId('login-password-input'), 'wrongpass');
    fireEvent.press(screen.getByTestId('login-submit-button'));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password.')).toBeTruthy();
    });
  });

  it('shows email-not-confirmed error message', async () => {
    mockSignIn.mockRejectedValue(new Error('Email not confirmed'));
    renderLoginScreen();

    fireEvent.changeText(screen.getByTestId('login-email-input'), 'user@example.com');
    fireEvent.changeText(screen.getByTestId('login-password-input'), 'password123');
    fireEvent.press(screen.getByTestId('login-submit-button'));

    await waitFor(() => {
      expect(
        screen.getByText('Please check your email and confirm your account first.'),
      ).toBeTruthy();
    });
  });

  it('navigates to SignUp screen', () => {
    renderLoginScreen();

    fireEvent.press(screen.getByLabelText('Navigate to sign up'));

    expect(mockNavigate).toHaveBeenCalledWith('SignUp');
  });

  it('navigates to ForgotPassword screen', () => {
    renderLoginScreen();

    fireEvent.press(screen.getByLabelText('Forgot password'));

    expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');
  });

  it('renders guest login button', () => {
    renderLoginScreen();

    expect(screen.getByTestId('login-guest-button')).toBeTruthy();
  });

  it('calls signInAnonymously for guest login', async () => {
    mockSignInAnonymously.mockResolvedValue(undefined);
    renderLoginScreen();

    fireEvent.press(screen.getByTestId('login-guest-button'));

    await waitFor(() => {
      expect(mockSignInAnonymously).toHaveBeenCalled();
    });
  });

  it('shows error when guest login fails', async () => {
    mockSignInAnonymously.mockRejectedValue(new Error('Network error'));
    renderLoginScreen();

    fireEvent.press(screen.getByTestId('login-guest-button'));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeTruthy();
    });
  });

  it('clears field validation error when user types', () => {
    renderLoginScreen();

    // Trigger validation errors
    fireEvent.press(screen.getByTestId('login-submit-button'));
    expect(screen.getByText('Email is required')).toBeTruthy();

    // Type in email field – error should clear
    fireEvent.changeText(screen.getByTestId('login-email-input'), 'a');

    expect(screen.queryByText('Email is required')).toBeNull();
  });

  describe('accessibility', () => {
    it('has accessible forgot-password link', () => {
      renderLoginScreen();

      const link = screen.getByLabelText('Forgot password');
      expect(link).toBeTruthy();
      expect(link.props.accessibilityRole).toBe('link');
    });

    it('has accessible sign-up link', () => {
      renderLoginScreen();

      const link = screen.getByLabelText('Navigate to sign up');
      expect(link).toBeTruthy();
      expect(link.props.accessibilityRole).toBe('link');
    });

    it('login button has button accessibility role', () => {
      renderLoginScreen();

      const btn = screen.getByTestId('login-submit-button');
      expect(btn.props.accessibilityRole).toBe('button');
    });
  });
});

function expect(_arg0: ReactTestInstance) {
  throw new Error('Function not implemented.');
}
