/**
 * Runtime theme feature flags scaffold.
 *
 * TODO(flags): replace env-driven values with remote config once available.
 * Remote config integration deferred to Phase 3+.
 */
export const runtimeThemeFlags = {
  runtimeThemeEnabled: process.env.EXPO_PUBLIC_ENABLE_RUNTIME_THEME === 'true',
} as const;
