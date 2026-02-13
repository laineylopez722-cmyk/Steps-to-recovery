import { useDs } from '../../../design-system';

export function useScreenBackgroundColor() {
  const ds = useDs();
  return ds.semantic.surface.app;
}
