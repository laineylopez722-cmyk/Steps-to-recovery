/**
 * LegacyCard - Backward-compatible Card wrapper
 *
 * This component wraps the new shadcn Card with the old API for gradual migration.
 * Use the new Card/CardContent pattern for new code.
 *
 * @deprecated Use Card, CardContent, CardHeader from './card' for new code
 */

import * as React from 'react';
import { View, type ViewProps, Pressable, type PressableProps } from 'react-native';
import { cn } from '@/lib/utils';

type LegacyCardVariant =
  | 'default'
  | 'elevated'
  | 'interactive'
  | 'flat'
  | 'outlined'
  | 'glass'
  | 'glass-heavy';

interface LegacyCardProps extends ViewProps {
  variant?: LegacyCardVariant;
  onPress?: () => void;
  children?: React.ReactNode;
}

const variantStyles: Record<LegacyCardVariant, string> = {
  default: 'bg-card border-border border rounded-xl',
  elevated: 'bg-card border-border border rounded-xl shadow-lg shadow-black/10',
  interactive: 'bg-card border-border border rounded-xl active:scale-[0.98]',
  flat: 'bg-card/50 rounded-xl',
  outlined: 'border-border border rounded-xl bg-transparent',
  glass: 'bg-card/30 border-white/10 border rounded-xl',
  'glass-heavy': 'bg-card/50 border-white/10 border rounded-xl',
};

/**
 * @deprecated Use Card, CardContent from './card' for new code
 */
function LegacyCard({
  variant = 'default',
  onPress,
  className,
  children,
  ...props
}: LegacyCardProps): React.ReactElement {
  const baseClassName = cn(variantStyles[variant], 'p-4', className);

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={baseClassName}
        accessibilityRole="button"
        {...(props as PressableProps)}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={baseClassName} {...props}>
      {children}
    </View>
  );
}

export { LegacyCard };
export type { LegacyCardProps, LegacyCardVariant };
