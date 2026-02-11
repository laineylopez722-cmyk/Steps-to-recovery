/**
 * Provider Health Check Service
 * Monitors provider connectivity and auto-switches on failure.
 */

import { logger } from '../../../utils/logger';
import { ds } from '../../../design-system/tokens/ds';
import { getAIService, type AIProvider } from './aiService';

export type HealthStatus = 'healthy' | 'degraded' | 'offline' | 'unknown';

export interface ProviderHealth {
  provider: AIProvider;
  status: HealthStatus;
  latencyMs: number | null;
  lastChecked: string;
  consecutiveFailures: number;
  errorMessage?: string;
}

const healthState: Map<AIProvider, ProviderHealth> = new Map();

/**
 * Ping a provider to check connectivity.
 */
export async function checkProviderHealth(provider: AIProvider): Promise<ProviderHealth> {
  const start = Date.now();

  try {
    const service = await getAIService();
    if (!service) {
      return updateHealth(provider, 'offline', null, 'AI service not initialized');
    }

    // Minimal test — send a tiny request
    const testMessages = [{ role: 'user' as const, content: 'ping' }];

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Health check timeout'));
      }, 10_000);

      (async (): Promise<void> => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          for await (const _chunk of service.chat(testMessages, {
            maxTokens: 5,
            temperature: 0,
          })) {
            clearTimeout(timeout);
            resolve();
            return;
          }
          clearTimeout(timeout);
          resolve();
        } catch (err: unknown) {
          clearTimeout(timeout);
          reject(err);
        }
      })();
    });

    const latency = Date.now() - start;
    const status: HealthStatus = latency > 5000 ? 'degraded' : 'healthy';

    return updateHealth(provider, status, latency);
  } catch (error) {
    const latency = Date.now() - start;
    const message = error instanceof Error ? error.message : 'Unknown error';
    return updateHealth(provider, 'offline', latency, message);
  }
}

function updateHealth(
  provider: AIProvider,
  status: HealthStatus,
  latencyMs: number | null,
  errorMessage?: string,
): ProviderHealth {
  const prev = healthState.get(provider);
  const consecutiveFailures = status === 'offline' ? (prev?.consecutiveFailures ?? 0) + 1 : 0;

  const health: ProviderHealth = {
    provider,
    status,
    latencyMs,
    lastChecked: new Date().toISOString(),
    consecutiveFailures,
    errorMessage,
  };

  healthState.set(provider, health);
  logger.info('Provider health check', { provider, status, latencyMs });

  return health;
}

/**
 * Get cached health status.
 */
export function getProviderHealth(provider: AIProvider): ProviderHealth | undefined {
  return healthState.get(provider);
}

/**
 * Get status indicator color.
 */
export function getStatusColor(status: HealthStatus): string {
  switch (status) {
    case 'healthy':
      return ds.colors.success;
    case 'degraded':
      return ds.colors.accent;
    case 'offline':
      return ds.colors.error;
    default:
      return ds.colors.textQuaternary;
  }
}

/**
 * Get status display text.
 */
export function getStatusLabel(status: HealthStatus): string {
  switch (status) {
    case 'healthy':
      return 'Connected';
    case 'degraded':
      return 'Slow';
    case 'offline':
      return 'Offline';
    default:
      return 'Unknown';
  }
}
