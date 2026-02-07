/**
 * Text Component
 * Semantic text component that uses design system typography
 */

import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import type { TypographyStyle } from '../tokens/typography';

export interface TextProps extends RNTextProps {
  /**
   * Typography variant to use
   */
  variant?: TypographyStyle;
  /**
   * Text color from theme
   */
  color?: 'text' | 'textSecondary' | 'primary' | 'success' | 'warning' | 'danger';
  /**
   * Font weight
   */
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  /**
   * Text alignment
   */
  align?: 'left' | 'center' | 'right';
}

export function Text({
  variant = 'body',
  color = 'text',
  weight,
  align,
  style,
  children,
  ...props
}: TextProps): React.ReactElement {
  const theme = useTheme();

  const typographyStyle = theme.typography[variant];
  const textColor = theme.colors[color];

  const fontWeight: TextStyle['fontWeight'] | undefined = weight
    ? weight === 'normal'
      ? '400'
      : weight === 'medium'
        ? '500'
        : weight === 'semibold'
          ? '600'
          : '700'
    : undefined;

  const weightStyle: TextStyle | undefined = fontWeight ? { fontWeight } : undefined;

  const alignStyle = align ? { textAlign: align } : undefined;

  return (
    <RNText
      style={[typographyStyle, { color: textColor }, weightStyle, alignStyle, style]}
      {...props}
    >
      {children}
    </RNText>
  );
}
