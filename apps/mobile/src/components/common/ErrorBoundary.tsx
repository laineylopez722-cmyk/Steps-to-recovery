/**
 * Error Boundary Component
 * Dark navy themed error handling with graceful fallback UI
 * Phase 4: Production polish
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { logger } from '../../utils/logger';
import { ds } from '../../design-system/tokens/ds';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error for debugging (in production, send to crash reporting service)
    logger.error('ErrorBoundary caught an error', { error, errorInfo });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI - Dark Navy Theme
      return (
        <SafeAreaView className="flex-1 bg-navy-950">
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          >
            <View className="items-center">
              {/* Error Icon */}
              <View className="w-20 h-20 rounded-full bg-amber-500/20 items-center justify-center mb-6">
                <Feather name="alert-triangle" size={40} color={ds.colors.warning} />
              </View>

              {/* Error Message */}
              <Text
                className="text-2xl font-bold text-white text-center mb-2"
                accessibilityRole="header"
              >
                Something went wrong
              </Text>
              <Text className="text-surface-400 text-center mb-8 px-4">
                Don't worry — your data is safe. This is just a temporary hiccup.
              </Text>

              {/* Supportive message */}
              <View className="bg-primary-500/10 rounded-xl p-4 mb-8 w-full border border-primary-500/20">
                <Text className="text-primary-300 text-center">
                  💚 Your recovery journey matters. Take a deep breath, and let's try again.
                </Text>
              </View>

              {/* Retry Button */}
              <TouchableOpacity
                onPress={this.handleRetry}
                className="bg-primary-500 rounded-xl px-8 py-4 mb-4 flex-row items-center gap-2"
                accessibilityRole="button"
                accessibilityLabel="Try again"
              >
                <Feather name="refresh-cw" size={20} color={ds.semantic.text.onDark} />
                <Text className="text-white font-semibold text-lg">Try Again</Text>
              </TouchableOpacity>

              {/* Emergency Access */}
              <Text className="text-surface-500 text-center text-sm mt-6 px-8">
                If you need immediate support, remember you can always reach out:
              </Text>
              <View className="mt-4 p-4 border border-danger-500/30 rounded-xl w-full bg-danger-500/10">
                <Text className="text-danger-400 text-center font-semibold">
                  🆘 Crisis Hotline: 988
                </Text>
                <Text className="text-surface-500 text-center text-sm mt-1">
                  Suicide & Crisis Lifeline (US)
                </Text>
              </View>
            </View>

            {/* Debug info (only in development) */}
            {__DEV__ && this.state.error && (
              <View className="mt-8 p-4 bg-navy-800/50 rounded-xl border border-surface-700/30">
                <Text className="text-surface-500 text-xs font-mono mb-2">Debug Info:</Text>
                <Text className="text-danger-400 text-xs font-mono">
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo?.componentStack && (
                  <Text className="text-surface-500 text-xs font-mono mt-2">
                    {this.state.errorInfo.componentStack.slice(0, 500)}...
                  </Text>
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

/**
 * Lightweight error fallback for specific sections
 */
export function SectionErrorFallback({
  onRetry,
  message = "This section couldn't load",
}: {
  onRetry?: () => void;
  message?: string;
}) {
  return (
    <View className="p-4 bg-amber-500/10 rounded-xl items-center border border-amber-500/20">
      <Feather name="alert-circle" size={24} color="#fbbf24" />
      <Text className="text-amber-300 text-center mt-2 mb-3">{message}</Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          className="px-4 py-2 bg-amber-500/20 rounded-lg"
          accessibilityRole="button"
          accessibilityLabel="Retry loading"
        >
          <Text className="text-amber-300 font-medium">Tap to retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
