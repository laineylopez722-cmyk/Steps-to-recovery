import { logger } from '@/utils/logger';
import { runtimeThemeFlags } from './flags';
import { fetchRuntimeThemeFromSupabase } from './remote';
import { secureRuntimeThemeCache } from './cache';
import {
  RUNTIME_THEME_SCHEMA_VERSION,
  type ResolvedRuntimeTheme,
  type RuntimeThemeResolverOptions,
  type UserRuntimeTheme,
} from './types';

function isValidRuntimeTheme(payload: UserRuntimeTheme | null): payload is UserRuntimeTheme {
  if (!payload) return false;
  return payload.schemaVersion === RUNTIME_THEME_SCHEMA_VERSION;
}

function applyRuntimeOverrides(
  baseColors: RuntimeThemeResolverOptions['defaultColors'],
  isDark: boolean,
  payload: UserRuntimeTheme,
): RuntimeThemeResolverOptions['defaultColors'] {
  const modeOverrides = isDark ? payload.overrides?.dark : payload.overrides?.light;
  if (!modeOverrides) return baseColors;

  return {
    ...baseColors,
    ...modeOverrides,
  };
}

/**
 * Resolver order:
 * 1) remote (Supabase)
 * 2) local secure cache
 * 3) static defaults
 */
export async function resolveRuntimeTheme(
  options: RuntimeThemeResolverOptions,
): Promise<ResolvedRuntimeTheme> {
  const { defaultColors, isDark } = options;
  const runtimeThemeEnabled = options.runtimeThemeEnabled ?? runtimeThemeFlags.runtimeThemeEnabled;

  if (!runtimeThemeEnabled) {
    return {
      isDark,
      colors: defaultColors,
      source: 'defaults',
    };
  }

  const remote = await fetchRuntimeThemeFromSupabase();
  if (isValidRuntimeTheme(remote)) {
    await secureRuntimeThemeCache.set(remote);
    return {
      isDark,
      colors: applyRuntimeOverrides(defaultColors, isDark, remote),
      source: 'remote',
    };
  }

  const cached = await secureRuntimeThemeCache.get();
  if (isValidRuntimeTheme(cached)) {
    return {
      isDark,
      colors: applyRuntimeOverrides(defaultColors, isDark, cached),
      source: 'cache',
    };
  }

  logger.debug('Runtime theme resolver fell back to defaults');
  return {
    isDark,
    colors: defaultColors,
    source: 'defaults',
  };
}
