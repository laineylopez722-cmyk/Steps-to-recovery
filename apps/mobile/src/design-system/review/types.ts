/**
 * UI/UX meta-review domain types.
 * These types are intentionally implementation-focused so the output can be
 * translated into actionable engineering tasks without additional decisions.
 */

export const UX_AUDIT_CATEGORIES = [
  'visualPolish',
  'consistency',
  'hierarchy',
  'accessibility',
  'recoverySafety',
  'motionPerformance',
] as const;

export type UxAuditCategory = (typeof UX_AUDIT_CATEGORIES)[number];

export type UxIssueSeverity = 'critical' | 'high' | 'medium' | 'low';
export type UxIssueStatus = 'open' | 'inProgress' | 'blocked' | 'done';
export type UxRoadmapPhase = 1 | 2 | 3 | 4;
export type UxEffort = 'S' | 'M' | 'L';
export type UxRisk = 'low' | 'medium' | 'high';
export type UxScoreBand = 'at-risk' | 'needs-work' | 'strong' | 'exceptional';

export type UxStack = 'Root' | 'Auth' | 'Home' | 'Journal' | 'Steps' | 'Meetings' | 'Profile';

export type UxFeature =
  | 'auth'
  | 'home'
  | 'journal'
  | 'steps'
  | 'meetings'
  | 'profile'
  | 'sponsor'
  | 'emergency'
  | 'crisis'
  | 'progress'
  | 'ai-companion';

export type UxJourney =
  | 'onboarding'
  | 'auth'
  | 'daily-home'
  | 'journaling'
  | 'step-work'
  | 'meetings'
  | 'profile-settings'
  | 'sponsor'
  | 'emergency-support'
  | 'ai-companion'
  | 'progress';

export type UxRouteStatus = 'active' | 'typed-only';
export type UxRiskLevel = 'safety-critical' | 'core' | 'supporting';

export type UxAuditWeights = Record<UxAuditCategory, number>;
export type UxCategoryScores = Record<UxAuditCategory, number>;

export interface UxEvidenceRef {
  filePath: string;
  line?: number;
  rationale: string;
}

export interface ScreenInventoryEntry {
  route: string;
  stack: UxStack;
  feature: UxFeature;
  journey: UxJourney;
  filePath: string;
  status: UxRouteStatus;
  riskLevel: UxRiskLevel;
  notes?: string[];
}

export interface InventoryCoverageSummary {
  totalRoutes: number;
  byStack: Record<UxStack, number>;
  byStatus: Record<UxRouteStatus, number>;
  byRiskLevel: Record<UxRiskLevel, number>;
}

export interface UxAuditScorecard {
  route: string;
  scores: UxCategoryScores;
  weightedScore: number;
  scoreBand: UxScoreBand;
  notes: string[];
  evidence: UxEvidenceRef[];
}

export interface UxIssue {
  id: string;
  title: string;
  severity: UxIssueSeverity;
  status: UxIssueStatus;
  categories: UxAuditCategory[];
  summary: string;
  impact: string;
  recommendation: string;
  affectedRoutes: string[];
  evidence: UxEvidenceRef[];
}

export interface UxRoadmapItem {
  phase: UxRoadmapPhase;
  title: string;
  objective: string;
  effort: UxEffort;
  risk: UxRisk;
  dependencies: string[];
  tasks: string[];
  acceptanceCriteria: string[];
}
