/**
 * Daily Reflection Prompts Service
 * Generates personalized reflection questions based on recovery context.
 */

import { logger } from '../../../utils/logger';

export interface ReflectionPrompt {
  id: string;
  question: string;
  category: 'morning' | 'evening' | 'step-work' | 'milestone' | 'general';
  emoji: string;
}

const MORNING_PROMPTS: ReadonlyArray<ReflectionPrompt> = [
  {
    id: 'am-1',
    question: "What's one thing you want to accomplish today for your recovery?",
    category: 'morning',
    emoji: '🌅',
  },
  {
    id: 'am-2',
    question: 'How are you feeling right now, in this moment?',
    category: 'morning',
    emoji: '💭',
  },
  {
    id: 'am-3',
    question: 'What are you grateful for this morning?',
    category: 'morning',
    emoji: '🙏',
  },
  {
    id: 'am-4',
    question: 'Is there anything you need to ask for help with today?',
    category: 'morning',
    emoji: '🤝',
  },
  {
    id: 'am-5',
    question: 'What step principle can guide you through today?',
    category: 'morning',
    emoji: '📖',
  },
  { id: 'am-6', question: 'Who can you reach out to today?', category: 'morning', emoji: '📞' },
];

const EVENING_PROMPTS: ReadonlyArray<ReflectionPrompt> = [
  {
    id: 'pm-1',
    question: "What's one thing you did well today?",
    category: 'evening',
    emoji: '⭐',
  },
  {
    id: 'pm-2',
    question: 'Was there a moment today when you felt tempted? How did you handle it?',
    category: 'evening',
    emoji: '🛡️',
  },
  {
    id: 'pm-3',
    question: 'Did you practice any step work today?',
    category: 'evening',
    emoji: '📝',
  },
  {
    id: 'pm-4',
    question: 'What would you do differently if you could redo today?',
    category: 'evening',
    emoji: '🔄',
  },
  {
    id: 'pm-5',
    question: 'Did you connect with someone in recovery today?',
    category: 'evening',
    emoji: '💬',
  },
  {
    id: 'pm-6',
    question: "What's one thing you learned about yourself today?",
    category: 'evening',
    emoji: '🪞',
  },
];

const MILESTONE_PROMPTS: ReadonlyArray<ReflectionPrompt> = [
  {
    id: 'ms-1',
    question: "Look how far you've come. What has changed most since day one?",
    category: 'milestone',
    emoji: '🏆',
  },
  {
    id: 'ms-2',
    question: 'What advice would you give to someone just starting their recovery?',
    category: 'milestone',
    emoji: '💡',
  },
  {
    id: 'ms-3',
    question: 'What relationship has improved most since you started your journey?',
    category: 'milestone',
    emoji: '❤️',
  },
];

const STEP_PROMPTS: Record<number, ReadonlyArray<ReflectionPrompt>> = {
  1: [
    {
      id: 'st1-1',
      question: 'In what ways has your life become unmanageable?',
      category: 'step-work',
      emoji: '🪜',
    },
    {
      id: 'st1-2',
      question: 'What does powerlessness mean to you today?',
      category: 'step-work',
      emoji: '🪜',
    },
  ],
  2: [
    {
      id: 'st2-1',
      question: "What does a 'Power greater than ourselves' mean in your life?",
      category: 'step-work',
      emoji: '🪜',
    },
  ],
  3: [
    {
      id: 'st3-1',
      question: 'What are you willing to let go of today?',
      category: 'step-work',
      emoji: '🪜',
    },
  ],
  4: [
    {
      id: 'st4-1',
      question: 'What character defect has been most challenging for you?',
      category: 'step-work',
      emoji: '🪜',
    },
  ],
};

const MILESTONES_DAYS = [1, 7, 14, 30, 60, 90, 180, 365];

/**
 * Get a daily reflection prompt based on context.
 */
export function getDailyPrompt(options: {
  timeOfDay: 'morning' | 'evening';
  sobrietyDays: number;
  currentStep?: number;
}): ReflectionPrompt {
  const { timeOfDay, sobrietyDays, currentStep } = options;

  // Check for milestone
  if (MILESTONES_DAYS.includes(sobrietyDays)) {
    const prompt = pickRandom(MILESTONE_PROMPTS);
    if (prompt) return prompt;
  }

  // Check for step-specific prompt
  if (currentStep && STEP_PROMPTS[currentStep]) {
    const stepPrompts = STEP_PROMPTS[currentStep];
    if (stepPrompts && Math.random() > 0.5) {
      const prompt = pickRandom(stepPrompts);
      if (prompt) return prompt;
    }
  }

  // Time-of-day prompt
  const pool = timeOfDay === 'morning' ? MORNING_PROMPTS : EVENING_PROMPTS;
  const prompt = pickRandom(pool);
  if (prompt) return prompt;

  return {
    id: 'default',
    question: 'How are you feeling right now?',
    category: 'general',
    emoji: '💭',
  };
}

/**
 * Get multiple prompts for a reflection session.
 */
export function getReflectionPrompts(
  count: number,
  options: {
    timeOfDay: 'morning' | 'evening';
    sobrietyDays: number;
    currentStep?: number;
  },
): ReflectionPrompt[] {
  const prompts: ReflectionPrompt[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < count * 3 && prompts.length < count; i++) {
    const p = getDailyPrompt(options);
    if (!seen.has(p.id)) {
      seen.add(p.id);
      prompts.push(p);
    }
  }

  logger.debug('Generated reflection prompts', { count: prompts.length });
  return prompts;
}

function pickRandom<T>(arr: ReadonlyArray<T>): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}
