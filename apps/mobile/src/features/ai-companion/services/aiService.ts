/**
 * AI Service
 * Abstraction layer for AI providers (OpenAI, Anthropic).
 * Supports streaming responses and proxy mode for free tier.
 */

import { secureStorage } from '../../../adapters/secureStorage';
import { supabase } from '../../../lib/supabase';
import * as Sentry from '@sentry/react-native';

const API_KEY_STORAGE_KEY = 'ai_companion_api_key';
const PROVIDER_STORAGE_KEY = 'ai_companion_provider';

// Set to true once the Edge Function is deployed
const PROXY_ENABLED = false;
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export type AIProvider = 'openai' | 'anthropic' | 'openrouter' | 'openclaw';

interface ProviderConfig {
  apiUrl: string;
  defaultModel: string;
  formatRequest: (messages: ChatMessage[], options: ChatOptions) => object;
  parseStreamChunk: (chunk: string) => string | null;
}

const PROVIDER_CONFIGS: Record<Exclude<AIProvider, 'openclaw'>, ProviderConfig> = {
  openai: {
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
    formatRequest: (messages, options) => ({
      model: options.model || 'gpt-4o-mini',
      messages,
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature ?? 0.7,
      stream: options.stream ?? true,
    }),
    parseStreamChunk: (chunk: string): string | null => {
      if (chunk.startsWith('data: ')) {
        const data = chunk.slice(6).trim();
        if (data === '[DONE]') return null;
        try {
          const parsed = JSON.parse(data);
          return parsed.choices?.[0]?.delta?.content || null;
        } catch {
          return null;
        }
      }
      return null;
    },
  },
  anthropic: {
    apiUrl: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-3-5-sonnet-20241022',
    formatRequest: (messages, options) => {
      const systemMessage = messages.find((m) => m.role === 'system');
      const nonSystemMessages = messages.filter((m) => m.role !== 'system');

      return {
        model: options.model || 'claude-3-5-sonnet-20241022',
        max_tokens: options.maxTokens || 1024,
        system: systemMessage?.content,
        messages: nonSystemMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        stream: options.stream ?? true,
      };
    },
    parseStreamChunk: (chunk: string): string | null => {
      if (chunk.startsWith('data: ')) {
        const data = chunk.slice(6).trim();
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta') {
            return parsed.delta?.text || null;
          }
        } catch {
          return null;
        }
      }
      return null;
    },
  },
  openrouter: {
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'meta-llama/llama-3.1-8b-instruct:free',
    formatRequest: (messages, options) => ({
      model: options.model || 'meta-llama/llama-3.1-8b-instruct:free',
      messages,
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature ?? 0.7,
      stream: options.stream ?? true,
    }),
    parseStreamChunk: (chunk: string): string | null => {
      // OpenRouter uses OpenAI-compatible SSE format
      if (chunk.startsWith('data: ')) {
        const data = chunk.slice(6).trim();
        if (data === '[DONE]') return null;
        try {
          const parsed = JSON.parse(data);
          return parsed.choices?.[0]?.delta?.content || null;
        } catch {
          return null;
        }
      }
      return null;
    },
  },
};

/**
 * Detect provider from API key prefix
 */
function detectProvider(apiKey: string): AIProvider {
  if (apiKey.startsWith('sk-ant-')) {
    return 'anthropic';
  }
  if (apiKey.startsWith('sk-or-')) {
    return 'openrouter';
  }
  // Default to OpenAI for sk-* keys
  return 'openai';
}

/**
 * Create AI service instance
 */
export async function createAIService(): Promise<AIServiceInstance> {
  const apiKey = await secureStorage.getItemAsync(API_KEY_STORAGE_KEY);
  const storedProvider = await secureStorage.getItemAsync(PROVIDER_STORAGE_KEY);

  return new AIServiceInstance(
    apiKey,
    (storedProvider as AIProvider) || (apiKey ? detectProvider(apiKey) : 'openai'),
  );
}

/**
 * Get singleton AI service instance
 */
let serviceInstance: AIServiceInstance | null = null;

