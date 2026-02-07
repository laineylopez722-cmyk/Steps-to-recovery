/**
 * AI Companion Services
 * Context building, memory extraction, and AI integration.
 */

// AI Service
export {
  createAIService,
  getAIService,
  AIServiceInstance,
  getRecoverySystemPrompt,
  type ChatMessage,
  type ChatOptions,
  type AIProvider,
} from './aiService';

// Context builder
export {
  buildContextString,
  assembleFullContext,
  toAIContext,
  type ContextData,
} from './contextBuilder';

// Memory extractor
export {
  extractMemoriesFromMessage,
  extractMemoriesFromAssistantExchange,
  extractMemoriesWithAI,
} from './memoryExtractor';
