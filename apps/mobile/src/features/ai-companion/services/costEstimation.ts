/**
 * Cost Estimation Service
 * Estimates token usage and cost before sending messages.
 */

import { mmkvStorage } from '../../../lib/mmkv';
import { logger } from '../../../utils/logger';

const DAILY_COST_KEY = 'ai_daily_cost';
const DAILY_COST_DATE_KEY = 'ai_daily_cost_date';
const COST_HISTORY_KEY = 'ai_cost_history';

export interface CostEstimate {
  inputTokens: number;
  estimatedOutputTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
  formattedCost: string;
  isExpensive: boolean; // > $0.01 per message
}

// Approximate pricing per 1M tokens (input/output)
const PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'o3-mini': { input: 1.1, output: 4.4 },
  'claude-3-5-sonnet-latest': { input: 3, output: 15 },
  'claude-3-5-haiku-latest': { input: 0.8, output: 4 },
  'claude-3-opus-latest': { input: 15, output: 75 },
};

const DEFAULT_PRICING = { input: 1.0, output: 3.0 };

/**
 * Rough token count estimation (~4 chars per token for English).
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Estimate cost for a chat request.
 */
export function estimateCost(
  contextText: string,
  model: string = 'gpt-4o-mini',
  expectedResponseTokens: number = 300,
): CostEstimate {
  const inputTokens = estimateTokenCount(contextText);
  const pricing = PRICING[model] || DEFAULT_PRICING;

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (expectedResponseTokens / 1_000_000) * pricing.output;
  const totalCost = inputCost + outputCost;

  const result: CostEstimate = {
    inputTokens,
    estimatedOutputTokens: expectedResponseTokens,
    totalTokens: inputTokens + expectedResponseTokens,
    estimatedCostUSD: totalCost,
    formattedCost: formatCost(totalCost),
    isExpensive: totalCost > 0.01,
  };

  logger.debug('Cost estimate', { model, inputTokens, cost: result.formattedCost });
  return result;
}

function formatCost(usd: number): string {
  if (usd < 0.001) return '<$0.001';
  if (usd < 0.01) return `~$${usd.toFixed(3)}`;
  return `~$${usd.toFixed(2)}`;
}

/**
 * Track cumulative session cost.
 */
let sessionCost = 0;

export function addToSessionCost(cost: number): void {
  sessionCost += cost;
}

export function getSessionCost(): number {
  return sessionCost;
}

export function resetSessionCost(): void {
  sessionCost = 0;
}

/**
 * Get today's date key for daily tracking.
 */
function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Add cost to today's daily total (persisted in MMKV).
 */
export async function addToDailyCost(cost: number): Promise<void> {
  try {
    const today = getTodayKey();
    const storedDate = mmkvStorage.getItem(DAILY_COST_DATE_KEY);

    if (storedDate !== today) {
      // Save previous day to history before resetting
      if (storedDate) {
        await saveCostToHistory(storedDate, await getDailyCost());
      }
      mmkvStorage.multiSet([
        [DAILY_COST_KEY, String(cost)],
        [DAILY_COST_DATE_KEY, today],
      ]);
      return;
    }

    const current = await getDailyCost();
    mmkvStorage.setItem(DAILY_COST_KEY, String(current + cost));
  } catch (err: unknown) {
    logger.warn('Failed to update daily cost', err);
  }
}

/**
 * Get today's total cost.
 */
export async function getDailyCost(): Promise<number> {
  try {
    const storedDate = mmkvStorage.getItem(DAILY_COST_DATE_KEY);
    const today = getTodayKey();

    if (storedDate !== today) {
      return 0;
    }

    const costStr = mmkvStorage.getItem(DAILY_COST_KEY);
    return costStr ? parseFloat(costStr) : 0;
  } catch (err: unknown) {
    logger.warn('Failed to load daily cost', err);
    return 0;
  }
}

export interface DailyCostEntry {
  date: string;
  cost: number;
}

/**
 * Save a day's cost into the 7-day rolling history.
 */
async function saveCostToHistory(date: string, cost: number): Promise<void> {
  try {
    const history = await getCostHistory();
    history.push({ date, cost });
    // Keep only last 7 days
    const trimmed = history.slice(-7);
    mmkvStorage.setItem(COST_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (err: unknown) {
    logger.warn('Failed to save cost history', err);
  }
}

/**
 * Get recent cost history (up to 7 days).
 */
export async function getCostHistory(): Promise<DailyCostEntry[]> {
  try {
    const stored = mmkvStorage.getItem(COST_HISTORY_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as DailyCostEntry[];
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err: unknown) {
    logger.warn('Failed to load cost history', err);
  }
  return [];
}