export async function getAIService(): Promise<AIServiceInstance> {
  if (!serviceInstance) {
    serviceInstance = await createAIService();
  }
  return serviceInstance;
}

/**
 * AI Service Instance
 */
export class AIServiceInstance {
  private apiKey: string | null;
  private provider: AIProvider;

  constructor(apiKey: string | null, provider: AIProvider) {
    this.apiKey = apiKey;
    this.provider = provider;
  }

  /**
   * Check if the service is configured (has API key or proxy is available)
   */
  async isConfigured(): Promise<boolean> {
    if (this.apiKey) return true;

    // Recheck storage in case it was set elsewhere
    const key = await secureStorage.getItemAsync(API_KEY_STORAGE_KEY);
    if (key) {
      this.apiKey = key;
      this.provider = detectProvider(key);
      return true;
    }

    // Check if OpenClaw provider is configured
    if (this.provider === 'openclaw') {
      const { getOpenClawProvider } = await import('./openClawProvider');
      const clawProvider = getOpenClawProvider();
      return clawProvider.isConfigured();
    }

    // Check if proxy mode is enabled and user is authenticated
    if (PROXY_ENABLED) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) return true;
    }

    return false;
  }

  /**
   * Check if using proxy mode (no API key, using Edge Function)
   */
  async isUsingProxy(): Promise<boolean> {
    return PROXY_ENABLED && !this.apiKey;
  }

  /**
   * Set the API key
   */
  async setApiKey(key: string, provider?: AIProvider): Promise<void> {
    await secureStorage.setItemAsync(API_KEY_STORAGE_KEY, key);

    const detectedProvider = provider || detectProvider(key);
    await secureStorage.setItemAsync(PROVIDER_STORAGE_KEY, detectedProvider);

    this.apiKey = key;
    this.provider = detectedProvider;

    // Reset singleton to pick up new key
    serviceInstance = null;
  }

  /**
   * Clear the API key
   */
  async clearApiKey(): Promise<void> {
    await secureStorage.deleteItemAsync(API_KEY_STORAGE_KEY);
    await secureStorage.deleteItemAsync(PROVIDER_STORAGE_KEY);
    this.apiKey = null;
    serviceInstance = null;
  }

  /**
   * Get current provider
   */
  getProvider(): AIProvider {
    return this.provider;
  }

  /**
   * Get the default model name for the current provider
   */
  getModel(): string {
    if (this.provider === 'openclaw') return 'openclaw';
    return PROVIDER_CONFIGS[this.provider]?.defaultModel || 'unknown';
  }

  /**
   * Stream chat completion via proxy (for free tier)
   */
  private async *chatViaProxy(
    messages: ChatMessage[],
    options: ChatOptions = {},
  ): AsyncGenerator<string, void, unknown> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Please sign in to use the AI companion.');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        messages,
        stream: options.stream ?? true,
        model: options.model,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      if (errorBody.error === 'daily_limit_reached') {
        throw new Error(errorBody.message || 'Daily message limit reached. Try again tomorrow.');
      }
      throw new Error(errorBody.message || `Proxy error: ${response.status}`);
    }

    // Stream response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
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
          // Skip malformed chunks
        }
      }
    }
  }

  /**
   * Stream chat completion
   */
  async *chat(
    messages: ChatMessage[],
    options: ChatOptions = {},
  ): AsyncGenerator<string, void, unknown> {
    const model = options.model || this.getModel();

    const span = Sentry.startInactiveSpan({
      op: 'gen_ai.request',
      name: `chat ${model}`,
    });
    span?.setAttribute('gen_ai.request.model', model);
    span?.setAttribute('gen_ai.system', this.provider);

    try {
      // Use proxy if no API key and proxy is enabled
      if (!this.apiKey && PROXY_ENABLED) {
        yield* this.chatViaProxy(messages, options);
        span?.end();
        return;
      }

      // OpenClaw provider — delegate to dedicated provider
      if (this.provider === 'openclaw') {
        const { getOpenClawProvider } = await import('./openClawProvider');
        const clawProvider = getOpenClawProvider();
        let result = '';
        await clawProvider.chat(messages, {
          ...options,
          onChunk: (chunk: string) => {
            result += chunk;
          },
        });
        yield result;
        span?.end();
        return;
      }

      if (!this.apiKey) {
        throw new Error('AI service not configured. Please set an API key.');
      }

      const config = PROVIDER_CONFIGS[this.provider];
      if (!config) {
        throw new Error(`Unknown provider: ${this.provider}`);
      }
      const streamEnabled = options.stream ?? true;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Set provider-specific auth headers
      if (this.provider === 'anthropic') {
        headers['x-api-key'] = this.apiKey;
        headers['anthropic-version'] = '2023-06-01';
      } else {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const requestBody = config.formatRequest(messages, {
        ...options,
        stream: streamEnabled,
      });

      try {
        const response = await fetch(config.apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          let errorMessage = `API error: ${response.status}`;
          try {
            const parsed = JSON.parse(errorBody);
            errorMessage = parsed.error?.message || parsed.message || errorMessage;
          } catch {
            // Use status-based message
          }
          throw new Error(errorMessage);
        }

        if (!streamEnabled) {
          // Non-streaming response
          const data = await response.json();
          // Capture token usage from non-streaming response
          if (data.usage) {
            span?.setAttribute('gen_ai.usage.input_tokens', data.usage.prompt_tokens ?? 0);
            span?.setAttribute('gen_ai.usage.output_tokens', data.usage.completion_tokens ?? 0);
          }
          if (this.provider === 'anthropic') {
            yield data.content?.[0]?.text || '';
          } else {
            yield data.choices?.[0]?.message?.content || '';
          }
          span?.end();
          return;
        }

        // Streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body is not readable');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            const content = config.parseStreamChunk(trimmed);
            if (content) {
              yield content;
            }
          }
        }

        // Process any remaining buffer
        if (buffer.trim()) {
          const content = config.parseStreamChunk(buffer.trim());
          if (content) {
            yield content;
          }
        }
      } catch (err) {
        if (err instanceof Error) {
          throw err;
        }
        throw new Error(`AI request failed: ${String(err)}`);
      }

      span?.end();
    } catch (err) {
      span?.setStatus({ code: 2, message: err instanceof Error ? err.message : 'AI request failed' });
      span?.end();
      throw err;
    }
  }

  /**
   * Non-streaming chat completion (convenience method)
   */
  async chatComplete(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
    let result = '';
    for await (const chunk of this.chat(messages, { ...options, stream: false })) {
      result += chunk;
    }
    return result;
  }
}

