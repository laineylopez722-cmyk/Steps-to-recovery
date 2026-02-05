import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Keyboard,
  KeyboardEvent,
  Platform,
  EmitterSubscription,
} from 'react-native';

/**
 * Keyboard Hook
 * 
 * Provides comprehensive keyboard state management:
 * - Track keyboard visibility
 * - Get keyboard height
 * - Handle keyboard show/hide events
 * - Keyboard-aware scrolling helpers
 * - Dismiss keyboard utilities
 * 
 * Features:
 * - Cross-platform (iOS/Android)
 * - Animated keyboard height
 * - Keyboard duration for smooth animations
 * - Multiple keyboard event listeners
 * 
 * @example
 * ```tsx
 * const { 
 *   isVisible, 
 *   height, 
 *   dismiss,
 *   keyboardStyle 
 * } = useKeyboard();
 * 
 * // Adjust layout based on keyboard
 * <View style={{ paddingBottom: isVisible ? height : 0 }}>
 *   <TextInput />
 * </View>
 * ```
 */

export interface KeyboardState {
  /** Whether keyboard is currently visible */
  isVisible: boolean;
  /** Keyboard height in pixels */
  height: number;
  /** Screen coordinates of keyboard */
  screenY: number;
  /** Animation duration for keyboard transition (ms) */
  duration: number;
  /** Animation easing function */
  easing: string;
}

export interface UseKeyboardOptions {
  /** Callback when keyboard shows */
  onShow?: (event: KeyboardEvent) => void;
  /** Callback when keyboard hides */
  onHide?: (event: KeyboardEvent) => void;
  /** Callback when keyboard frame changes */
  onChange?: (event: KeyboardEvent) => void;
}

export function useKeyboard(options: UseKeyboardOptions = {}): KeyboardState & {
  dismiss: () => void;
} {
  const { onShow, onHide, onChange } = options;

  const [state, setState] = useState<KeyboardState>({
    isVisible: false,
    height: 0,
    screenY: 0,
    duration: 250,
    easing: 'easeInOut',
  });

  // Store latest state in ref for callbacks
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const subscriptions: EmitterSubscription[] = [];

    // Handle keyboard showing
    const handleKeyboardShow = (event: KeyboardEvent) => {
      const { endCoordinates } = event;
      
      setState({
        isVisible: true,
        height: endCoordinates.height,
        screenY: endCoordinates.screenY,
        duration: event.duration ?? 250,
        easing: event.easing ?? 'easeInOut',
      });

      onShow?.(event);
    };

    // Handle keyboard hiding
    const handleKeyboardHide = (event: KeyboardEvent) => {
      setState({
        isVisible: false,
        height: 0,
        screenY: event.endCoordinates?.screenY ?? 0,
        duration: event.duration ?? 250,
        easing: event.easing ?? 'easeInOut',
      });

      onHide?.(event);
    };

    // Handle keyboard frame changes (iOS)
    const handleKeyboardChange = (event: KeyboardEvent) => {
      const { endCoordinates } = event;
      
      setState((prev) => ({
        ...prev,
        height: endCoordinates.height,
        screenY: endCoordinates.screenY,
        duration: event.duration ?? prev.duration,
        easing: event.easing ?? prev.easing,
      }));

      onChange?.(event);
    };

    // Subscribe to keyboard events
    if (Platform.OS === 'ios') {
      subscriptions.push(
        Keyboard.addListener('keyboardWillShow', handleKeyboardShow),
        Keyboard.addListener('keyboardWillHide', handleKeyboardHide),
        Keyboard.addListener('keyboardWillChangeFrame', handleKeyboardChange),
      );
    } else {
      subscriptions.push(
        Keyboard.addListener('keyboardDidShow', handleKeyboardShow),
        Keyboard.addListener('keyboardDidHide', handleKeyboardHide),
      );
    }

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, [onShow, onHide, onChange]);

  // Dismiss keyboard utility
  const dismiss = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return {
    ...state,
    dismiss,
  };
}

/**
 * Hook to get keyboard height for layout calculations
 */
export function useKeyboardHeight(): number {
  const { height } = useKeyboard();
  return height;
}

/**
 * Hook to check if keyboard is visible
 */
export function useIsKeyboardVisible(): boolean {
  const { isVisible } = useKeyboard();
  return isVisible;
}

/**
 * Hook to dismiss keyboard when tapping outside input
 * Returns props to spread onto a view
 */
