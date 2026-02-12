/**
 * OpenClaw Provider
 * WebSocket + HTTP provider for self-hosted OpenClaw instances.
 * Optional — falls back to direct API if unavailable.
 */

import { secureStorage } from '../../../adapters/secureStorage';
import { logger } from '../../../utils/logger';
import type { ChatMessage, ChatOptions } from './aiService';

const OPENCLAW_URL_KEY = 'openclaw_gateway_url';
const OPENCLAW_TOKEN_KEY = 'openclaw_auth_token';

interface OpenClawConfig {
  gatewayUrl: string;
  authToken: string;
}

class OpenClawProvider {
  private config: OpenClawConfig | null = null;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async loadConfig(): Promise<OpenClawConfig | null> {
    try {
      const url = await secureStorage.getItemAsync(OPENCLAW_URL_KEY);
      const token = await secureStorage.getItemAsync(OPENCLAW_TOKEN_KEY);
      if (url && token) {
        this.config = { gatewayUrl: url, authToken: token };
        return this.config;
      }
    } catch (error) {
      logger.error('Failed to load OpenClaw config', error);
    }
    return null;
  }

  async saveConfig(url: string, token: string): Promise<void> {
    await secureStorage.setItemAsync(OPENCLAW_URL_KEY, url);
    await secureStorage.setItemAsync(OPENCLAW_TOKEN_KEY, token);
    this.config = { gatewayUrl: url, authToken: token };
  }

  async clearConfig(): Promise<void> {
    await secureStorage.deleteItemAsync(OPENCLAW_URL_KEY);
    await secureStorage.deleteItemAsync(OPENCLAW_TOKEN_KEY);
    this.config = null;
    this.disconnect();
  }

  async isConfigured(): Promise<boolean> {
    if (this.config) return true;
    const loaded = await this.loadConfig();
    return loaded !== null;
  }

  /**
   * Connect via WebSocket for real-time streaming.
   */
  private connect(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      if (!this.config) {
        reject(new Error('OpenClaw not configured'));
        return;
      }

      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve(this.ws);
        return;
      }

      const wsUrl = this.config.gatewayUrl.replace(/^http/, 'ws');
      const ws = new WebSocket(`${wsUrl}/ws`);

      ws.onopen = () => {
        this.reconnectAttempts = 0;
        // Authenticate
        ws.send(
          JSON.stringify({
            type: 'auth',
            token: this.config!.authToken,
          }),
        );
        this.ws = ws;
        logger.info('OpenClaw WebSocket connected');
        resolve(ws);
      };

      ws.onerror = (event) => {
        logger.error('OpenClaw WebSocket error', event);
        reject(new Error('WebSocket connection failed'));
      };

      ws.onclose = () => {
        this.ws = null;
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
          setTimeout(() => this.connect().catch(() => {}), delay);
        }
      };
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Chat via HTTP fallback (more reliable than WebSocket for mobile).
   */
  async chat(
    messages: ChatMessage[],
    options: ChatOptions & { onChunk?: (chunk: string) => void; signal?: AbortSignal } = {},
  ): Promise<string> {
    if (!this.config) {
      await this.loadConfig();
      if (!this.config) throw new Error('OpenClaw not configured');
    }

    const url = `${this.config.gatewayUrl}/api/agent`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.authToken}`,
        },
        body: JSON.stringify({
          messages,
          stream: true,
          max_tokens: options.maxTokens || 1024,
          temperature: options.temperature ?? 0.7,
        }),
        signal: options.signal,
      });

      if (!response.ok) {
        throw new Error(`OpenClaw API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        // Non-streaming fallback
        const data = await response.json();
        return data.content || data.message || '';
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';

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
            const content =
              parsed.choices?.[0]?.delta?.content || parsed.delta?.text || parsed.content || '';
            if (content) {
              fullResponse += content;
              options.onChunk?.(content);
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }

      return fullResponse;
    } catch (error) {
      logger.error('OpenClaw chat failed', error);
      throw error;
    }
  }

  /**
   * Test connectivity to the OpenClaw gateway.
   */
  async testConnection(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      if (!this.config) await this.loadConfig();
      if (!this.config) return { ok: false, latencyMs: 0, error: 'Not configured' };

      const response = await fetch(`${this.config.gatewayUrl}/api/health`, {
        headers: { Authorization: `Bearer ${this.config.authToken}` },
        signal: AbortSignal.timeout(10000),
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
