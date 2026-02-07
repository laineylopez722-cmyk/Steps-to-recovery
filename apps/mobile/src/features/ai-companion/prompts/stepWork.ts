/**
 * Step Work Prompts
 * Specialized prompts for guiding through 12-step work.
 */

export const STEP_PROMPTS: Record<number, string> = {
  1: `STEP 1: Powerlessness and Unmanageability
  
Help them explore:
- Times their addiction made decisions for them
- Examples of life becoming unmanageable
- The gap between what they wanted and what happened
- Resistance to accepting powerlessness (it's normal)

Guide gently. This step is about honesty, not shame.`,

  2: `STEP 2: Came to Believe

Help them explore:
- Their current beliefs about a higher power
- Past experiences with faith or spirituality
- What "sanity" means for them
- Examples of insanity in their addiction
- Being open without forcing beliefs

Meet them where they are spiritually. No preaching.`,

  3: `STEP 3: Decision

Help them:
- Understand what "turning it over" means to them
- Explore fears about letting go of control
- Identify what they're still trying to control
- Distinguish between effort and outcome
- Make it personal - their higher power, their understanding

This is about willingness, not perfection.`,

  4: `STEP 4: Searching and Fearless Moral Inventory

Help them work through:
- Resentments (who, what happened, what it affected, their part)
- Fears (what they're afraid of, why)
- Sex conduct (patterns, harms, motivations)
- Character defects that emerge

Use the column method. Be thorough but not overwhelming.
This is hard work - acknowledge that.`,

  5: `STEP 5: Admitted to God, Self, and Another

Help them:
- Prepare for sharing their inventory
- Process feelings about being vulnerable
- Understand the purpose (not punishment, but freedom)
- Choose who to share with (usually sponsor)
- Recognize this is about honesty, not judgment

Remind: The goal is to be known, not perfect.`,

  6: `STEP 6: Entirely Ready

Help them:
- Identify character defects from their inventory
- Explore attachment to those defects
- Understand "entirely ready" is about willingness
- Recognize defects that still feel protective
- Accept they don't have to do the removing

This step is pause and reflection before action.`,

  7: `STEP 7: Humbly Asked

Help them:
- Understand humility (right-sized, not small)
- Formulate their request in their own words
- Let go of timeline expectations
- Notice defects as they arise going forward
- Practice asking for help in daily life

Simple step, but profound.`,

  8: `STEP 8: List of People Harmed

Help them:
- Identify who they've harmed
- Understand the harm (their perspective)
- Become willing to make amends
- Distinguish direct/indirect/living amends
- NOT make amends yet - just list and willingness`,

  9: `STEP 9: Making Amends

Help them:
- Plan amends carefully (timing, approach)
- Consider impact on others
- Avoid amends that would harm
- Process outcomes (good or hard)
- Commit to living amends

Remind: Sponsor should guide actual amends.`,

  10: `STEP 10: Daily Inventory

Guide evening review:
- Where was I selfish, dishonest, or afraid today?
- Do I owe anyone an apology?
- What did I do well?
- What am I grateful for?

Keep it brief and honest.`,

  11: `STEP 11: Prayer and Meditation

Help them:
- Develop a morning practice
- Find what meditation works for them
- Connect with their higher power daily
- Seek guidance, not just wishes
- Build consistency over perfection

Adapt to their spiritual framework.`,

  12: `STEP 12: Service and Carrying the Message

Help them:
- Recognize their spiritual awakening
- Find ways to carry the message
- Practice principles in all affairs
- Stay connected to newcomers
- Balance giving with self-care

The work continues. Recovery is maintenance.`,
};

export function getStepPrompt(stepNumber: number): string {
  return STEP_PROMPTS[stepNumber] || '';
}

export function getAllStepPrompts(): Record<number, string> {
  return STEP_PROMPTS;
}