export function useDismissKeyboardOnTap(): {
  onStartShouldSetResponder: () => boolean;
  onResponderRelease: () => void;
} {
  const dismiss = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return {
    onStartShouldSetResponder: () => true,
    onResponderRelease: dismiss,
  };
}

/**
 * Hook to track focused input
 * Useful for scrolling to focused fields
 */
export function useFocusedInput(): {
  focusedInput: number | null;
  setFocusedInput: (id: number | null) => void;
  isInputFocused: (id: number) => boolean;
} {
  const [focusedInput, setFocusedInput] = useState<number | null>(null);

  const isInputFocused = useCallback(
    (id: number) => focusedInput === id,
    [focusedInput]
  );

  return {
    focusedInput,
    setFocusedInput,
    isInputFocused,
  };
}

/**
 * Hook to adjust scroll view content inset based on keyboard
 * Returns props to spread onto ScrollView
 */
export function useKeyboardAwareScroll(
  extraHeight: number = 0
): {
  keyboardDismissMode: 'interactive' | 'on-drag' | 'none';
  keyboardShouldPersistTaps: 'always' | 'never' | 'handled';
  contentInset: { bottom: number };
  onScroll: () => void;
} {
  const { height, isVisible, dismiss } = useKeyboard();

  return {
    keyboardDismissMode: 'interactive',
    keyboardShouldPersistTaps: 'handled',
    contentInset: {
      bottom: isVisible ? height + extraHeight : extraHeight,
    },
    onScroll: dismiss,
  };
}

/**
 * Hook to animate layout based on keyboard visibility
 * Returns animated style props
 */
export function useKeyboardAnimation(
  translateDistance: number = 100
): {
  transform: Array<{ translateY: number }>;
  opacity: number;
} {
  const { isVisible, duration } = useKeyboard();

  // Simple animation values
  // For more complex animations, use Animated API
  return {
    transform: [{ translateY: isVisible ? -translateDistance : 0 }],
    opacity: isVisible ? 0.8 : 1,
  };
}

/**
 * Hook to prevent keyboard from covering input fields
 * Calculates offset needed to keep input visible
 */
export function useAvoidKeyboard(
  inputRef: React.RefObject<{ measure: (callback: (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => void) => void }>,
  extraSpace: number = 20
): { avoidKeyboardStyle: { marginBottom: number } } {
  const { height, isVisible } = useKeyboard();
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.measure((x, y, width, elementHeight, pageX, pageY) => {
        const screenHeight = Platform.select({
          ios: 812, // Approximate iPhone X height
          android: 640,
          default: 640,
        });

        const inputBottom = pageY + elementHeight;
        const keyboardTop = screenHeight - height;

        if (inputBottom > keyboardTop) {
          setOffset(inputBottom - keyboardTop + extraSpace);
        }
      });
    } else {
      setOffset(0);
    }
  }, [isVisible, height, inputRef, extraSpace]);

  return {
    avoidKeyboardStyle: {
      marginBottom: offset,
    },
  };
}

/**
 * Hook to handle keyboard next/done buttons
 * Manages focus between multiple inputs
 */
export function useInputFocusNavigation(
  inputCount: number
): {
  focusNext: (currentIndex: number) => void;
  focusPrevious: (currentIndex: number) => void;
  isLastInput: (index: number) => boolean;
  onSubmitEditing: (index: number) => void;
} {
  const inputRefs = useRef<Array<{ focus: () => void; blur: () => void } | null>>([]);

  const focusNext = useCallback((currentIndex: number) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < inputCount) {
      inputRefs.current[nextIndex]?.focus();
    } else {
      // Last input - dismiss keyboard
      Keyboard.dismiss();
    }
  }, [inputCount]);

  const focusPrevious = useCallback((currentIndex: number) => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      inputRefs.current[prevIndex]?.focus();
    }
  }, []);

  const isLastInput = useCallback(
    (index: number) => index === inputCount - 1,
    [inputCount]
  );

  const onSubmitEditing = useCallback(
    (index: number) => {
      if (isLastInput(index)) {
        Keyboard.dismiss();
      } else {
        focusNext(index);
      }
    },
    [focusNext, isLastInput]
  );

  return {
    focusNext,
    focusPrevious,
    isLastInput,
    onSubmitEditing,
  };
}

export default useKeyboard;
