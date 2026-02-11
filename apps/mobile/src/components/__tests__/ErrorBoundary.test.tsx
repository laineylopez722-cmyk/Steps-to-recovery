import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

jest.mock('../../design-system/context/ThemeContext', () => ({
  ThemeContext: {
    Consumer: ({ children }: { children: (value: null) => React.ReactNode }) => children(null),
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
}));

// Mock React.useContext to return null for ThemeContext (uses FALLBACK_COLORS)
const originalUseContext = React.useContext;
const useContextSpy = jest.spyOn(React, 'useContext').mockImplementation((context) => {
  if (context && (context as { Consumer?: unknown }).Consumer) {
    return null;
  }
  return originalUseContext(context);
});

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../lib/sentry', () => ({
  captureException: jest.fn(),
}));

import { ErrorBoundary } from '../ErrorBoundary';

(global as { __DEV__?: boolean }).__DEV__ = true;

interface ThrowingChildProps {
  shouldThrow: boolean;
}

function ThrowingChild({ shouldThrow }: ThrowingChildProps): React.ReactElement {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text>Normal content</Text>;
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  afterAll(() => {
    useContextSpy.mockRestore();
  });

  it('renders children when no error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(getByText('Normal content')).toBeTruthy();
  });

  it('renders fallback UI when a child throws', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(getByText('Something unexpected happened')).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('calls onReset when try again is pressed', () => {
    const onReset = jest.fn();

    const { getByText } = render(
      <ErrorBoundary onReset={onReset}>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    fireEvent.press(getByText('Try Again'));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('uses a custom fallback when provided', () => {
    const { getByText } = render(
      <ErrorBoundary
        fallback={
          <View>
            <Text>Custom fallback</Text>
          </View>
        }
      >
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(getByText('Custom fallback')).toBeTruthy();
  });
});
