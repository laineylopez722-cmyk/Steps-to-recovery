/**
 * AI-Powered Crisis Detection
 * Combines AI sentiment analysis with keyword detection for robust crisis detection.
 */

import { logger } from '../../../utils/logger';
import { getAIService, type ChatMessage } from './aiService';

export interface CrisisAssessment {
  isCrisis: boolean;
  severity: 'none' | 'low' | 'medium' | 'high';
  confidence: number;
  signals: string[];
  suggestedAction: 'none' | 'monitor' | 'intervene' | 'emergency';
}

// High-urgency keywords for immediate fallback detection
const HIGH_KEYWORDS = [
  'suicide',
  'suicidal',
  'kill myself',
  'end my life',
  'want to die',
  'overdose',
  'relapsed',
];
const MEDIUM_KEYWORDS = [
  'using again',
  "can't do this",
  'giving up',
  'no point',
  'hurting myself',
  'self-harm',
  'drinking',
  'cutting',
];
const LOW_KEYWORDS = [
  'struggling',
  'tempted',
  'craving',
  'triggered',
  'hopeless',
  'alone',
  'desperate',
];

/**
 * Detect crisis using keyword matching (fast, no API needed).
 */
function keywordDetect(message: string): CrisisAssessment {
  const lower = message.toLowerCase();
  const signals: string[] = [];

  for (const kw of HIGH_KEYWORDS) {
    if (lower.includes(kw)) signals.push(kw);
  }
  if (signals.length > 0) {
    return {
      isCrisis: true,
      severity: 'high',
      confidence: 0.9,
      signals,
      suggestedAction: 'emergency',
    };
  }

  for (const kw of MEDIUM_KEYWORDS) {
    if (lower.includes(kw)) signals.push(kw);
  }
  if (signals.length > 0) {
    return {
      isCrisis: true,
      severity: 'medium',
      confidence: 0.7,
      signals,
      suggestedAction: 'intervene',
    };
  }

  for (const kw of LOW_KEYWORDS) {
    if (lower.includes(kw)) signals.push(kw);
  }
  if (signals.length > 0) {
    return {
      isCrisis: true,
      severity: 'low',
      confidence: 0.5,
      signals,
      suggestedAction: 'monitor',
    };
  }

  return {
    isCrisis: false,
    severity: 'none',
    confidence: 0.8,
    signals: [],
    suggestedAction: 'none',
  };
}

/**
 * Detect crisis using AI analysis, with keyword fallback.
 */
export async function detectCrisisWithAI(
  message: string,
  conversationContext?: string,
): Promise<CrisisAssessment> {
  // Always run keyword detection first (fast, works offline)
  const keywordResult = keywordDetect(message);

  // If keyword detection finds HIGH severity, return immediately
  if (keywordResult.severity === 'high') {
    return keywordResult;
  }

  // Try AI-powered detection for better accuracy
  try {
    const service = await getAIService();
    const configured = await service.isConfigured();
    if (!configured) return keywordResult;

    const prompt: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a crisis detection system for a recovery support app.
Analyze the user's message for signs of crisis. Respond with ONLY valid JSON:
{
  "severity": "none" | "low" | "medium" | "high",
  "signals": ["list of concerning elements"],
  "confidence": 0.0-1.0
}

Severity guide:
- none: Normal conversation
- low: Some distress, could use extra support
- medium: Significant distress, may need intervention  
- high: Immediate danger (suicidal ideation, active relapse, self-harm)

Be sensitive but accurate. Fewer false positives are important.`,
      },
      {
        role: 'user',
        content: conversationContext
          ? `Context: ${conversationContext}\n\nLatest message: "${message}"`
          : `Message: "${message}"`,
      },
    ];

    const response = await service.chatComplete(prompt, {
      maxTokens: 150,
      temperature: 0.1,
    });

    const parsed = JSON.parse(response);
    const aiResult: CrisisAssessment = {
      isCrisis: parsed.severity !== 'none',
      severity: parsed.severity || 'none',
      confidence: parsed.confidence || 0.5,
      signals: parsed.signals || [],
      suggestedAction: mapSeverityToAction(parsed.severity || 'none'),
    };

    // Take the higher severity between AI and keyword detection
    if (severityRank(keywordResult.severity) > severityRank(aiResult.severity)) {
      return keywordResult;
    }

    logger.debug('AI crisis detection', {
      severity: aiResult.severity,
      confidence: aiResult.confidence,
    });
    return aiResult;
  } catch (error) {
    logger.warn('AI crisis detection failed, using keyword fallback', error);
    return keywordResult;
  }
}

function severityRank(s: string): number {
  switch (s) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      return 0;
  }
}

function mapSeverityToAction(severity: string): CrisisAssessment['suggestedAction'] {
  switch (severity) {
    case 'high':
      return 'emergency';
    case 'medium':
      return 'intervene';
    case 'low':
      return 'monitor';
    default:
      return 'none';
  }
}
