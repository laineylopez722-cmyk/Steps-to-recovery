/**
 * AI Companion Services — Barrel Export
 */

// Core AI Service
export {
  createAIService,
  getAIService,
  AIServiceInstance,
  getRecoverySystemPrompt,
  type ChatMessage,
  type ChatOptions,
  type AIProvider,
} from './aiService';

// Memory extractor (rule-based)
export {
  extractMemoriesFromMessage,
  extractMemoriesFromAssistantExchange,
  extractMemoriesWithAI,
} from './memoryExtractor';

// Semantic memory extraction (AI-enhanced)
export {
  extractSemanticMemories,
  summarizeMemories,
  type ExtractedSemanticMemory,
} from './semanticMemoryExtractor';

// Content safety filter
export { filterAIResponse, type SafetyFilterResult } from './contentSafetyFilter';

// Weekly reports
export { generateWeeklyReport, type WeeklyReport } from './weeklyReport';

// Safety plan
export {
  loadSafetyPlan,
  saveSafetyPlan,
  getRelevantPlanSection,
  formatPlanForContext,
  type SafetyPlan,
} from './safetyPlanService';

// Recovery strength score
export {
  calculateRecoveryStrength,
  calculateCheckInConsistency,
  calculateMoodStability,
  calculateCravingManagement,
  type RecoveryMetrics,
  type RecoveryStrengthResult,
} from './recoveryStrengthScore';

// Milestone predictions
export { predictMilestones, type MilestonePrediction } from './milestonePredictions';

// Cost estimation
export {
  estimateCost,
  estimateTokenCount,
  getSessionCost,
  addToSessionCost,
  getDailyCost,
  addToDailyCost,
  getCostHistory,
  type CostEstimate,
  type DailyCostEntry,
} from './costEstimation';

// Rate limiting
export {
  checkRateLimit,
  incrementMessageCount,
  getRemainingMessages,
  setDailyLimit,
  getDailyLimit,
  setRateLimitEnabled,
  isRateLimitEnabled,
  type RateLimitStatus,
} from './rateLimiter';

// OpenClaw provider
export { getOpenClawProvider } from './openClawProvider';

// Recovery context enricher
export { buildEnrichedContext } from './recoveryContextEnricher';

// Offline fallback
export {
  isOfflineMode,
  getOfflineResponse,
  cacheResponse,
  queuePendingMessage,
  drainPendingMessages,
  type CachedResponse,
  type PendingMessage,
  type OfflineResponse,
} from './offlineFallback';
