/**
 * Recovery Slogans
 *
 * Common slogans used in 12-step programs with detailed explanations.
 * These slogans provide wisdom and guidance for various situations in recovery.
 *
 * @module constants/slogans
 */

/**
 * Recovery slogan with explanation
 */
export interface Slogan {
  /** Unique identifier */
  readonly id: string;
  /** The slogan text */
  readonly text: string;
  /** Detailed explanation of the slogan's meaning */
  readonly explanation: string;
  /** Guidance on when to use this slogan */
  readonly whenToUse: string;
  /** Slogan category */
  readonly category: 'foundation' | 'daily' | 'struggle' | 'growth' | 'fellowship';
}

export const SLOGANS: Slogan[] = [
  // Foundation Slogans
  {
    id: 'one-day',
    text: 'One Day at a Time',
    explanation: `Recovery happens in the present moment. We don't have to stay clean forever—we just have to stay clean today. Tomorrow will take care of itself.

When we're overwhelmed by the thought of never using again, this slogan reminds us to focus only on what's in front of us. Can you stay clean for just this one day? That's all that's required.

Many of us have found that when we break our recovery down into manageable pieces, the impossible becomes possible.`,
    whenToUse: 'When feeling overwhelmed about the future or the magnitude of recovery.',
    category: 'foundation',
  },
  {
    id: 'keep-coming-back',
    text: 'Keep Coming Back',
    explanation: `Recovery is not a one-time event—it's a process. No matter what happens, keep showing up to meetings, keep working your program, keep reaching out.

Many of us struggled before we finally "got it." Some of us relapsed. Some of us thought this program wasn't for us. But we kept coming back, and eventually it clicked.

The doors of recovery are always open. All you have to do is walk through them, again and again.`,
    whenToUse: 'When doubting the program, after a setback, or when considering giving up.',
    category: 'foundation',
  },
  {
    id: 'it-works',
    text: 'It Works If You Work It',
    explanation: `This program works. Millions of people have found freedom from addiction through these simple principles. But it only works if you actually do the work.

Going to meetings is important, but it's not enough. We have to work the steps, get a sponsor, be honest, help others, and practice these principles in all our affairs.

Half measures availed us nothing. If you want what we have, you have to be willing to go to any length to get it.`,
    whenToUse: 'When tempted to cut corners or when questioning if the program really works.',
    category: 'foundation',
  },
  {
    id: 'easy-does-it',
    text: 'Easy Does It',
    explanation: `In our addiction, many of us lived at extremes. We were either all in or all out, manic or depressed, using heavily or in crisis.

Recovery teaches us balance. We don't have to fix everything at once. We don't have to be perfect. We can take things slow, be gentle with ourselves, and make progress gradually.

This doesn't mean we don't work hard—it means we don't burn ourselves out. Sustainable recovery is the goal.`,
    whenToUse: 'When pushing too hard, being too self-critical, or trying to do too much at once.',
    category: 'daily',
  },
  {
    id: 'first-things-first',
    text: 'First Things First',
    explanation: `In recovery, our sobriety comes first. Without it, we have nothing. We can't work on our relationships, careers, or dreams if we're using.

This slogan reminds us to keep our priorities straight. When life gets complicated, we simplify by asking: what's the most important thing right now? Usually, it's staying clean and working our program.

Put your recovery first, and everything else becomes possible.`,
    whenToUse: 'When overwhelmed by competing priorities or when recovery is being neglected.',
    category: 'foundation',
  },
  {
    id: 'let-go',
    text: 'Let Go and Let God',
    explanation: `So much of our suffering comes from trying to control things that are beyond our control. We worry about outcomes, try to manipulate situations, and exhaust ourselves fighting battles we can't win.

This slogan invites us to surrender—to accept that there's a Power greater than ourselves that can handle the things we can't. We do our part, then let go of the results.

"Letting go" doesn't mean giving up. It means trusting that things will work out as they should, even if we can't see how.`,
    whenToUse: 'When anxious, controlling, or struggling to accept a situation.',
    category: 'daily',
  },
  {
    id: 'this-too-shall-pass',
    text: 'This Too Shall Pass',
    explanation: `Nothing lasts forever—not the good times, and not the bad. When we're in pain, it feels like it will never end. But it will.

Cravings pass. Difficult emotions pass. Hard seasons of life pass. If we can just hold on, just stay clean through this moment, relief will come.

This slogan is a reminder that our current circumstances are temporary. Whatever we're going through, we don't have to use over it.`,
    whenToUse: 'During cravings, difficult emotions, or painful life circumstances.',
    category: 'struggle',
  },
  {
    id: 'progress-not-perfection',
    text: 'Progress Not Perfection',
    explanation: `Many of us are perfectionists. We beat ourselves up when we make mistakes. We think if we're not doing recovery "perfectly," we're failing.

But recovery isn't about perfection—it's about progress. Are you a little better than you were yesterday? Are you showing up, trying, doing your best? That's enough.

We don't recover perfectly. We recover imperfectly, one messy day at a time. And that's okay.`,
    whenToUse: 'When being self-critical, after making a mistake, or when feeling like a failure.',
    category: 'growth',
  },
  {
    id: 'halt',
    text: 'HALT: Hungry, Angry, Lonely, Tired',
    explanation: `HALT is an acronym that reminds us of four danger zones:

• Hungry - When we don't take care of our physical needs
• Angry - When we let resentments build up
• Lonely - When we isolate from others
• Tired - When we're exhausted and depleted

When we find ourselves in any of these states, we're more vulnerable to making poor decisions, including using. HALT is a reminder to check in with ourselves and address these basic needs before they become a threat to our recovery.`,
    whenToUse: 'When feeling off, irritable, or vulnerable to relapse.',
    category: 'daily',
  },
  {
    id: 'think',
    text: 'Think Think Think',
    explanation: `In our addiction, we acted impulsively without considering consequences. This slogan reminds us to pause and think before we act.

Before making a decision—especially one that could affect our recovery—we need to stop and think it through. What are the consequences? What would our sponsor say? Is this aligned with our recovery?

A moment of reflection can prevent a lifetime of regret.`,
    whenToUse: 'Before making important decisions or when tempted to act impulsively.',
    category: 'daily',
  },
  {
    id: 'live-let-live',
    text: 'Live and Let Live',
    explanation: `Other people are going to do things we don't like. They're going to make choices we disagree with. They're not going to live up to our expectations.

This slogan reminds us to focus on our own side of the street. We can't control others—we can only control ourselves. Let other people live their lives while we focus on living ours.

Acceptance is the answer to all our problems. When we stop trying to change others and accept them as they are, we find peace.`,
    whenToUse:
      'When frustrated with others, when trying to control situations, or dealing with resentment.',
    category: 'fellowship',
  },
  {
    id: 'principles-personalities',
    text: 'Principles Before Personalities',
    explanation: `In meetings, we'll encounter people we like and people we don't. Some personalities will rub us the wrong way. Some people will disappoint us.

But the program is about principles, not personalities. We don't stay clean because we like everyone in the rooms—we stay clean because the principles work.

When conflicts arise, we return to the program's principles: honesty, open-mindedness, willingness, love, service. These never let us down.`,
    whenToUse:
      'When having conflicts with people in the program or when personalities are getting in the way.',
    category: 'fellowship',
  },
  {
    id: 'meeting-makers',
    text: 'Meeting Makers Make It',
    explanation: `The data is clear: people who regularly attend meetings have higher rates of long-term sobriety. Meetings work.

When we show up, even when we don't feel like it, we stay connected to recovery. We hear what we need to hear. We remember why we're doing this.

There's no substitute for being in a room (or virtual meeting) with other recovering addicts. That connection is the foundation of our recovery.`,
    whenToUse: 'When tempted to skip meetings or when feeling disconnected from the program.',
    category: 'fellowship',
  },
  {
    id: 'keep-it-simple',
    text: 'Keep It Simple',
    explanation: `We have a tendency to complicate things. We overthink, overanalyze, and create problems where there are none.

Recovery is actually simple (not easy, but simple): don't use, go to meetings, work the steps, help others. That's really it.

When we're confused or overwhelmed, we can simplify by returning to these basics. What's the next right thing to do? Usually, it's pretty obvious.`,
    whenToUse: 'When overthinking, overcomplicating, or feeling lost in recovery.',
    category: 'daily',
  },
  {
    id: 'expect-miracle',
    text: 'Expect a Miracle',
    explanation: `Recovery itself is a miracle. The fact that we can go from the hopelessness of active addiction to a life of freedom and purpose is nothing short of miraculous.

This slogan invites us to maintain hope—to believe that good things are possible, that change is possible, that we are worth it.

Even in the darkest moments, miracles can happen. Stay open to the possibility.`,
    whenToUse: 'When feeling hopeless, during difficult times, or when needing encouragement.',
    category: 'growth',
  },
  {
    id: 'do-next-right',
    text: 'Do the Next Right Thing',
    explanation: `We don't have to figure out our whole life. We don't need all the answers. We just need to do the next right thing.

What's the next small action that aligns with our recovery? Make that phone call, go to that meeting, tell the truth, make that amend. One right action leads to another.

When we're paralyzed by indecision, this simple question can guide us forward: "What's the next right thing?"`,
    whenToUse: 'When feeling stuck, unsure what to do, or overwhelmed by choices.',
    category: 'growth',
  },
  {
    id: 'feelings-facts',
    text: "Feelings Aren't Facts",
    explanation: `Just because we feel something doesn't make it true. We might feel hopeless, but hope exists. We might feel worthless, but we have value. We might feel like using is the only option, but it's not.

Our feelings are valid—we don't deny them. But we also don't let them dictate our reality. We can feel afraid and still take action. We can feel sad and still be okay.

Learn to observe your feelings without being controlled by them.`,
    whenToUse: 'When emotions feel overwhelming or when feelings are conflicting with reality.',
    category: 'struggle',
  },
  {
    id: 'grateful-addict',
    text: 'A Grateful Addict Will Never Use',
    explanation: `Gratitude is one of the most powerful tools in recovery. When we focus on what we have instead of what we lack, our perspective shifts.

In active addiction, we were consumed by wanting more. In recovery, we practice being satisfied with what is. We count our blessings, big and small.

Cultivating gratitude on a daily basis protects our recovery. An addict full of gratitude has no room for the thoughts that lead to relapse.`,
    whenToUse: 'When feeling entitled, ungrateful, or when negativity is creeping in.',
    category: 'daily',
  },
];

