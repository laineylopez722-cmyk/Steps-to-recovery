import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useDs } from '../DsProvider';
import type { DS } from '../tokens/ds';

/**
 * Responsive Typography Components
 *
 * Following Material Design 3 and ENHANCED design strategy.
 * Respects system font scaling by default.
 */

export interface TypographyProps extends RNTextProps {
  /** Text content */
  children?: React.ReactNode;
  /** Text color override */
  color?: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right' | 'justify';
  /** Custom styles */
  style?: TextStyle | TextStyle[];
  /** Whether to allow font scaling (default: true) */
  allowFontScaling?: boolean;
}

/**
 * Base Text component with theme support
 */
function BaseText({
  variant,
  color,
  align,
  weight,
  style,
  children,
  allowFontScaling = true,
  ...props
}: TypographyProps & { variant: keyof DS['typography']; weight?: 'regular' | 'medium' | 'semibold' | 'bold' }): React.ReactElement {
  const ds = useDs();
  const typographyStyle = ds.typography[variant] || ds.typography.body;
  
  const textColor = color || ds.semantic.text.primary;
  const textAlign = align ? { textAlign: align } : {};
  const fontWeight = weight ? { fontWeight: ds.fontWeight[weight] } : {};

  return (
    <RNText
      style={[typographyStyle, { color: textColor }, textAlign, fontWeight, style]}
      allowFontScaling={allowFontScaling}
      {...props}
    >
      {children}
    </RNText>
  );
}

// =============================================================================
// DISPLAY (Largest text)
// =============================================================================

export const DisplayLarge = (props: TypographyProps) => <BaseText variant="display" {...props} />;
export const DisplayMedium = (props: TypographyProps) => <BaseText variant="display" {...props} />; // Placeholder
export const DisplaySmall = (props: TypographyProps) => <BaseText variant="display" {...props} />; // Placeholder

// =============================================================================
// HEADLINE (Major sections)
// =============================================================================

export const HeadlineLarge = (props: TypographyProps) => <BaseText variant="h1" {...props} />;
export const HeadlineMedium = (props: TypographyProps) => <BaseText variant="h2" {...props} />;
export const HeadlineSmall = (props: TypographyProps) => <BaseText variant="h3" {...props} />;

// =============================================================================
// TITLE (Medium headers)
// =============================================================================

export const TitleLarge = (props: TypographyProps) => <BaseText variant="h3" {...props} />;
export const TitleMedium = (props: TypographyProps) => <BaseText variant="body" weight="semibold" {...props} />;
export const TitleSmall = (props: TypographyProps) => <BaseText variant="bodySm" weight="semibold" {...props} />;

// =============================================================================
// BODY (Main content)
// =============================================================================

export const BodyLarge = (props: TypographyProps) => <BaseText variant="body" {...props} />;
export const BodyMedium = (props: TypographyProps) => <BaseText variant="body" {...props} />;
export const BodySmall = (props: TypographyProps) => <BaseText variant="bodySm" {...props} />;

// =============================================================================
// LABEL (Buttons, caps)
// =============================================================================

export const LabelLarge = (props: TypographyProps) => <BaseText variant="body" weight="semibold" {...props} />;
export const LabelMedium = (props: TypographyProps) => <BaseText variant="caption" weight="semibold" {...props} />;
export const LabelSmall = (props: TypographyProps) => <BaseText variant="micro" weight="semibold" {...props} />;
