/**
 * Trigger Scenario Simulator Constants
 * Evidence-based coping scenarios for practicing responses to triggers
 */

import type { TriggerScenario, ScenarioCategory } from '../types';

export const SCENARIO_CATEGORIES: {
  id: ScenarioCategory;
  label: string;
  emoji: string;
  color: string;
}[] = [
  { id: 'social', label: 'Social Situations', emoji: '👥', color: '#6366f1' },
  { id: 'emotional', label: 'Emotional Triggers', emoji: '💭', color: '#f59e0b' },
  { id: 'environmental', label: 'Environmental', emoji: '🏠', color: '#10b981' },
  { id: 'physical', label: 'Physical States', emoji: '🧠', color: '#ef4444' },
];

export const TRIGGER_SCENARIOS: TriggerScenario[] = [
  // Social Situations
  {
    id: 'social_party',
    category: 'social',
    title: 'The Party Invitation',
    description:
      'A friend invites you to a party where you know alcohol will be served freely. They say "Come on, it\'ll be fun! You can just have soda."',
    options: [
      {
        text: 'Go to the party and try to resist temptation',
        isHealthy: false,
        outcome:
          'You spend the entire evening fighting urges. The smell of alcohol and seeing others drink makes it incredibly hard. You leave feeling exhausted and vulnerable.',
        copingTip:
          "Putting yourself in high-risk situations early in recovery is dangerous. It's okay to protect your sobriety.",
      },
      {
        text: 'Politely decline and suggest meeting for coffee instead',
        isHealthy: true,
        outcome:
          'Your friend understands and you have a great time catching up over coffee the next day. You feel proud for protecting your recovery.',
        copingTip:
          'Suggesting an alternative shows you value the friendship while prioritizing your health.',
      },
      {
        text: 'Go but have "just one drink" to fit in',
        isHealthy: false,
        outcome:
          'One drink leads to another. You wake up feeling shame and regret, your streak broken.',
        copingTip:
          'There is no "just one" for someone in recovery. Playing the tape forward helps you see where this leads.',
      },
      {
        text: 'Go with a sober support person and have an exit plan',
        isHealthy: true,
        outcome:
          'Having your support person there helps you feel safe. You stay for an hour, drink sparkling water, and leave feeling accomplished.',
        copingTip:
          'If you must attend social events, bringing a sober buddy and having an exit plan is smart recovery planning.',
      },
    ],
    bestOptionIndex: 1,
  },
  {
    id: 'social_old_friend',
    category: 'social',
    title: 'The Old Drinking Buddy',
    description:
      'You run into an old friend who you used to drink/use with. They say "Hey! Let\'s go grab a drink like old times and catch up!"',
    options: [
      {
        text: 'Agree to go, thinking you can handle it',
        isHealthy: false,
        outcome:
          'Being in familiar places with familiar people triggers intense cravings. The pull of old habits is overwhelming.',
        copingTip: 'People, places, and things from our using days are powerful triggers.',
      },
      {
        text: 'Be honest: "I\'m in recovery now. Want to get coffee instead?"',
        isHealthy: true,
        outcome:
          'Your friend is supportive and proud of you. You have a meaningful conversation about your journey over coffee.',
        copingTip:
          'Being open about recovery helps you build authentic relationships and often inspires others.',
      },
      {
        text: 'Make an excuse and leave quickly',
        isHealthy: true,
        outcome:
          'You remove yourself from a potentially dangerous situation. You call your sponsor to process the encounter.',
        copingTip:
          "It's okay to leave uncomfortable situations. Protecting your sobriety is the priority.",
      },
      {
        text: 'Give them your number to catch up later (and avoid the question)',
        isHealthy: false,
        outcome:
          'They keep texting about meeting up for drinks. You feel pressured and stressed avoiding their messages.',
        copingTip:
          'Avoiding honest conversation just delays the discomfort and creates ongoing stress.',
      },
    ],
    bestOptionIndex: 1,
  },

  // Emotional Triggers
  {
    id: 'emotional_stress',
    category: 'emotional',
    title: 'Work Stress Overload',
    description:
      'You had the worst day at work. Your boss criticized you in front of everyone, and a major project fell through. You feel humiliated and exhausted. Your mind whispers "You deserve a drink after this day."',
    options: [
      {
        text: 'Stop at the store to "take the edge off"',
        isHealthy: false,
        outcome:
          "The temporary relief is followed by deeper shame. Tomorrow you'll have the same problems plus a hangover and guilt.",
        copingTip:
          "Substances don't solve problems—they add new ones. The stress will still be there, plus more.",
      },
      {
        text: 'Call your sponsor or support person to talk it through',
        isHealthy: true,
        outcome:
          "Talking helps you process the emotions. Your sponsor reminds you of how far you've come. You feel heard and less alone.",
        copingTip: 'Reaching out when struggling is a sign of strength, not weakness.',
      },
      {
        text: 'Go straight home and do something physical (exercise, clean, garden)',
        isHealthy: true,
        outcome:
          'Physical activity helps release the tension. By bedtime, you feel calmer and proud of handling stress healthily.',
        copingTip: 'Exercise releases natural endorphins and helps process difficult emotions.',
      },
      {
        text: 'Isolate and ruminate on how unfair life is',
        isHealthy: false,
        outcome:
          'The more you think about it, the worse you feel. Isolation amplifies negative thoughts and increases relapse risk.',
        copingTip:
          "Isolation is dangerous in recovery. Our thoughts aren't always reliable when we're stressed.",
      },
    ],
    bestOptionIndex: 1,
  },
  {
    id: 'emotional_celebration',
    category: 'emotional',
    title: 'The Big Celebration',
    description:
      'You got promoted! Everyone wants to celebrate. A colleague says "This calls for champagne! One toast won\'t hurt—it\'s a special occasion!"',
    options: [
      {
        text: 'Have "just one toast" because it\'s special',
        isHealthy: false,
        outcome:
          'The champagne tastes amazing. One becomes two, then three. Your celebration becomes a night you regret.',
        copingTip:
          "Special occasions don't make us immune to addiction. Triggers don't take days off.",
      },
      {
        text: 'Raise a glass of sparkling cider and celebrate anyway',
        isHealthy: true,
        outcome:
          "Nobody notices or cares what's in your glass. You enjoy the celebration fully present and wake up clear-headed.",
        copingTip:
          'You can fully participate in celebrations without alcohol. The joy is in the achievement, not the drink.',
      },
      {
        text: 'Skip the celebration entirely',
        isHealthy: false,
        outcome:
          'You miss out on recognizing your achievement. You feel disconnected from colleagues and slightly resentful.',
        copingTip:
          "Recovery doesn't mean avoiding all celebrations—it means finding new ways to celebrate.",
      },
      {
        text: 'Suggest a sober celebration (nice dinner, activity)',
        isHealthy: true,
        outcome:
          "Your team goes to an escape room followed by dinner. It's the most fun team event ever. Everyone remembers it.",
        copingTip:
          'Creating new celebration traditions can be even more memorable than alcohol-centered ones.',
      },
    ],
    bestOptionIndex: 3,
  },
  {
    id: 'emotional_lonely',
    category: 'emotional',
    title: 'Saturday Night Loneliness',
    description:
      "It's Saturday night and everyone seems to be out having fun. You're home alone scrolling social media, seeing everyone's party posts. You feel painfully lonely and think \"What's the point of being sober if I'm this miserable?\"",
    options: [
      {
        text: 'Go to a bar just for "the atmosphere and company"',
        isHealthy: false,
        outcome:
          'Being in a bar alone is torture. Either you drink, or you leave feeling worse than before.',
        copingTip:
          'Going to bars "just for company" is playing with fire. Find community elsewhere.',
      },
      {
        text: 'Go to a recovery meeting or call someone from your network',
        isHealthy: true,
        outcome:
          'At the meeting, you realize others feel the same way. You make plans to hang out with a new sober friend next weekend.',
        copingTip:
          "Recovery communities understand loneliness. You're never as alone as your mind tells you.",
      },
      {
        text: 'Practice self-care: take a bath, watch a movie, order good food',
        isHealthy: true,
        outcome:
          "You realize that a quiet night in isn't punishment—it's self-care. You go to bed peaceful and well-rested.",
        copingTip: 'Learning to enjoy your own company is a gift of recovery.',
      },
      {
        text: 'Keep scrolling and let the feelings consume you',
        isHealthy: false,
        outcome:
          'You spiral deeper into comparison and self-pity. The urge to use grows stronger with each passing hour.',
        copingTip:
          'Social media shows highlight reels, not reality. Many of those "fun" people are struggling too.',
      },
    ],
    bestOptionIndex: 1,
  },

  // Environmental Triggers
  {
    id: 'environmental_route',
    category: 'environmental',
    title: 'The Old Route Home',
    description:
      'Due to road construction, you have to drive past your old liquor store. You see it ahead and feel your pulse quicken. "Just driving by won\'t hurt..."',
    options: [
      {
        text: 'Drive past slowly, testing your willpower',
        isHealthy: false,
        outcome:
          'Your hands grip the wheel. Before you know it, you\'ve pulled into the parking lot "just to see."',
        copingTip: 'Testing your willpower is how relapse starts. Willpower is a limited resource.',
      },
      {
        text: "Take an alternate route, even if it's longer",
        isHealthy: true,
        outcome:
          'The extra 10 minutes is worth your peace of mind. You arrive home safe and sober.',
        copingTip:
          "Avoiding triggers isn't weakness—it's wisdom. Changing routes is a simple but powerful tool.",
      },
      {
        text: 'Call someone and stay on the phone while you drive past',
        isHealthy: true,
        outcome:
          "Your sponsor talks you through it. The store passes by while you're distracted. You feel supported and safe.",
        copingTip:
          'Having someone in your ear during triggering moments can be the difference between sobriety and relapse.',
      },
      {
        text: 'Stop in "just to buy a snack"',
        isHealthy: false,
        outcome:
          "You don't buy a snack. Standing among the bottles, you feel the familiar pull too strongly to resist.",
        copingTip:
          "There's never a good reason to enter triggering environments. Find another store for snacks.",
      },
    ],
    bestOptionIndex: 1,
  },
  {
    id: 'environmental_home',
    category: 'environmental',
    title: 'Found the Hidden Stash',
    description:
      "While cleaning, you find a bottle you hid and forgot about. It's right there in your hand. No one would know...",
    options: [
      {
        text: 'Put it back "just in case" you need it later',
        isHealthy: false,
        outcome:
          'Having it there becomes all you think about. The obsession grows until you give in.',
        copingTip:
          'Keeping substances "just in case" is reserving the option to relapse. True recovery means eliminating that option.',
      },
      {
        text: "Pour it out immediately—don't think, just act",
        isHealthy: true,
        outcome:
          'Watching it go down the drain is hard but empowering. You take a photo to share at your next meeting.',
        copingTip:
          'Quick action beats prolonged deliberation. The longer you hold it, the harder it gets to let go.',
      },
      {
        text: 'Have "just a taste" since you already found it',
        isHealthy: false,
        outcome:
          "The taste awakens everything you've been fighting. One taste becomes one drink, then more.",
        copingTip: 'There is no "just a taste." The disease is patient and will use any opening.',
      },
      {
        text: 'Call your sponsor before doing anything',
        isHealthy: true,
        outcome:
          'Your sponsor comes over immediately. Together you pour it out and talk about why you hid it. Honesty heals.',
        copingTip: 'Involving others in triggering moments provides accountability and support.',
      },
    ],
    bestOptionIndex: 1,
  },

  // Physical States
  {
    id: 'physical_halt',
    category: 'physical',
    title: 'The HALT Spiral',
    description:
      'You skipped lunch because of meetings, barely slept last night, and you\'re stressed about everything. You feel terrible. Your brain says "You need something to take the edge off."',
    options: [
      {
        text: 'Get something to take the edge off',
        isHealthy: false,
        outcome:
          'Using while in a vulnerable state intensifies everything. You wake up feeling worse than before.',
        copingTip:
          "HALT states (Hungry, Angry, Lonely, Tired) are when we're most vulnerable. Address the root cause, not the symptom.",
      },
      {
        text: 'Address the basics: eat something, take a short rest',
        isHealthy: true,
        outcome:
          'After a sandwich and a 20-minute power nap, you feel human again. The craving has passed.',
        copingTip:
          'Often what feels like a craving is actually just physical needs being unmet. Check HALT first.',
      },
      {
        text: 'Push through and ignore how you feel',
        isHealthy: false,
        outcome:
          "Ignoring your body's signals leads to a crash. In your depleted state, resisting temptation becomes nearly impossible.",
        copingTip: 'Ignoring physical needs is a form of self-harm that makes relapse more likely.',
      },
      {
        text: 'Practice the HALT check and call someone to talk',
        isHealthy: true,
        outcome:
          'Going through the HALT checklist helps you identify what you really need. Your support person validates your struggle.',
        copingTip:
          'HALT awareness is a powerful tool. Teach yourself to pause and assess before acting.',
      },
    ],
    bestOptionIndex: 1,
  },
  {
    id: 'physical_pain',
    category: 'physical',
    title: 'The Pain Prescription',
    description:
      "After minor surgery, the doctor offers you a prescription for opioid pain medication. You're in legitimate pain, but you know your history with substances.",
    options: [
      {
        text: 'Take the full prescription without telling anyone',
        isHealthy: false,
        outcome:
          "The pills feel familiar and good. Before the surgery pain is gone, you're already thinking about how to get more.",
        copingTip: 'Secrecy around medications is a red flag. Transparency protects recovery.',
      },
      {
        text: 'Be honest with your doctor about your recovery and ask for alternatives',
        isHealthy: true,
        outcome:
          'Your doctor appreciates your honesty and creates a non-opioid pain management plan. You heal without risking your sobriety.',
        copingTip:
          "Most doctors respect addiction recovery and can offer alternatives if you're honest.",
      },
      {
        text: 'Refuse all pain medication and suffer through it',
        isHealthy: false,
        outcome:
          "Unmanaged severe pain can actually trigger relapse. Suffering unnecessarily isn't recovery—it's martyrdom.",
        copingTip: 'You deserve pain management. The goal is to find safe options, not to suffer.',
      },
      {
        text: 'Take the prescription but have someone else hold and dispense it',
        isHealthy: true,
        outcome:
          "Your sponsor holds the pills and gives you only what's prescribed, when prescribed. You manage the pain without relapsing.",
        copingTip:
          'When legitimate medication is needed, having an accountability partner manage it adds a safety layer.',
      },
    ],
    bestOptionIndex: 1,
  },
  {
    id: 'physical_insomnia',
    category: 'physical',
    title: 'The Sleepless Night',
    description:
      "It's 3 AM and you've been tossing and turning for hours. You have an important meeting tomorrow. You remember how a drink always helped you sleep...",
    options: [
      {
        text: 'Have a nightcap to finally get some sleep',
        isHealthy: false,
        outcome:
          "You sleep, but poorly. Alcohol-induced sleep isn't restful. You feel groggy and your meeting goes badly anyway.",
        copingTip: 'Alcohol disrupts REM sleep, making sleep quality worse, not better.',
      },
      {
        text: 'Try relaxation techniques: breathing, meditation, progressive muscle relaxation',
        isHealthy: true,
        outcome:
          "You fall asleep to a guided sleep meditation. Even if you only get a few hours, they're quality hours.",
        copingTip: 'Learning healthy sleep tools pays dividends throughout recovery.',
      },
      {
        text: "Get up and do something calming until you're naturally tired",
        isHealthy: true,
        outcome:
          'Reading a boring book in dim light for 30 minutes makes you sleepy. You get back to sleep without substances.',
        copingTip:
          'Fighting insomnia increases anxiety. Sometimes accepting it and doing something calm helps more.',
      },
      {
        text: 'Take extra doses of sleep aids (even OTC ones)',
        isHealthy: false,
        outcome:
          'Abusing any substance to feel different is a slippery slope. The behavior pattern is the danger.',
        copingTip:
          'Watch for substance-seeking patterns even with "safe" substances like sleep aids.',
      },
    ],
    bestOptionIndex: 1,
  },
];

/**
 * Get scenarios by category
 */
export function getScenariosByCategory(category: ScenarioCategory): TriggerScenario[] {
  return TRIGGER_SCENARIOS.filter((s) => s.category === category);
}

/**
 * Get a random scenario for practice
 */
export function getRandomScenario(): TriggerScenario {
  const randomIndex = Math.floor(Math.random() * TRIGGER_SCENARIOS.length);
  return TRIGGER_SCENARIOS[randomIndex];
}

/**
 * Get scenario by ID
 */
export function getScenarioById(id: string): TriggerScenario | undefined {
  return TRIGGER_SCENARIOS.find((s) => s.id === id);
}
