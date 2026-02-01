import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '../ErrorBoundary';

// Define __DEV__ for test environment (React Native global)
(global as any).__DEV__ = true;

// Mock logger to prevent console noise during tests
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

// Component that throws during render
function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <></>;
}

describe('ErrorBoundary', () => {
  // Suppress React error boundary console.error noise during tests
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should render children when no error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={false} />
      </ErrorBoundary>,
    );

    // The boundary should render children normally (no fallback UI)
    expect(() => getByText('Something went wrong')).toThrow();
  });

  it('should render fallback UI when an error is thrown', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText(/We're sorry/)).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('should call onReset when "Try Again" is pressed and prop is provided', () => {
    const mockOnReset = jest.fn();

    const { getByText } = render(
      <ErrorBoundary onReset={mockOnReset}>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    fireEvent.press(getByText('Try Again'));

    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });

  it('should reset internal state when "Try Again" is pressed without onReset prop', () => {
    // Use a ref-like pattern: the component checks a mutable value
    let shouldThrow = true;
    function ConditionalThrower() {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <></>;
    }

    const { getByText, queryByText, rerender } = render(
      <ErrorBoundary>
        <ConditionalThrower />
      </ErrorBoundary>,
    );

    expect(getByText('Something went wrong')).toBeTruthy();

    // Stop throwing before pressing reset
    shouldThrow = false;

    // Press try again - this resets internal state and re-renders children
    fireEvent.press(getByText('Try Again'));

    // Need to trigger a rerender for the component to update
    rerender(
      <ErrorBoundary>
        <ConditionalThrower />
      </ErrorBoundary>,
    );

    // Fallback should no longer be shown
    expect(queryByText('Something went wrong')).toBeNull();
  });

  it('should display error type in dev mode but hide sensitive details', () => {
    // __DEV__ is true in test environment
    // Error messages are hidden for security - only error type is shown
    const { getByText, queryByText } = render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    // Should show generic security message, not actual error details
    expect(getByText(/message hidden for security/)).toBeTruthy();
    // Actual error message "Test error" should NOT be visible
    expect(queryByText('Test error')).toBeNull();
  });
});
