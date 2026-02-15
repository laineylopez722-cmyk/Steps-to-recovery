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

// Context builder
export {
  buildContextString,
  assembleFullContext,
  toAIContext,
  type ContextData,
} from './contextBuilder';

// Memory extractor (rule-based)
export {
  extractMemoriesFromMessage,
  extractMemoriesFromAssistantExchange,
  extractMemoriesWithAI,
} from './memoryExtractor';

// AI-powered memory extraction
export { extractMemoriesWithAIService } from './aiMemoryExtractor';

// Semantic memory extraction (AI-enhanced)
export {
  extractSemanticMemories,
  summarizeMemories,
  type ExtractedSemanticMemory,
} from './semanticMemoryExtractor';

// Conversation summarization
export { shouldSummarize, summarizeConversation } from './conversationSummarizer';

// Content safety filter
export { filterAIResponse, type SafetyFilterResult } from './contentSafetyFilter';

// AI crisis detection
export { detectCrisisWithAI, type CrisisAssessment } from './crisisDetector';

// Bookmarks
export { getBookmarkService, type Bookmark } from './bookmarkService';

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

// Provider health check
export {
  checkProviderHealth,
  getProviderHealth,
  getStatusColor,
  getStatusLabel,
  type ProviderHealth,
  type HealthStatus,
} from './providerHealthCheck';

// Voice output (TTS)
export {
  speakText,
  stopSpeaking,
  isSpeaking,
  loadVoicePreferences,
  saveVoicePreferences,
  type VoicePreferences,
} from './voiceOutput';

// OpenClaw provider
export { getOpenClawProvider } from './openClawProvider';

// Recovery context enricher
export { buildEnrichedContext } from './recoveryContextEnricher';

// Conversation export
export { exportConversation, type ExportFormat, type ExportResult } from './conversationExport';

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