/**
 * Recovery-focused system prompt
 */
export function getRecoverySystemPrompt(context?: {
  sobrietyDays?: number;
  currentStep?: number | null;
  userName?: string;
  sponsorName?: string | null;
  personalityPrompt?: string;
}): string {
  const parts = [
    `You are a supportive AI companion for someone in addiction recovery, following the 12-step program tradition.`,
    ``,
    `Your role is to:`,
    `- Listen with compassion and without judgment`,
    `- Encourage honesty and self-reflection`,
    `- Support their step work when asked`,
    `- Remind them of their progress and victories`,
    `- Help identify triggers and coping strategies`,
    `- Never replace their sponsor, therapist, or meetings`,
    `- Encourage reaching out to their support network`,
    ``,
    `Important guidelines:`,
    `- Keep responses warm but concise`,
    `- Ask thoughtful follow-up questions`,
    `- Celebrate even small wins`,
    `- If they mention thoughts of relapse, acknowledge the difficulty and encourage them to call their sponsor or go to a meeting`,
    `- If they mention self-harm or crisis, encourage professional help immediately`,
    `- Never provide medical advice`,
  ];

  if (context?.sobrietyDays !== undefined) {
    parts.push(``, `The user has ${context.sobrietyDays} days of sobriety.`);
  }

  if (context?.currentStep) {
    parts.push(`They are currently working on Step ${context.currentStep}.`);
  }

  if (context?.userName) {
    parts.push(`Their name is ${context.userName}.`);
  }

  if (context?.sponsorName) {
    parts.push(`Their sponsor is ${context.sponsorName}.`);
  }

  if (context?.personalityPrompt) {
    parts.push('', context.personalityPrompt);
  }

  return parts.join('\n');
}
