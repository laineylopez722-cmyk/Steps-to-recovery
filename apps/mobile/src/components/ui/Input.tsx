import { cn } from '@/lib/utils';
import { Platform, TextInput, type TextInputProps } from 'react-native';

interface ExtendedInputProps extends TextInputProps {
  /** Accessible label describing the input purpose */
  accessibilityLabel?: string;
  /** Hint text explaining what the input accepts */
  accessibilityHint?: string;
  /** Whether the input has an error (for accessibility state) */
  'aria-invalid'?: boolean;
  /** Whether the field is required */
  required?: boolean;
}

function Input({
  className,
  accessibilityLabel,
  accessibilityHint,
  'aria-invalid': ariaInvalid,
  placeholder,
  required,
  editable,
  ...props
}: ExtendedInputProps & React.RefAttributes<TextInput>) {
  // Build accessibility label from placeholder if not provided
  const label = accessibilityLabel || placeholder || 'Text input';
  const hint = accessibilityHint || (required ? 'Required field' : undefined);

  return (
    <TextInput
      className={cn(
        'dark:bg-input/30 border-input bg-background text-foreground flex h-10 w-full min-w-0 flex-row items-center rounded-md border px-3 py-1 text-base leading-5 shadow-sm shadow-black/5 sm:h-9',
        editable === false &&
          cn(
            'opacity-50',
            Platform.select({ web: 'disabled:pointer-events-none disabled:cursor-not-allowed' }),
          ),
        Platform.select({
          web: cn(
            'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground outline-none transition-[color,box-shadow] md:text-sm',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          ),
          native: 'placeholder:text-muted-foreground/50',
        }),
        className,
      )}
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityRole="text"
      accessibilityState={{
        disabled: editable === false,
        selected: ariaInvalid === true,
      }}
      placeholder={placeholder}
      editable={editable}
      {...props}
    />
  );
}

export { Input };
export type { ExtendedInputProps as InputProps };
