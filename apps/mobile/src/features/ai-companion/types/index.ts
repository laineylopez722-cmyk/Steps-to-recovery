/**
 * AI Companion Type Definitions
 */

// Chat types
export type MessageRole = 'user' | 'assistant' | 'system';
export type ConversationType = 'general' | 'step_work' | 'crisis' | 'check_in';
export type ConversationStatus = 'active' | 'archived';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  model?: string;
  tokens?: number;
  latencyMs?: number;
  crisisDetected?: boolean;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string | null;
  type: ConversationType;
  stepNumber: number | null;
  status: ConversationStatus;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
}

// Step work types
export type StepWorkEntryType = 'resentment' | 'fear' | 'amend' | 'reflection' | 'inventory';
export type StepWorkStatus = 'draft' | 'complete' | 'discussed_with_sponsor';

export interface StepWorkEntry {
  id: string;
  userId: string;
  stepNumber: number;
  entryType: StepWorkEntryType;
  data: Record<string, unknown>;
  status: StepWorkStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Resentment inventory (Step 4)
export interface ResentmentEntry {
  who: string;
  cause: string;
  affects: string[]; // 'self-esteem' | 'security' | 'ambitions' | 'personal_relations' | 'sex_relations'
  myPart: string;
}

// Amends entry (Step 8/9)
export interface AmendsEntry {
  who: string;
  harm: string;
  amendsType: 'direct' | 'indirect' | 'living' | 'impossible';
  status: 'not_started' | 'in_progress' | 'complete';
  notes: string;
  completedAt?: string;
}

// AI Context
export interface AIContext {
  sobrietyDays: number;
  currentStep: number | null;
  memorySummary: string;
  recentMood: number | null;
  recentCravingLevel: number | null;
  sponsorName: string | null;
  conversationType: ConversationType;
}

// Crisis detection
export interface CrisisSignal {
  detected: boolean;
  severity: 'low' | 'medium' | 'high';
  keywords: string[];
  suggestedAction: 'monitor' | 'intervene' | 'emergency';
}
