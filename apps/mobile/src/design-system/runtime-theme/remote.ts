import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import type { UserRuntimeTheme } from './types';

/**
 * Supabase fetch hook stub for runtime themes.
 *
 * TODO(rollout):
 * - confirm table/view name and RLS policy
 * - formalize payload validation (zod)
 * - support ETag/version conflict handling
 */
export async function fetchRuntimeThemeFromSupabase(): Promise<UserRuntimeTheme | null> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    // Scaffold query; should remain fail-safe until backend ships.
    const { data, error } = await supabase
      .from('user_theme_preferences')
      .select('theme_payload')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      logger.warn('Runtime theme remote fetch unavailable; using cache/defaults', {
        message: error.message,
      });
      return null;
    }

    const payload = data?.theme_payload;
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    return payload as UserRuntimeTheme;
  } catch (error) {
    logger.warn('Runtime theme remote fetch failed; using cache/defaults', error);
    return null;
  }
}
