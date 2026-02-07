/**
 * React 19 + React Native 0.81 Type Compatibility Patch
 *
 * This file patches TypeScript types for React 19 compatibility with React Native 0.81.
 * Remove this file once React Native officially supports React 19 types.
 */

/// <reference types="react" />
/// <reference types="react-native" />

import type { ReactNode, Component, ReactElement, Ref } from 'react';
import type {
  ViewStyle,
  TextStyle,
  ImageStyle,
  ViewProps,
  TextProps,
  TouchableOpacityProps,
  PressableProps,
  ScrollViewProps,
  ModalProps,
  TextInputProps,
  KeyboardAvoidingViewProps,
  FlatListProps,
  ActivityIndicatorProps,
  SwitchProps,
  AlertButton,
  LinkingStatic,
  AppStateStatic,
  PlatformStatic,
  Dimensions,
  StyleProp,
  AccessibilityInfoStatic,
  StyleSheet,
} from 'react-native';

// ============================================================================
// JSX Element Types Patch for React 19
// ============================================================================
declare global {
  namespace JSX {
    interface ElementChildrenAttribute {
      children: {};
    }
  }
}

// ============================================================================
// React Native Component Type Patches
// ============================================================================
declare module 'react-native' {
  // Re-export all original types first
  export * from 'react-native/types';

  // Fix View component
  export const View: React.ComponentType<
    ViewProps & { children?: ReactNode; style?: StyleProp<ViewStyle> }
  >;

  // Fix Text component
  export const Text: React.ComponentType<
    TextProps & { children?: ReactNode; style?: StyleProp<TextStyle> }
  >;

  // Fix TouchableOpacity component
  export const TouchableOpacity: React.ComponentType<
    TouchableOpacityProps & { children?: ReactNode }
  >;

  // Fix Pressable component
  export const Pressable: React.ComponentType<PressableProps & { children?: ReactNode }>;

  // Fix ScrollView component
  export const ScrollView: React.ComponentType<ScrollViewProps & { children?: ReactNode }>;

  // Fix Modal component
  export const Modal: React.ComponentType<ModalProps & { children?: ReactNode }>;

  // Fix TextInput component
  export const TextInput: React.ComponentType<
    TextInputProps & {
      children?: ReactNode;
      className?: string;
      editable?: boolean;
      multiline?: boolean;
      numberOfLines?: number;
    }
  >;

  // Fix KeyboardAvoidingView component
  export const KeyboardAvoidingView: React.ComponentType<
    KeyboardAvoidingViewProps & { children?: ReactNode }
  >;

  // Fix ActivityIndicator component
  export const ActivityIndicator: React.ComponentType<
    ActivityIndicatorProps & { children?: ReactNode }
  >;

  // Fix Switch component
  export const Switch: React.ComponentType<SwitchProps & { children?: ReactNode }>;

  // Fix FlatList component
  export const FlatList: React.ComponentType<FlatListProps<any> & { children?: ReactNode }>;

  // Fix SectionList component
  export const SectionList: React.ComponentType<any>;

  // Fix SafeAreaView component
  export const SafeAreaView: React.ComponentType<ViewProps & { children?: ReactNode }>;

  // Fix Image component
  export const Image: React.ComponentType<any & { children?: ReactNode }>;

  // Fix Platform
  export const Platform: PlatformStatic;

  // Fix Linking
  export const Linking: LinkingStatic;

  // Fix AppState
  export const AppState: AppStateStatic;

  // Fix Dimensions
  export const Dimensions: typeof Dimensions;

  // Fix StyleSheet
  export const StyleSheet: typeof StyleSheet;

  // Fix Alert
  export const Alert: {
    alert: (title: string, message?: string, buttons?: AlertButton[], options?: any) => void;
  };

  // Fix AccessibilityInfo
  export const AccessibilityInfo: AccessibilityInfoStatic;

  // Fix StyleProp
  export type StyleProp<T> = StyleProp<T>;

  // Fix ViewStyle
  export interface ViewStyle {
    paddingHorizontal?: number;
  }

  // Fix TextStyle
  export interface TextStyle {
    fontSize?: number;
  }
}

// ============================================================================
// Expo Blur Type Patches
// ============================================================================
declare module 'expo-blur' {
  import { ViewStyle } from 'react-native';
  import { ReactNode } from 'react';

  interface BlurViewProps {
    children?: ReactNode;
    style?: ViewStyle | ViewStyle[];
    intensity?: number;
    tint?: 'light' | 'dark' | 'default';
    className?: string;
  }

  export class BlurView extends Component<BlurViewProps> {}
}

// ============================================================================
// Expo Linear Gradient Type Patches
// ============================================================================
declare module 'expo-linear-gradient' {
  import { ViewStyle } from 'react-native';
  import { ReactNode } from 'react';

  interface LinearGradientProps {
    children?: ReactNode;
    style?: ViewStyle | ViewStyle[];
    colors: string[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    locations?: number[];
    className?: string;
  }

  export class LinearGradient extends Component<LinearGradientProps> {}
}

// ============================================================================
// React Native Gesture Handler Type Patches
// ============================================================================
declare module 'react-native-gesture-handler' {
  import { ViewStyle } from 'react-native';
  import { ReactNode } from 'react';

  interface GestureHandlerRootViewProps {
    children?: ReactNode;
    style?: ViewStyle & { flex?: number };
  }

  export class GestureHandlerRootView extends Component<GestureHandlerRootViewProps> {}
}

// ============================================================================
// React Native Reanimated Type Patches
// ============================================================================
declare module 'react-native-reanimated' {
  import { ViewProps, TextProps, ViewStyle, TextStyle } from 'react-native';
  import { ReactNode, Component } from 'react';

  // Animated View
  export class AnimatedView extends Component<
    ViewProps & {
      children?: ReactNode;
      style?: any;
      entering?: any;
      exiting?: any;
      layout?: any;
      className?: string;
    }
  > {}

  // Animated Text
  export class AnimatedText extends Component<
    TextProps & {
      children?: ReactNode;
      style?: any;
      entering?: any;
      exiting?: any;
      layout?: any;
      className?: string;
    }
  > {}

  // Animated FlatList
  export class AnimatedFlatList extends Component<
    any & {
      children?: ReactNode;
      entering?: any;
      exiting?: any;
      layout?: any;
      disabled?: boolean;
      onPress?: () => void;
      accessibilityRole?: string;
      accessibilityLabel?: string;
      accessibilityState?: any;
      style?: any;
      className?: string;
      activeOpacity?: number;
    }
  > {}

  // Re-export animated components
  export const Animated: {
    View: typeof AnimatedView;
    Text: typeof AnimatedText;
    FlatList: typeof AnimatedFlatList;
    createAnimatedComponent: <T>(component: T) => T;
  };

  // Animation presets
  export const FadeIn: any;
  export const FadeInDown: any;
  export const FadeInUp: any;
  export const FadeInLeft: any;
  export const FadeInRight: any;
  export const FadeOut: any;
  export const LinearTransition: any;
}

// ============================================================================
// Custom Component Type Patches
// ============================================================================
declare module '*.tsx' {
  // GradientButton onPress patch
  interface GradientButtonProps {
    onPress?: () => void;
    title: string;
    variant?: 'primary' | 'secondary';
    fullWidth?: boolean;
    disabled?: boolean;
  }

  // GlassCard children patch
  interface GlassCardProps {
    children?: ReactNode;
    intensity?: 'light' | 'medium' | 'strong';
    className?: string;
  }
}

export {};