/**
 * Get slogans by category
 *
 * @param category - Slogan category to filter by
 * @returns Array of slogans in the specified category
 * @example
 * ```ts
 * const dailySlogans = getSlogansByCategory('daily');
 * ```
 */
export function getSlogansByCategory(category: Slogan['category']): readonly Slogan[] {
  return SLOGANS.filter((s) => s.category === category);
}

/**
 * Get slogan by ID
 *
 * @param id - Slogan ID to look up
 * @returns Slogan object if found, undefined otherwise
 * @example
 * ```ts
 * const slogan = getSloganById('one-day');
 * ```
 */
export function getSloganById(id: string): Slogan | undefined {
  if (!id || typeof id !== 'string') {
    return undefined;
  }
  return SLOGANS.find((s) => s.id === id);
}

/**
 * Get random slogan
 *
 * Useful for displaying daily inspiration or random encouragement.
 *
 * @returns A randomly selected slogan
 * @example
 * ```ts
 * const dailySlogan = getRandomSlogan();
 * ```
 */
export function getRandomSlogan(): Slogan {
  if (SLOGANS.length === 0) {
    throw new Error('No slogans available');
  }
  return SLOGANS[Math.floor(Math.random() * SLOGANS.length)];
}

/**
 * Check if a slogan ID is valid
 *
 * @param id - Slogan ID to validate
 * @returns True if slogan exists
 */
export function isValidSloganId(id: string): boolean {
  return SLOGANS.some((s) => s.id === id);
}

/**
 * Slogan categories with labels
 */
export const SLOGAN_CATEGORIES: { key: Slogan['category']; label: string; icon: string }[] = [
  { key: 'foundation', label: 'Foundation', icon: '🏛️' },
  { key: 'daily', label: 'Daily Living', icon: '☀️' },
  { key: 'struggle', label: 'In Struggle', icon: '💪' },
  { key: 'growth', label: 'Growth', icon: '🌱' },
  { key: 'fellowship', label: 'Fellowship', icon: '🤝' },
];
