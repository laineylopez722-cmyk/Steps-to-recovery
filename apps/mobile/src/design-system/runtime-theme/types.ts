import type { ColorPalette } from '../tokens/colors';

export const RUNTIME_THEME_SCHEMA_VERSION = 1 as const;

export type ThemeModePreference = 'system' | 'light' | 'dark';

export type RuntimeThemeColorOverrides = Partial<ColorPalette>;

export interface RuntimeThemeOverrides {
  light?: RuntimeThemeColorOverrides;
  dark?: RuntimeThemeColorOverrides;
}

/**
 * Lightweight user theme payload scaffold.
 *
 * NOTE: this is intentionally minimal for rollout safety.
 * TODO(rollout): expand shape once backend contract is finalized.
 */
export interface UserRuntimeTheme {
  schemaVersion: number;
  updatedAt: string;
  mode?: ThemeModePreference;
  overrides?: RuntimeThemeOverrides;
}

export interface ResolvedRuntimeTheme {
  isDark: boolean;
  colors: ColorPalette;
  source: 'remote' | 'cache' | 'defaults';
}

export interface RuntimeThemeResolverOptions {
  defaultColors: ColorPalette;
  isDark: boolean;
  /**
   * TODO(flags): wire to remote config / experiment assignment.
   */
  runtimeThemeEnabled?: boolean;
}
