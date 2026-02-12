/**
 * App Review Hook
 *
 * Prompts users to rate the app at appropriate milestones.
 * Follows Apple/Google guidelines:
 *  - Only prompt after meaningful positive events (milestone reached)
 *  - Maximum 3 prompts per 365-day period (iOS enforces this natively)
 *  - Don't prompt during crisis or negative experiences
 *
 * Uses expo-store-review which delegates to the native in-app review API
 * (SKStoreReviewController on iOS, Google Play In-App Review on Android).
 */

import { useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as StoreReview from 'expo-store-review';
import { logger } from '../utils/logger';
import { secureStorage } from '../adapters/secureStorage';

/** Milestones (in days) that trigger a review prompt */
const REVIEW_MILESTONES = [7, 30, 90, 365] as const;

/** Minimum time between prompts (30 days in milliseconds) */
const MIN_PROMPT_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;

/** SecureStore key for tracking last prompt timestamp */
const LAST_PROMPT_KEY = 'app_review_last_prompt';

/** SecureStore key for tracking total prompt count */
const PROMPT_COUNT_KEY = 'app_review_prompt_count';

/** Maximum prompts per year */
const MAX_PROMPTS_PER_YEAR = 3;

interface UseAppReviewReturn {
  /** Call when user reaches a clean time milestone */
  checkMilestoneReview: (dayCount: number) => Promise<void>;
  /** Check if review is available on this platform */
  isAvailable: () => Promise<boolean>;
}

export function useAppReview(): UseAppReviewReturn {
  const pendingRef = useRef(false);

  const isAvailable = useCallback(async (): Promise<boolean> => {
    try {
      return await StoreReview.isAvailableAsync();
    } catch {
      return false;
    }
  }, []);

  const checkMilestoneReview = useCallback(async (dayCount: number): Promise<void> => {
    // Only prompt on specific milestones
    if (!REVIEW_MILESTONES.includes(dayCount as (typeof REVIEW_MILESTONES)[number])) {
      return;
    }

    // Prevent concurrent prompts
    if (pendingRef.current) {
      return;
    }

    try {
      pendingRef.current = true;

      // Check if store review is available
      const available = await StoreReview.isAvailableAsync();
      if (!available) {
        logger.info('Store review not available on this platform');
        return;
      }

      // Check rate limiting
      const lastPromptStr = await secureStorage.getItemAsync(LAST_PROMPT_KEY);
      const promptCountStr = await secureStorage.getItemAsync(PROMPT_COUNT_KEY);
      const promptCount = promptCountStr ? parseInt(promptCountStr, 10) : 0;

      if (promptCount >= MAX_PROMPTS_PER_YEAR) {
        logger.info('Max review prompts reached for the year', { promptCount });
        return;
      }

      if (lastPromptStr) {
        const lastPrompt = parseInt(lastPromptStr, 10);
        const elapsed = Date.now() - lastPrompt;
        if (elapsed < MIN_PROMPT_INTERVAL_MS) {
          logger.info('Too soon since last review prompt', {
            elapsedDays: Math.floor(elapsed / (24 * 60 * 60 * 1000)),
          });
          return;
        }
      }

      // Request review
      await StoreReview.requestReview();

      // Track the prompt
      await secureStorage.setItemAsync(LAST_PROMPT_KEY, Date.now().toString());
      await secureStorage.setItemAsync(PROMPT_COUNT_KEY, (promptCount + 1).toString());

      logger.info('App review prompted', {
        dayCount,
        promptCount: promptCount + 1,
        platform: Platform.OS,
      });
    } catch (error) {
      logger.error('Failed to request app review', error);
    } finally {
      pendingRef.current = false;
    }
  }, []);

  return { checkMilestoneReview, isAvailable };
}
