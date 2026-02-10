import { useTheme } from '../../../design-system';

export function useScreenBackgroundColor() {
  const theme = useTheme();
  return theme.colors.background;
}
