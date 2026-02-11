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

// Conversation summarization
export { shouldSummarize, summarizeConversation } from './conversationSummarizer';

// Emotional state tracking
export {
  detectEmotionalState,
  trackEmotionalState,
  getEmotionalPatterns,
  type EmotionalState,
  type EmotionalPattern,
} from './emotionalTracker';

// Personality learning
export { getPersonalityLearner } from './personalityLearner';

// Content safety filter
export { filterAIResponse, type SafetyFilterResult } from './contentSafetyFilter';

// AI crisis detection
export { detectCrisisWithAI, type CrisisAssessment } from './crisisDetector';

// Bookmarks
export { getBookmarkService, type Bookmark } from './bookmarkService';

// Mood trend analysis
export { analyzeMoodTrends, type MoodTrendCard } from './moodTrendAnalysis';

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

// Warm handoff
export {
  draftSponsorMessage,
  formatForSMS,
  suggestMeeting,
  type HandoffDraft,
} from './warmHandoff';

// Post-crisis follow-up
export {
  createFollowUpSchedule,
  getNextDueFollowUp,
  markFollowUpSent,
  type FollowUpSchedule,
  type FollowUp,
} from './postCrisisFollowUp';

// Daily reflection prompts
export {
  getDailyPrompt,
  getReflectionPrompts,
  type ReflectionPrompt,
} from './dailyReflectionPrompts';

// Journal analysis
export {
  buildJournalContext,
  createJournalAnalysisPrompt,
  getSuggestedQueries,
} from './journalAnalysis';

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

// Multi-session continuity
export {
  storeConversationSummary,
  loadStoredSummaries,
  buildContinuityContext,
  findRelevantSummaries,
} from './multiSessionContinuity';

// Semantic memory search
export { searchMemories, type MemoryDocument } from './semanticSearch';

// Voice output (TTS)
export {
  speakText,
  stopSpeaking,
  isSpeaking,
  loadVoicePreferences,
  saveVoicePreferences,
  type VoicePreferences,
} from './voiceOutput';

// Professional referral
export {
  getRelevantResources,
  getCrisisHotlines,
  generateReferralMessage,
  type ProfessionalResource,
} from './professionalReferral';

// OpenClaw provider
export { getOpenClawProvider } from './openClawProvider';

// OpenClaw context sync
export { syncContextToOpenClaw, buildRecoveryMetadata } from './openClawContextSync';

// OpenClaw multi-channel
export {
  loadChannelConfig,
  saveChannelConfig,
  syncChannelsToOpenClaw,
  getAvailableChannels,
} from './openClawMultiChannel';

// Conversation export
export {
  exportConversation,
  type ExportFormat,
  type ExportResult,
} from './conversationExport';

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
