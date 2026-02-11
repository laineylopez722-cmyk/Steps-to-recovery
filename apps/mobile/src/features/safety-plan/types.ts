/**
 * Safety Plan Types
 *
 * Based on the VA/Stanley-Brown Safety Planning Intervention —
 * a clinically validated suicide/relapse prevention tool.
 */

export interface SafetyPlanStep {
  stepNumber: number;
  title: string;
  description: string;
  placeholder: string;
}

export interface SafetyPlanData {
  id: string;
  userId: string;
  warningSigns: string[];
  copingStrategies: string[];
  distractionPeople: string[];
  supportContacts: SafetyContact[];
  professionalContacts: SafetyContact[];
  safeEnvironment: string[];
  reasonsToLive: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SafetyContact {
  name: string;
  phone: string;
  relationship: string;
}

export const SAFETY_PLAN_STEPS: SafetyPlanStep[] = [
  {
    stepNumber: 1,
    title: 'Warning Signs',
    description:
      'What thoughts, moods, situations, or behaviors might indicate a crisis is developing?',
    placeholder: 'e.g., Feeling isolated, not sleeping, skipping meetings...',
  },
  {
    stepNumber: 2,
    title: 'Coping Strategies',
    description: 'What can I do on my own to take my mind off my problems?',
    placeholder: 'e.g., Go for a walk, listen to music, pray...',
  },
  {
    stepNumber: 3,
    title: 'People & Places for Distraction',
    description: 'Who or where can I go to take my mind off things?',
    placeholder: 'e.g., Coffee shop, a friend, the park...',
  },
  {
    stepNumber: 4,
    title: 'People I Can Ask for Help',
    description: 'Who can I reach out to when I need support?',
    placeholder: 'Name and phone number',
  },
  {
    stepNumber: 5,
    title: 'Professionals & Agencies',
    description: 'Clinician, local emergency room, crisis hotline',
    placeholder: 'Name, phone, or address',
  },
  {
    stepNumber: 6,
    title: 'Making My Environment Safe',
    description: 'What can I do to reduce access to things that could harm me?',
    placeholder: 'e.g., Remove substances, avoid certain places...',
  },
  {
    stepNumber: 7,
    title: 'My Reasons for Living',
    description: 'What matters most to me? Why do I want to keep going?',
    placeholder: 'e.g., My children, my recovery, my future...',
  },
];
