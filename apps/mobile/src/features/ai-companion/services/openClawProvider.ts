/**
 * OpenClaw Provider
 *
 * Uses OpenClaw's OpenAI-compatible /v1/chat/completions endpoint.
 * Each user gets an isolated persistent session via the `user` field.
 *
 * Configuration priority:
 *   1. Environment variables (EXPO_PUBLIC_OPENCLAW_URL, EXPO_PUBLIC_OPENCLAW_TOKEN)
 *   2. Secure storage (manual setup via settings)
 */

import { secureStorage } from '../../../adapters/secureStorage';
import { logger } from '../../../utils/logger';
import type { ChatMessage } from './aiService';

const OPENCLAW_URL_KEY = 'openclaw_gateway_url';
const OPENCLAW_TOKEN_KEY = 'openclaw_auth_token';

// Environment-based config (takes precedence — zero user setup)
// ⚠️ SECURITY: EXPO_PUBLIC_* vars are embedded in the JS bundle and extractable from APKs.
// NEVER ship production builds with EXPO_PUBLIC_OPENCLAW_TOKEN set.
// For production: use Supabase Edge Functions with per-user JWT auth instead.
// This env path exists ONLY for H's personal dev/admin use.
const ENV_URL = process.env.EXPO_PUBLIC_OPENCLAW_URL || '';
const ENV_TOKEN = process.env.EXPO_PUBLIC_OPENCLAW_TOKEN || '';

export interface OpenClawChatOptions {
  userId?: string;
  signal?: AbortSignal;
  maxTokens?: number;
  temperature?: number;
}

class OpenClawProvider {
  private gatewayUrl = '';
  private authToken = '';
  private configLoaded = false;

  /**
   * Resolve config: env vars take precedence, then secure storage.
   */
  private async resolveConfig(): Promise<{ url: string; token: string }> {
    if (ENV_URL && ENV_TOKEN) {
      this.gatewayUrl = ENV_URL;
      this.authToken = ENV_TOKEN;
      return { url: ENV_URL, token: ENV_TOKEN };
    }

    if (!this.configLoaded) {
      try {
        const url = await secureStorage.getItemAsync(OPENCLAW_URL_KEY);
        const token = await secureStorage.getItemAsync(OPENCLAW_TOKEN_KEY);
        if (url && token) {
          this.gatewayUrl = url;
          this.authToken = token;
        }
        this.configLoaded = true;
      } catch (error) {
        logger.error('Failed to load OpenClaw config', error);
      }
    }

    return { url: this.gatewayUrl, token: this.authToken };
  }

  /**
   * Check if OpenClaw is configured (env vars or secure storage).
   */
  async isConfigured(): Promise<boolean> {
    const { url, token } = await this.resolveConfig();
    return !!(url && token);
  }

  /**
   * Save config to secure storage (for settings UI).
   */
  async saveConfig(url: string, token: string): Promise<void> {
    await secureStorage.setItemAsync(OPENCLAW_URL_KEY, url);
    await secureStorage.setItemAsync(OPENCLAW_TOKEN_KEY, token);
    this.gatewayUrl = url;
    this.authToken = token;
    this.configLoaded = true;
  }

  /**
   * Clear saved config.
   */
  async clearConfig(): Promise<void> {
    await secureStorage.deleteItemAsync(OPENCLAW_URL_KEY);
    await secureStorage.deleteItemAsync(OPENCLAW_TOKEN_KEY);
    this.gatewayUrl = '';
    this.authToken = '';
    this.configLoaded = false;
  }

  /**
   * Stream chat via OpenClaw's OpenAI-compatible /v1/chat/completions endpoint.
   *
   * The `user` field gives each app user an isolated persistent session —
   * OpenClaw remembers their conversation history automatically.
   */
  async *chat(
    messages: ChatMessage[],
    options: OpenClawChatOptions = {},
  ): AsyncGenerator<string, void, unknown> {
    const { url, token } = await this.resolveConfig();
    if (!url || !token) throw new Error('OpenClaw not configured');

    // Combine user abort signal with a 20s connection timeout.
    // Timeout only covers the initial fetch — once streaming starts, it's cleared.
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(new Error('Connection timed out')),
      20_000,
    );

    // Forward external abort (user cancellation)
    const onExternalAbort = (): void => controller.abort(options.signal?.reason);
    if (options.signal) {
      options.signal.addEventListener('abort', onExternalAbort, { once: true });
    }

    let response: Response;
    try {
      response = await fetch(`${url}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: 'openclaw:companion',
          messages,
          stream: true,
          user: options.userId || undefined,
          max_tokens: options.maxTokens || 1024,
          temperature: options.temperature ?? 0.7,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      options.signal?.removeEventListener('abort', onExternalAbort);
      throw err;
    }

    // Connected — clear the connection timeout (streaming can take longer)
    clearTimeout(timeoutId);
    options.signal?.removeEventListener('abort', onExternalAbort);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      let errorMessage = `OpenClaw error ${response.status}`;
      try {
        const parsed = JSON.parse(errorBody);
        errorMessage = parsed.error?.message || parsed.message || errorMessage;
      } catch {
        if (errorBody) errorMessage += `: ${errorBody}`;
      }
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      // Non-streaming fallback
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      if (content) yield content;
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // Skip malformed SSE chunks
        }
      }
    }
  }

  /**
   * Test connectivity to the OpenClaw gateway.
   */
  async testConnection(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      const { url, token } = await this.resolveConfig();
      if (!url || !token) return { ok: false, latencyMs: 0, error: 'Not configured' };

      const response = await fetch(`${url}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: 'openclaw:companion',
          messages: [{ role: 'user', content: 'ping' }],
          stream: false,
          max_tokens: 5,
        }),
        signal: AbortSignal.timeout(15000),
      });

      return {
        ok: response.ok,
        latencyMs: Date.now() - start,
        error: response.ok ? undefined : `Status ${response.status}`,
      };
    } catch (error) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }
}

// Singleton
let instance: OpenClawProvider | null = null;

export function getOpenClawProvider(): OpenClawProvider {
  if (!instance) {
    instance = new OpenClawProvider();
  }
  return instance;
}
