import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import * as CheckboxPrimitive from '@rn-primitives/checkbox';
import { Check } from 'lucide-react-native';
import { Platform } from 'react-native';

const DEFAULT_HIT_SLOP = 24;

interface CheckboxProps extends CheckboxPrimitive.RootProps {
  /** Accessible label describing what the checkbox controls */
  accessibilityLabel?: string;
  /** Hint text explaining the checkbox action */
  accessibilityHint?: string;
  checkedClassName?: string;
  indicatorClassName?: string;
  iconClassName?: string;
}

function Checkbox({
  className,
  checkedClassName,
  indicatorClassName,
  iconClassName,
  accessibilityLabel,
  accessibilityHint,
  ...props
}: CheckboxProps & React.RefAttributes<CheckboxPrimitive.RootRef>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'border-input dark:bg-input/30 size-4 shrink-0 rounded-[4px] border shadow-sm shadow-black/5',
        Platform.select({
          web: 'focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive peer cursor-default outline-none transition-shadow focus-visible:ring-[3px] disabled:cursor-not-allowed',
          native: 'overflow-hidden',
        }),
        props.checked && cn('border-primary', checkedClassName),
        props.disabled && 'opacity-50',
        className,
      )}
      hitSlop={DEFAULT_HIT_SLOP}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        checked: props.checked,
        disabled: props.disabled,
      }}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn('bg-primary h-full w-full items-center justify-center', indicatorClassName)}
      >
        <Icon
          as={Check}
          size={12}
          strokeWidth={Platform.OS === 'web' ? 2.5 : 3.5}
          className={cn('text-primary-foreground', iconClassName)}
          accessibilityElementsHidden
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
export type { CheckboxProps };
