/**
 * AI Service
 * Abstraction layer for AI providers (OpenAI, Anthropic).
 * Supports streaming responses.
 */

import { secureStorage } from '../../../adapters/secureStorage';

const API_KEY_STORAGE_KEY = 'ai_companion_api_key';
const PROVIDER_STORAGE_KEY = 'ai_companion_provider';

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

export type AIProvider = 'openai' | 'anthropic';

interface ProviderConfig {
  apiUrl: string;
  defaultModel: string;
  formatRequest: (messages: ChatMessage[], options: ChatOptions) => object;
  parseStreamChunk: (chunk: string) => string | null;
}

const PROVIDER_CONFIGS: Record<AIProvider, ProviderConfig> = {
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
      // OpenAI SSE format: data: {"choices":[{"delta":{"content":"..."}}]}
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
      // Anthropic requires system message separate
      const systemMessage = messages.find(m => m.role === 'system');
      const nonSystemMessages = messages.filter(m => m.role !== 'system');

      return {
        model: options.model || 'claude-3-5-sonnet-20241022',
        max_tokens: options.maxTokens || 1024,
        system: systemMessage?.content,
        messages: nonSystemMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: options.stream ?? true,
      };
    },
    parseStreamChunk: (chunk: string): string | null => {
      // Anthropic SSE format: event: content_block_delta\ndata: {"delta":{"text":"..."}}
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
};

/**
 * Detect provider from API key prefix
 */
function detectProvider(apiKey: string): AIProvider {
  if (apiKey.startsWith('sk-ant-')) {
    return 'anthropic';
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
    (storedProvider as AIProvider) || (apiKey ? detectProvider(apiKey) : 'openai')
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
   * Check if the service is configured with an API key
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
    return false;
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
   * Stream chat completion
   */
  async *chat(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    if (!this.apiKey) {
      throw new Error('AI service not configured. Please set an API key.');
    }

    const config = PROVIDER_CONFIGS[this.provider];
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
        if (this.provider === 'anthropic') {
          yield data.content?.[0]?.text || '';
        } else {
          yield data.choices?.[0]?.message?.content || '';
        }
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

  return parts.join('\n');
}
