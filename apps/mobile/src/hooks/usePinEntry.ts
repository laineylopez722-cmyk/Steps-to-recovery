import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';

interface UsePinEntryProps {
  onSuccess: () => void;
  onFailure?: () => void;
  validator: (pin: string) => Promise<boolean>;
  requiredLength?: number;
}

export function usePinEntry({
  onSuccess,
  onFailure,
  validator,
  requiredLength = 4,
}: UsePinEntryProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const clear = useCallback(() => {
    setPin('');
    setError('');
  }, []);

  const handleBackspace = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPin((prev) => {
      const next = prev.slice(0, -1);
      if (next.length < prev.length) setError('');
      return next;
    });
  }, []);

  const handleDigit = useCallback(
    async (digit: string) => {
      if (pin.length >= requiredLength + 2) return; // Prevent excessive input

      const newPin = pin + digit;
      setPin(newPin);
      setError('');

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Auto-submit when required length is reached
      if (newPin.length === requiredLength) {
        setIsValidating(true);
        // Small delay for visual feedback of the last dot
        setTimeout(async () => {
          try {
            const success = await validator(newPin);
            if (success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onSuccess();
            } else {
              if (onFailure) onFailure();
              setError('Incorrect PIN'); // default error, can be overridden
              // Logic for shake or clear can be handled by the consumer via the effect of error or callback
            }
          } catch {
            setError('Error validating PIN');
          } finally {
            setIsValidating(false);
          }
        }, 100);
      }
    },
    [pin, requiredLength, validator, onSuccess, onFailure],
  );

  return {
    pin,
    error,
    setError,
    isValidating,
    handleDigit,
    handleBackspace,
    clear,
  };
}
