/**
 * AI Companion Prompts
 * System prompts, step work guides, and crisis detection.
 */

// Base prompts
export { BASE_SYSTEM_PROMPT, buildSystemPrompt } from './base';

// Step work prompts
export { STEP_PROMPTS, getStepPrompt, getAllStepPrompts } from './stepWork';

// Crisis detection and response
export {
  CRISIS_KEYWORDS,
  CRISIS_RESPONSE_TEMPLATE,
  CRISIS_RESOURCES,
  detectCrisis,
  toCrisisSignal,
  buildCrisisResponse,
} from './crisis';
export type { CrisisDetectionResult } from './crisis';
