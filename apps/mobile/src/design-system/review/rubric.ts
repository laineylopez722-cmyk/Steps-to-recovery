import {
  UX_AUDIT_CATEGORIES,
  type UxAuditCategory,
  type UxAuditWeights,
  type UxCategoryScores,
  type UxScoreBand,
} from './types';

export const UX_SCORE_MIN = 1;
export const UX_SCORE_MAX = 5;

export const UX_AUDIT_WEIGHTS: UxAuditWeights = {
  visualPolish: 25,
  consistency: 20,
  hierarchy: 20,
  accessibility: 15,
  recoverySafety: 10,
  motionPerformance: 10,
};

export interface WeightValidationResult {
  isValid: boolean;
  total: number;
  errors: string[];
}

function assertScoreInRange(score: number, category: UxAuditCategory): void {
  if (!Number.isFinite(score)) {
    throw new Error(`Score for "${category}" must be a finite number.`);
  }

  if (score < UX_SCORE_MIN || score > UX_SCORE_MAX) {
    throw new Error(
      `Score for "${category}" must be between ${UX_SCORE_MIN} and ${UX_SCORE_MAX}. Received ${score}.`,
    );
  }
}

export function validateUxAuditWeights(weights: UxAuditWeights = UX_AUDIT_WEIGHTS): WeightValidationResult {
  const errors: string[] = [];
  let total = 0;

  for (const category of UX_AUDIT_CATEGORIES) {
    const weight = weights[category];

    if (!Number.isFinite(weight) || weight <= 0) {
      errors.push(`Weight for "${category}" must be a positive finite number.`);
      continue;
    }

    total += weight;
  }

  if (total !== 100) {
    errors.push(`Weight total must equal 100. Received ${total}.`);
  }

  return {
    isValid: errors.length === 0,
    total,
    errors,
  };
}

export function createNeutralScorecard(defaultScore = 3): UxCategoryScores {
  for (const category of UX_AUDIT_CATEGORIES) {
    assertScoreInRange(defaultScore, category);
  }

  return {
    visualPolish: defaultScore,
    consistency: defaultScore,
    hierarchy: defaultScore,
    accessibility: defaultScore,
    recoverySafety: defaultScore,
    motionPerformance: defaultScore,
  };
}

export function normalizeScore(score: number, decimals = 2): number {
  const scale = 10 ** decimals;
  return Math.round(score * scale) / scale;
}

export function calculateWeightedScore(
  scores: UxCategoryScores,
  weights: UxAuditWeights = UX_AUDIT_WEIGHTS,
): number {
  const validation = validateUxAuditWeights(weights);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(' '));
  }

  let weightedTotal = 0;
  for (const category of UX_AUDIT_CATEGORIES) {
    const score = scores[category];
    const weight = weights[category];
    assertScoreInRange(score, category);
    weightedTotal += score * (weight / 100);
  }

  return normalizeScore(weightedTotal);
}

export function getScoreBand(weightedScore: number): UxScoreBand {
  if (weightedScore < 2.5) {
    return 'at-risk';
  }

  if (weightedScore < 3.5) {
    return 'needs-work';
  }

  if (weightedScore < 4.25) {
    return 'strong';
  }

  return 'exceptional';
}
