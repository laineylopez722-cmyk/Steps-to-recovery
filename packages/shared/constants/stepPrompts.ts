/**
 * 12-Step Work Prompts
 *
 * Comprehensive guided prompts for each step of the 12-step program.
 * Based on traditional AA/NA step work guides with thorough reflection
 * questions for deep self-examination and spiritual growth.
 *
 * Structure:
 * - Each step has 25-80 questions (Step 4 is the longest)
 * - Questions are organized into sections for easier navigation
 * - All 12 steps are included; the UI may preview locked steps depending on phase
 *
 * @module constants/stepPrompts
 */

export interface StepSection {
  /** Section title (e.g., "Resentment Inventory", "Fear Inventory") */
  readonly title: string;
  /** Array of prompts in this section */
  readonly prompts: readonly string[];
}

export interface StepPrompt {
  /** Step number (1-12) */
  readonly step: number;
  /** Step title (e.g., "Powerlessness", "Hope") */
  readonly title: string;
  /** Core principle of this step (e.g., "Honesty", "Hope") */
  readonly principle: string;
  /** Full step description/statement */
  readonly description: string;
  /** Array of reflection prompts for this step (flat list for backward compatibility) */
  readonly prompts: readonly string[];
  /** Optional sections for organizing longer steps */
  readonly sections?: readonly StepSection[];
}

/** All 12-step prompts organized by step number */
export const STEP_PROMPTS: readonly StepPrompt[] = [
  // ============================================================================
  // STEP 1: POWERLESSNESS (~35 questions)
  // ============================================================================
  {
    step: 1,
    title: 'Powerlessness',
    principle: 'Honesty',
    description:
      'We admitted we were powerless over our addiction—that our lives had become unmanageable.',
    sections: [
      {
        title: 'Understanding Powerlessness',
        prompts: [
          'What does powerlessness mean to you in the context of your addiction?',
          "When did you first realize you couldn't control your use, even when you wanted to?",
          "Describe a time when you promised yourself you wouldn't use, but did anyway.",
          'Have you ever tried to control or limit your use? What happened?',
          'What rules did you make for yourself about using? How long did they last?',
          'Describe the mental obsession that precedes your using. What thoughts go through your mind?',
          'How has addiction affected your ability to make rational decisions?',
          'Have you ever done things while using that you never thought you would do?',
          'What evidence do you have that your willpower alone cannot solve your addiction?',
          'How has denial played a role in your addiction?',
        ],
      },
      {
        title: 'Physical Consequences',
        prompts: [
          'How has your addiction affected your physical health?',
          'Have you experienced withdrawal symptoms? Describe them.',
          'What physical risks have you taken because of your addiction?',
          'How has your sleep, appetite, or energy been affected?',
          'Have you neglected medical or dental care because of using?',
          'What accidents, injuries, or hospitalizations have resulted from your addiction?',
        ],
      },
      {
        title: 'Unmanageability in Relationships',
        prompts: [
          'How has your addiction affected your relationship with your spouse/partner?',
          'How has your addiction affected your relationships with your children (if applicable)?',
          'How has your addiction affected your relationships with parents and family?',
          'What friendships have you lost or damaged because of your addiction?',
          'How has your addiction affected your ability to be present for others?',
          'Describe a time when your addiction caused you to let someone down.',
          'Have you isolated yourself from loved ones? Why?',
        ],
      },
      {
        title: 'Unmanageability in Daily Life',
        prompts: [
          'How has your addiction affected your work or career?',
          'What financial problems have resulted from your addiction?',
          'How has your addiction affected your ability to meet basic responsibilities?',
          'Have you had legal problems related to your addiction?',
          'Describe how your living situation has been affected by your addiction.',
          'What opportunities have you missed because of your addiction?',
          'How has your addiction affected your self-care (hygiene, nutrition, exercise)?',
        ],
      },
      {
        title: 'Emotional and Spiritual Unmanageability',
        prompts: [
          'What emotions do you most often feel because of your addiction (guilt, shame, fear, etc.)?',
          'How has your self-esteem been affected by your addiction?',
          'Have you lost hope or felt despair because of your addiction?',
          'How has your addiction affected your values and the person you want to be?',
          'What dreams or goals have you abandoned because of your addiction?',
        ],
      },
    ],
    prompts: [
      'What does powerlessness mean to you in the context of your addiction?',
      "When did you first realize you couldn't control your use, even when you wanted to?",
      "Describe a time when you promised yourself you wouldn't use, but did anyway.",
      'Have you ever tried to control or limit your use? What happened?',
      'What rules did you make for yourself about using? How long did they last?',
      'Describe the mental obsession that precedes your using. What thoughts go through your mind?',
      'How has addiction affected your ability to make rational decisions?',
      'Have you ever done things while using that you never thought you would do?',
      'What evidence do you have that your willpower alone cannot solve your addiction?',
      'How has denial played a role in your addiction?',
      'How has your addiction affected your physical health?',
      'Have you experienced withdrawal symptoms? Describe them.',
      'What physical risks have you taken because of your addiction?',
      'How has your sleep, appetite, or energy been affected?',
      'Have you neglected medical or dental care because of using?',
      'What accidents, injuries, or hospitalizations have resulted from your addiction?',
      'How has your addiction affected your relationship with your spouse/partner?',
      'How has your addiction affected your relationships with your children (if applicable)?',
      'How has your addiction affected your relationships with parents and family?',
      'What friendships have you lost or damaged because of your addiction?',
      'How has your addiction affected your ability to be present for others?',
      'Describe a time when your addiction caused you to let someone down.',
      'Have you isolated yourself from loved ones? Why?',
      'How has your addiction affected your work or career?',
      'What financial problems have resulted from your addiction?',
      'How has your addiction affected your ability to meet basic responsibilities?',
      'Have you had legal problems related to your addiction?',
      'Describe how your living situation has been affected by your addiction.',
      'What opportunities have you missed because of your addiction?',
      'How has your addiction affected your self-care (hygiene, nutrition, exercise)?',
      'What emotions do you most often feel because of your addiction (guilt, shame, fear, etc.)?',
      'How has your self-esteem been affected by your addiction?',
      'Have you lost hope or felt despair because of your addiction?',
      'How has your addiction affected your values and the person you want to be?',
      'What dreams or goals have you abandoned because of your addiction?',
    ],
  },

  // ============================================================================
  // STEP 2: HOPE (~30 questions)
  // ============================================================================
  {
    step: 2,
    title: 'Hope',
    principle: 'Hope',
    description: 'Came to believe that a Power greater than ourselves could restore us to sanity.',
    sections: [
      {
        title: 'Understanding Insanity',
        prompts: [
          'What does "sanity" mean to you in the context of recovery?',
          'What insane behaviors have you engaged in due to your addiction?',
          'Describe times when you repeated the same behavior expecting different results.',
          'How has your thinking been distorted by addiction?',
          'What lies have you told yourself to justify your using?',
          'How has addiction caused you to act against your own values?',
          'What irrational decisions have you made while in your addiction?',
          'How has addiction affected your judgment and perception of reality?',
        ],
      },
      {
        title: 'Exploring Higher Power',
        prompts: [
          'What has been your past experience with the concept of God or a Higher Power?',
          'What does a Higher Power mean to you today?',
          'If you struggle with the concept of God, what other forms of Higher Power might you consider (the group, nature, the universe, love, etc.)?',
          'What qualities would your ideal Higher Power have?',
          'How do you feel about asking for help from a Power greater than yourself?',
          'What resistance or barriers do you have to believing in a Higher Power?',
          'Have you had any spiritual experiences, however small? Describe them.',
          'How might your concept of a Higher Power evolve as you work the steps?',
        ],
      },
      {
        title: 'Finding Hope',
        prompts: [
          'Have you seen others recover from addiction? How does that make you feel?',
          'What gives you hope that change is possible for you?',
          'What evidence have you seen that the 12-step program works?',
          'How might your life be different if you were restored to sanity?',
          'What would it mean to you to be free from the obsession to use?',
          'Who in recovery inspires you? Why?',
          'What small signs of hope have you noticed in your own life recently?',
        ],
      },
      {
        title: 'Willingness to Believe',
        prompts: [
          'Are you willing to believe that something greater than yourself can help you?',
          'What would it take for you to develop more faith?',
          'How open-minded are you willing to be about spiritual matters?',
          'What fears do you have about believing in a Higher Power?',
          'How might your life improve if you could rely on a Power greater than yourself?',
          'What does "coming to believe" look like for you? Is it a process or a moment?',
          'How can you practice being more open to spiritual help?',
        ],
      },
    ],
    prompts: [
      'What does "sanity" mean to you in the context of recovery?',
      'What insane behaviors have you engaged in due to your addiction?',
      'Describe times when you repeated the same behavior expecting different results.',
      'How has your thinking been distorted by addiction?',
      'What lies have you told yourself to justify your using?',
      'How has addiction caused you to act against your own values?',
      'What irrational decisions have you made while in your addiction?',
      'How has addiction affected your judgment and perception of reality?',
      'What has been your past experience with the concept of God or a Higher Power?',
      'What does a Higher Power mean to you today?',
      'If you struggle with the concept of God, what other forms of Higher Power might you consider (the group, nature, the universe, love, etc.)?',
      'What qualities would your ideal Higher Power have?',
      'How do you feel about asking for help from a Power greater than yourself?',
      'What resistance or barriers do you have to believing in a Higher Power?',
      'Have you had any spiritual experiences, however small? Describe them.',
      'How might your concept of a Higher Power evolve as you work the steps?',
      'Have you seen others recover from addiction? How does that make you feel?',
      'What gives you hope that change is possible for you?',
      'What evidence have you seen that the 12-step program works?',
      'How might your life be different if you were restored to sanity?',
      'What would it mean to you to be free from the obsession to use?',
      'Who in recovery inspires you? Why?',
      'What small signs of hope have you noticed in your own life recently?',
      'Are you willing to believe that something greater than yourself can help you?',
      'What would it take for you to develop more faith?',
      'How open-minded are you willing to be about spiritual matters?',
      'What fears do you have about believing in a Higher Power?',
      'How might your life improve if you could rely on a Power greater than yourself?',
      'What does "coming to believe" look like for you? Is it a process or a moment?',
      'How can you practice being more open to spiritual help?',
    ],
  },

  // ============================================================================
  // STEP 3: SURRENDER (~30 questions)
  // ============================================================================
  {
    step: 3,
    title: 'Surrender',
    principle: 'Faith',
    description:
      'Made a decision to turn our will and our lives over to the care of God as we understood Him.',
    sections: [
      {
        title: 'Understanding Self-Will',
        prompts: [
          'What does surrender mean to you?',
          'How has trying to control everything affected your life?',
          'In what areas of your life do you struggle most to let go of control?',
          'How has self-will run riot contributed to your problems?',
          "What happens when things don't go your way?",
          "How do you typically react when you can't control a situation?",
          'What are the consequences of always trying to be in charge?',
          'How has your need for control affected your relationships?',
        ],
      },
      {
        title: 'Fears About Surrender',
        prompts: [
          'What fears do you have about letting go of control?',
          'What do you think might happen if you truly surrender?',
          'Are you afraid of appearing weak? Why?',
          'What does your ego tell you about surrender?',
          'Have you ever surrendered in the past? What happened?',
          'What is the worst that could happen if you surrender your will?',
          'How does fear keep you stuck in old patterns?',
        ],
      },
      {
        title: 'Making the Decision',
        prompts: [
          'What is holding you back from making this decision?',
          'What would your life look like if you trusted a Higher Power?',
          'How is Step 3 a decision, not an action?',
          'Are you ready to stop fighting everything and everyone?',
          'What does "turning it over" mean to you practically?',
          'How can you practice surrendering your will on a daily basis?',
          'What specific areas of your life are you willing to turn over?',
        ],
      },
      {
        title: 'Living the Decision',
        prompts: [
          "How will you know when you've truly surrendered?",
          'What daily practices can help you maintain surrender?',
          'How can prayer or meditation support your surrender?',
          'What does "letting go and letting God" mean to you?',
          "How can you tell the difference between your will and God's will?",
          'What role does acceptance play in surrender?',
          'Write a personal Third Step prayer or statement of surrender.',
          'How will you remember to surrender when challenges arise?',
        ],
      },
    ],
    prompts: [
      'What does surrender mean to you?',
      'How has trying to control everything affected your life?',
      'In what areas of your life do you struggle most to let go of control?',
      'How has self-will run riot contributed to your problems?',
      "What happens when things don't go your way?",
      "How do you typically react when you can't control a situation?",
      'What are the consequences of always trying to be in charge?',
      'How has your need for control affected your relationships?',
      'What fears do you have about letting go of control?',
      'What do you think might happen if you truly surrender?',
      'Are you afraid of appearing weak? Why?',
      'What does your ego tell you about surrender?',
      'Have you ever surrendered in the past? What happened?',
      'What is the worst that could happen if you surrender your will?',
      'How does fear keep you stuck in old patterns?',
      'What is holding you back from making this decision?',
      'What would your life look like if you trusted a Higher Power?',
      'How is Step 3 a decision, not an action?',
      'Are you ready to stop fighting everything and everyone?',
      'What does "turning it over" mean to you practically?',
      'How can you practice surrendering your will on a daily basis?',
      'What specific areas of your life are you willing to turn over?',
      "How will you know when you've truly surrendered?",
      'What daily practices can help you maintain surrender?',
      'How can prayer or meditation support your surrender?',
      'What does "letting go and letting God" mean to you?',
      "How can you tell the difference between your will and God's will?",
      'What role does acceptance play in surrender?',
      'Write a personal Third Step prayer or statement of surrender.',
      'How will you remember to surrender when challenges arise?',
    ],
  },

  // ============================================================================
  // STEP 4: MORAL INVENTORY (~70 questions - longest step)
  // ============================================================================
  {
    step: 4,
    title: 'Inventory',
    principle: 'Courage',
    description: 'Made a searching and fearless moral inventory of ourselves.',
    sections: [
      {
        title: 'Resentment Inventory',
        prompts: [
          'List the people, institutions, or principles you resent. For each, answer the following:',
          'Who or what do you resent? What did they do?',
          'How did this affect you (self-esteem, security, ambitions, personal relations, finances)?',
          'What was your part in this resentment? What did you do to contribute?',
          'Were you selfish, dishonest, self-seeking, or frightened in this situation?',
          'What character defect does this resentment reveal in you?',
          'Are you holding onto justified anger? What would happen if you let it go?',
          'How has this resentment kept you sick or stuck?',
          'What would your life be like without this resentment?',
          "Who else do you resent that you haven't written about yet?",
          "Are there resentments you're afraid to write down? Why?",
          'What institutions (government, church, treatment centers) do you resent?',
          "What principles or ideas do you resent (justice, life, God's will)?",
        ],
      },
      {
        title: 'Fear Inventory',
        prompts: [
          'List your fears. For each, answer the following:',
          'What are you afraid of? Be specific.',
          'Why do you have this fear? Where did it come from?',
          'How has this fear affected your life?',
          'How has this fear caused you to harm yourself or others?',
          'What self-reliance has failed you regarding this fear?',
          'Are you willing to trust God to remove this fear?',
          'What other fears control your behavior?',
          'What fears are you afraid to admit?',
          'How have your fears led you to use or engage in unhealthy behavior?',
          'What would your life be like if you were free from these fears?',
        ],
      },
      {
        title: 'Sexual Conduct Inventory',
        prompts: [
          'List situations where you have been selfish, dishonest, or inconsiderate in sexual matters.',
          'Who did you hurt? How did you hurt them?',
          'Did you arouse jealousy, suspicion, or bitterness?',
          'Where were you at fault? What should you have done instead?',
          'What ideals do you have for your sexual conduct going forward?',
          'Have you been unfaithful in relationships? Describe the impact.',
          'Have you used people for sexual gratification without regard for their feelings?',
          'How has your addiction affected your sexual behavior?',
          'What shame or guilt do you carry about your sexual past?',
          "Are there sexual harms you're afraid to write about? Why?",
        ],
      },
      {
        title: 'Character Defects',
        prompts: [
          'Review your inventory and identify your character defects:',
          'How has selfishness manifested in your life? Give examples.',
          'How has dishonesty manifested in your life? Give examples.',
          'How has self-seeking manifested in your life? Give examples.',
          'How has fear controlled your decisions? Give examples.',
          'How has pride affected your relationships and choices?',
          'How has anger or rage affected your life?',
          'How has lust affected your behavior?',
          'How has greed or envy affected you?',
          'How has sloth or laziness affected your responsibilities?',
          'How has gluttony (excess in any area) affected you?',
          'What patterns do you see in your character defects?',
          'Which character defects are most damaging to you and others?',
          "Are there defects you don't want to admit to having?",
        ],
      },
      {
        title: 'Harms to Others',
        prompts: [
          'Who have you harmed and how?',
          'What lies have you told? To whom?',
          'What promises have you broken?',
          'What trust have you violated?',
          'Who have you stolen from (time, money, energy, peace of mind)?',
          'Who have you manipulated or used for your own purposes?',
          'Who have you physically harmed?',
          'Who have you verbally or emotionally abused?',
          'What responsibilities have you neglected?',
          'Who have you abandoned or been unavailable for?',
        ],
      },
      {
        title: 'Assets and Strengths',
        prompts: [
          'What positive qualities do you have?',
          'What accomplishments are you proud of?',
          'How have you helped others in your life?',
          'What values are important to you?',
          'What skills or talents do you have?',
          'What good qualities do others see in you?',
          'What does this inventory teach you about who you want to become?',
        ],
      },
    ],
    prompts: [
      'List the people, institutions, or principles you resent. For each, answer the following:',
      'Who or what do you resent? What did they do?',
      'How did this affect you (self-esteem, security, ambitions, personal relations, finances)?',
      'What was your part in this resentment? What did you do to contribute?',
      'Were you selfish, dishonest, self-seeking, or frightened in this situation?',
      'What character defect does this resentment reveal in you?',
      'Are you holding onto justified anger? What would happen if you let it go?',
      'How has this resentment kept you sick or stuck?',
      'What would your life be like without this resentment?',
      "Who else do you resent that you haven't written about yet?",
      "Are there resentments you're afraid to write down? Why?",
      'What institutions (government, church, treatment centers) do you resent?',
      "What principles or ideas do you resent (justice, life, God's will)?",
      'List your fears. For each, answer the following:',
      'What are you afraid of? Be specific.',
      'Why do you have this fear? Where did it come from?',
      'How has this fear affected your life?',
      'How has this fear caused you to harm yourself or others?',
      'What self-reliance has failed you regarding this fear?',
      'Are you willing to trust God to remove this fear?',
      'What other fears control your behavior?',
      'What fears are you afraid to admit?',
      'How have your fears led you to use or engage in unhealthy behavior?',
      'What would your life be like if you were free from these fears?',
      'List situations where you have been selfish, dishonest, or inconsiderate in sexual matters.',
      'Who did you hurt? How did you hurt them?',
      'Did you arouse jealousy, suspicion, or bitterness?',
      'Where were you at fault? What should you have done instead?',
      'What ideals do you have for your sexual conduct going forward?',
      'Have you been unfaithful in relationships? Describe the impact.',
      'Have you used people for sexual gratification without regard for their feelings?',
      'How has your addiction affected your sexual behavior?',
      'What shame or guilt do you carry about your sexual past?',
      "Are there sexual harms you're afraid to write about? Why?",
      'Review your inventory and identify your character defects:',
      'How has selfishness manifested in your life? Give examples.',
      'How has dishonesty manifested in your life? Give examples.',
      'How has self-seeking manifested in your life? Give examples.',
      'How has fear controlled your decisions? Give examples.',
      'How has pride affected your relationships and choices?',
      'How has anger or rage affected your life?',
      'How has lust affected your behavior?',
      'How has greed or envy affected you?',
      'How has sloth or laziness affected your responsibilities?',
      'How has gluttony (excess in any area) affected you?',
      'What patterns do you see in your character defects?',
      'Which character defects are most damaging to you and others?',
      "Are there defects you don't want to admit to having?",
      'Who have you harmed and how?',
      'What lies have you told? To whom?',
      'What promises have you broken?',
      'What trust have you violated?',
      'Who have you stolen from (time, money, energy, peace of mind)?',
      'Who have you manipulated or used for your own purposes?',
      'Who have you physically harmed?',
      'Who have you verbally or emotionally abused?',
      'What responsibilities have you neglected?',
      'Who have you abandoned or been unavailable for?',
      'What positive qualities do you have?',
      'What accomplishments are you proud of?',
      'How have you helped others in your life?',
      'What values are important to you?',
      'What skills or talents do you have?',
      'What good qualities do others see in you?',
      'What does this inventory teach you about who you want to become?',
    ],
  },

  // ============================================================================
  // STEP 5: ADMISSION (~25 questions)
  // ============================================================================
  {
    step: 5,
    title: 'Admission',
    principle: 'Integrity',
    description:
      'Admitted to God, to ourselves, and to another human being the exact nature of our wrongs.',
    sections: [
      {
        title: 'Preparing for Step 5',
        prompts: [
          'How do you feel about sharing your inventory with another person?',
          'What fears do you have about doing Step 5?',
          'Who have you chosen to hear your Fifth Step? Why this person?',
          'What qualities should a Fifth Step listener have?',
          "Is there anything you're tempted to leave out? Why?",
          'Why is it important to share with another human being, not just God?',
          'What might happen if you skip or rush through Step 5?',
        ],
      },
      {
        title: 'The Nature of Our Wrongs',
        prompts: [
          'What does "the exact nature of our wrongs" mean to you?',
          'Beyond specific acts, what underlying patterns or defects do you see?',
          'What were your motives behind your harmful actions?',
          'How did fear drive many of your wrongs?',
          'How did selfishness or self-centeredness drive your wrongs?',
          'What common threads run through your inventory?',
        ],
      },
      {
        title: 'During and After Step 5',
        prompts: [
          'What parts of your inventory are hardest to admit out loud?',
          'How did you feel during your Fifth Step?',
          'What insights or revelations came from sharing your inventory?',
          'What did your Fifth Step listener reflect back to you?',
          'Did anything surprise you about the experience?',
          'How did you feel after completing your Fifth Step?',
          'What did you learn about yourself through this process?',
        ],
      },
      {
        title: 'Moving Forward',
        prompts: [
          'Was there anything you held back that you need to go back and share?',
          'How has sharing your inventory changed your relationship with yourself?',
          'How has it affected your relationship with your Higher Power?',
          'What relief or freedom have you experienced?',
          'How will this step help you stay accountable in recovery?',
        ],
      },
    ],
    prompts: [
      'How do you feel about sharing your inventory with another person?',
      'What fears do you have about doing Step 5?',
      'Who have you chosen to hear your Fifth Step? Why this person?',
      'What qualities should a Fifth Step listener have?',
      "Is there anything you're tempted to leave out? Why?",
      'Why is it important to share with another human being, not just God?',
      'What might happen if you skip or rush through Step 5?',
      'What does "the exact nature of our wrongs" mean to you?',
      'Beyond specific acts, what underlying patterns or defects do you see?',
      'What were your motives behind your harmful actions?',
      'How did fear drive many of your wrongs?',
      'How did selfishness or self-centeredness drive your wrongs?',
      'What common threads run through your inventory?',
      'What parts of your inventory are hardest to admit out loud?',
      'How did you feel during your Fifth Step?',
      'What insights or revelations came from sharing your inventory?',
      'What did your Fifth Step listener reflect back to you?',
      'Did anything surprise you about the experience?',
      'How did you feel after completing your Fifth Step?',
      'What did you learn about yourself through this process?',
      'Was there anything you held back that you need to go back and share?',
      'How has sharing your inventory changed your relationship with yourself?',
      'How has it affected your relationship with your Higher Power?',
      'What relief or freedom have you experienced?',
      'How will this step help you stay accountable in recovery?',
    ],
  },

  // ============================================================================
  // STEP 6: READINESS (~25 questions)
  // ============================================================================
  {
    step: 6,
    title: 'Readiness',
    principle: 'Willingness',
    description: 'Were entirely ready to have God remove all these defects of character.',
    sections: [
      {
        title: 'Examining Character Defects',
        prompts: [
          'Review your Fourth Step. What character defects did you identify?',
          'Which character defects have caused you the most problems?',
          'Which defects are you most ready to let go of? Why?',
          'Which defects are you holding onto? Why?',
          'How have your defects "served" you in the past?',
          'What secondary gains have you received from your defects?',
          'What would you lose if these defects were removed?',
        ],
      },
      {
        title: 'Understanding Willingness',
        prompts: [
          'What does being "entirely ready" mean to you?',
          'What is the difference between wanting defects removed and being ready for their removal?',
          'How is Step 6 about willingness, not perfection?',
          'What is blocking your willingness to change?',
          'Are you trying to remove defects yourself, or are you willing to let God do it?',
          'What fears do you have about becoming a different person?',
        ],
      },
      {
        title: 'Becoming Ready',
        prompts: [
          'What would your life be like without these defects?',
          'How might your relationships improve?',
          'How might your peace of mind improve?',
          'What positive qualities might replace your defects?',
          'Are you willing to feel uncomfortable during the process of change?',
          'How can you become more willing where you are resistant?',
        ],
      },
      {
        title: 'Spiritual Preparation',
        prompts: [
          'What does it mean to have God remove your defects (versus removing them yourself)?',
          'How does humility relate to Step 6?',
          'What role does patience play in this step?',
          'Are you willing to let go of the timeline for your transformation?',
          'Write a prayer or meditation expressing your willingness.',
          "How will you know when you're truly ready?",
        ],
      },
    ],
    prompts: [
      'Review your Fourth Step. What character defects did you identify?',
      'Which character defects have caused you the most problems?',
      'Which defects are you most ready to let go of? Why?',
      'Which defects are you holding onto? Why?',
      'How have your defects "served" you in the past?',
      'What secondary gains have you received from your defects?',
      'What would you lose if these defects were removed?',
      'What does being "entirely ready" mean to you?',
      'What is the difference between wanting defects removed and being ready for their removal?',
      'How is Step 6 about willingness, not perfection?',
      'What is blocking your willingness to change?',
      'Are you trying to remove defects yourself, or are you willing to let God do it?',
      'What fears do you have about becoming a different person?',
      'What would your life be like without these defects?',
      'How might your relationships improve?',
      'How might your peace of mind improve?',
      'What positive qualities might replace your defects?',
      'Are you willing to feel uncomfortable during the process of change?',
      'How can you become more willing where you are resistant?',
      'What does it mean to have God remove your defects (versus removing them yourself)?',
      'How does humility relate to Step 6?',
      'What role does patience play in this step?',
      'Are you willing to let go of the timeline for your transformation?',
      'Write a prayer or meditation expressing your willingness.',
      "How will you know when you're truly ready?",
    ],
  },

  // ============================================================================
  // STEP 7: HUMILITY (~25 questions)
  // ============================================================================
  {
    step: 7,
    title: 'Humility',
    principle: 'Humility',
    description: 'Humbly asked Him to remove our shortcomings.',
    sections: [
      {
        title: 'Understanding Humility',
        prompts: [
          'What does humility mean to you?',
          'How is humility different from humiliation?',
          'How is humility different from low self-esteem?',
          'What does it mean to be "right-sized"?',
          'How has pride caused problems in your life?',
          "What happens when you think you're better than others?",
          "What happens when you think you're worse than others?",
        ],
      },
      {
        title: 'Asking for Help',
        prompts: [
          'Why is it important to ask humbly for the removal of shortcomings?',
          'What is the difference between asking and demanding?',
          'How do you feel about asking for help?',
          "Why can't you remove your shortcomings on your own?",
          'What does it mean to be humble before your Higher Power?',
          'Write a Seventh Step prayer in your own words.',
        ],
      },
      {
        title: 'The Process of Change',
        prompts: [
          'How are shortcomings removed? Instantly or gradually?',
          'What is your role in the removal of shortcomings?',
          'How can you cooperate with your Higher Power in this process?',
          'What shortcomings are still present? How are you working on them?',
          'How do you handle it when shortcomings reappear?',
          'What does progress, not perfection, mean in this context?',
        ],
      },
      {
        title: 'Living with Humility',
        prompts: [
          'How can you practice humility in your daily life?',
          'What triggers your pride or ego?',
          'How can you respond differently to those triggers?',
          'How does humility improve your relationships?',
          'How does humility support your recovery?',
          'What does a humble life look like for you?',
        ],
      },
    ],
    prompts: [
      'What does humility mean to you?',
      'How is humility different from humiliation?',
      'How is humility different from low self-esteem?',
      'What does it mean to be "right-sized"?',
      'How has pride caused problems in your life?',
      "What happens when you think you're better than others?",
      "What happens when you think you're worse than others?",
      'Why is it important to ask humbly for the removal of shortcomings?',
      'What is the difference between asking and demanding?',
      'How do you feel about asking for help?',
      "Why can't you remove your shortcomings on your own?",
      'What does it mean to be humble before your Higher Power?',
      'Write a Seventh Step prayer in your own words.',
      'How are shortcomings removed? Instantly or gradually?',
      'What is your role in the removal of shortcomings?',
      'How can you cooperate with your Higher Power in this process?',
      'What shortcomings are still present? How are you working on them?',
      'How do you handle it when shortcomings reappear?',
      'What does progress, not perfection, mean in this context?',
      'How can you practice humility in your daily life?',
      'What triggers your pride or ego?',
      'How can you respond differently to those triggers?',
      'How does humility improve your relationships?',
      'How does humility support your recovery?',
      'What does a humble life look like for you?',
    ],
  },

  // ============================================================================
  // STEP 8: WILLINGNESS TO AMEND (~35 questions)
  // ============================================================================
  {
    step: 8,
    title: 'Willingness to Amend',
    principle: 'Brotherly Love',
    description:
      'Made a list of all persons we had harmed, and became willing to make amends to them all.',
    sections: [
      {
        title: 'Creating the List',
        prompts: [
          'Review your Fourth Step. List all the people you have harmed.',
          'Have you harmed family members? Who and how?',
          'Have you harmed friends or romantic partners? Who and how?',
          'Have you harmed employers, coworkers, or business associates? Who and how?',
          'Have you harmed strangers or members of your community? Who and how?',
          'Have you harmed institutions (companies, organizations)? Which ones and how?',
          "Are there people you've harmed that you've forgotten? Take time to remember.",
          "What harms have you caused that you haven't admitted to yourself?",
        ],
      },
      {
        title: 'Understanding the Harm',
        prompts: [
          'For each person, what was your part in causing harm?',
          'What type of harm did you cause (physical, emotional, financial, spiritual)?',
          'What were the consequences of your actions for each person?',
          'How did your addiction contribute to these harms?',
          'What lies did you tell yourself to minimize the harm you caused?',
          "Are there harms you caused that you've justified? How?",
        ],
      },
      {
        title: 'Examining Willingness',
        prompts: [
          "Are there people you're not yet willing to make amends to? Who and why?",
          'What fears do you have about making amends?',
          'What resentments are blocking your willingness?',
          'Are you willing to put aside your pride to make amends?',
          'How do you feel about the prospect of making amends?',
          'What would happen if you never made amends to these people?',
        ],
      },
      {
        title: 'Special Considerations',
        prompts: [
          'What amends might you owe to yourself?',
          'Are there deceased persons you need to include? How will you address that?',
          "Are there people you've lost contact with? How might you find them?",
          'Are there amends that might cause harm to others? Flag these for discussion with your sponsor.',
          'What about amends to people who have also harmed you?',
          "How will you handle amends to people who don't want contact with you?",
        ],
      },
      {
        title: 'Becoming Willing',
        prompts: [
          'What does becoming "willing to make amends to them all" require of you?',
          'How can you become more willing where you are resistant?',
          'What prayers or meditations might help you develop willingness?',
          'How does willingness in Step 8 prepare you for action in Step 9?',
          'Are you willing to make amends regardless of whether the other person apologizes to you?',
        ],
      },
    ],
    prompts: [
      'Review your Fourth Step. List all the people you have harmed.',
      'Have you harmed family members? Who and how?',
      'Have you harmed friends or romantic partners? Who and how?',
      'Have you harmed employers, coworkers, or business associates? Who and how?',
      'Have you harmed strangers or members of your community? Who and how?',
      'Have you harmed institutions (companies, organizations)? Which ones and how?',
      "Are there people you've harmed that you've forgotten? Take time to remember.",
      "What harms have you caused that you haven't admitted to yourself?",
      'For each person, what was your part in causing harm?',
      'What type of harm did you cause (physical, emotional, financial, spiritual)?',
      'What were the consequences of your actions for each person?',
      'How did your addiction contribute to these harms?',
      'What lies did you tell yourself to minimize the harm you caused?',
      "Are there harms you caused that you've justified? How?",
      "Are there people you're not yet willing to make amends to? Who and why?",
      'What fears do you have about making amends?',
      'What resentments are blocking your willingness?',
      'Are you willing to put aside your pride to make amends?',
      'How do you feel about the prospect of making amends?',
      'What would happen if you never made amends to these people?',
      'What amends might you owe to yourself?',
      'Are there deceased persons you need to include? How will you address that?',
      "Are there people you've lost contact with? How might you find them?",
      'Are there amends that might cause harm to others? Flag these for discussion with your sponsor.',
      'What about amends to people who have also harmed you?',
      "How will you handle amends to people who don't want contact with you?",
      'What does becoming "willing to make amends to them all" require of you?',
      'How can you become more willing where you are resistant?',
      'What prayers or meditations might help you develop willingness?',
      'How does willingness in Step 8 prepare you for action in Step 9?',
      'Are you willing to make amends regardless of whether the other person apologizes to you?',
    ],
  },

  // ============================================================================
  // STEP 9: MAKING AMENDS (~35 questions)
  // ============================================================================
  {
    step: 9,
    title: 'Making Amends',
    principle: 'Justice',
    description:
      'Made direct amends to such people wherever possible, except when to do so would injure them or others.',
    sections: [
      {
        title: 'Preparing to Make Amends',
        prompts: [
          'Have you discussed your amends list with your sponsor?',
          'What does "direct amends" mean? How is it different from an apology?',
          'What amends are you ready to make now?',
          'How will you approach each person?',
          'What will you say? Practice your amends.',
          'What outcome are you hoping for? Can you let go of expectations?',
          'Are you prepared for any response, including rejection?',
        ],
      },
      {
        title: 'Types of Amends',
        prompts: [
          'Which amends require face-to-face conversation?',
          'Which amends require financial restitution?',
          'Which amends require changed behavior (living amends)?',
          'Are there amends that should be made in writing?',
          'What living amends are you making through your changed behavior?',
          'What ongoing amends do you need to make (to spouse, children, parents)?',
        ],
      },
      {
        title: 'Amends That Might Cause Harm',
        prompts: [
          'Are there amends that might cause harm to the other person? What are they?',
          'Are there amends that might cause harm to third parties? What are they?',
          'How do you decide when an amend would cause more harm than good?',
          'What is the difference between uncomfortable amends and harmful amends?',
          "Have you consulted with your sponsor about amends you're unsure about?",
          'What alternative ways can you make amends when direct amends would cause harm?',
        ],
      },
      {
        title: 'Making the Amends',
        prompts: [
          'Which amends have you made? How did they go?',
          'How did you feel before, during, and after making each amend?',
          'What responses did you receive?',
          'Were there any surprises?',
          'How did making amends affect your relationship with each person?',
          'What did you learn from the experience of making amends?',
        ],
      },
      {
        title: 'Challenging Situations',
        prompts: [
          'What do you do if someone refuses to accept your amends?',
          'How do you make amends to someone who has died?',
          'How do you make amends to someone you cannot locate?',
          'How do you make amends to yourself?',
          'What if you cannot afford financial restitution?',
          'Which amends are you still preparing to make?',
        ],
      },
      {
        title: 'The Impact of Amends',
        prompts: [
          'How has making amends affected your recovery?',
          'How has it affected your self-respect?',
          'How has it changed your relationships?',
          'What freedom have you experienced from cleaning up your past?',
          "Are there any amends you've been avoiding? Why?",
        ],
      },
    ],
    prompts: [
      'Have you discussed your amends list with your sponsor?',
      'What does "direct amends" mean? How is it different from an apology?',
      'What amends are you ready to make now?',
      'How will you approach each person?',
      'What will you say? Practice your amends.',
      'What outcome are you hoping for? Can you let go of expectations?',
      'Are you prepared for any response, including rejection?',
      'Which amends require face-to-face conversation?',
      'Which amends require financial restitution?',
      'Which amends require changed behavior (living amends)?',
      'Are there amends that should be made in writing?',
      'What living amends are you making through your changed behavior?',
      'What ongoing amends do you need to make (to spouse, children, parents)?',
      'Are there amends that might cause harm to the other person? What are they?',
      'Are there amends that might cause harm to third parties? What are they?',
      'How do you decide when an amend would cause more harm than good?',
      'What is the difference between uncomfortable amends and harmful amends?',
      "Have you consulted with your sponsor about amends you're unsure about?",
      'What alternative ways can you make amends when direct amends would cause harm?',
      'Which amends have you made? How did they go?',
      'How did you feel before, during, and after making each amend?',
      'What responses did you receive?',
      'Were there any surprises?',
      'How did making amends affect your relationship with each person?',
      'What did you learn from the experience of making amends?',
      'What do you do if someone refuses to accept your amends?',
      'How do you make amends to someone who has died?',
      'How do you make amends to someone you cannot locate?',
      'How do you make amends to yourself?',
      'What if you cannot afford financial restitution?',
      'Which amends are you still preparing to make?',
      'How has making amends affected your recovery?',
      'How has it affected your self-respect?',
      'How has it changed your relationships?',
      'What freedom have you experienced from cleaning up your past?',
      "Are there any amends you've been avoiding? Why?",
    ],
  },

  // ============================================================================
  // STEP 10: DAILY INVENTORY (~25 questions)
  // ============================================================================
  {
    step: 10,
    title: 'Daily Inventory',
    principle: 'Perseverance',
    description:
      'Continued to take personal inventory and when we were wrong promptly admitted it.',
    sections: [
      {
        title: 'Daily Self-Examination',
        prompts: [
          'What went well today?',
          'What am I grateful for today?',
          'Where was I resentful today?',
          'Where was I selfish today?',
          'Where was I dishonest today?',
          'Where was I afraid today?',
          'Did I harm anyone today? How?',
          'Was I kind and loving today?',
        ],
      },
      {
        title: 'Promptly Admitting Wrong',
        prompts: [
          'Do I owe anyone an apology or amends from today?',
          'What does "promptly admitted it" mean to you?',
          'Why is it important not to let wrongs accumulate?',
          "How do you handle it when you realize you've been wrong?",
          "What happens when you don't admit your wrongs promptly?",
          'How has promptly admitting wrongs improved your relationships?',
        ],
      },
      {
        title: 'Spot-Check Inventory',
        prompts: [
          'Do you pause during the day to check your motives and behavior?',
          'What triggers remind you to do a spot-check inventory?',
          "How can you recognize when you're off track during the day?",
          'What do you do when you notice a character defect arising?',
          'How do you reset your attitude during the day?',
        ],
      },
      {
        title: 'Maintaining Recovery',
        prompts: [
          'What could I have done better today?',
          'What do I need to do differently tomorrow?',
          'How did I practice the principles of recovery today?',
          'Did I help another addict/alcoholic today?',
          'How am I feeling about my recovery right now?',
          'What is my plan for continued growth?',
        ],
      },
    ],
    prompts: [
      'What went well today?',
      'What am I grateful for today?',
      'Where was I resentful today?',
      'Where was I selfish today?',
      'Where was I dishonest today?',
      'Where was I afraid today?',
      'Did I harm anyone today? How?',
      'Was I kind and loving today?',
      'Do I owe anyone an apology or amends from today?',
      'What does "promptly admitted it" mean to you?',
      'Why is it important not to let wrongs accumulate?',
      "How do you handle it when you realize you've been wrong?",
      "What happens when you don't admit your wrongs promptly?",
      'How has promptly admitting wrongs improved your relationships?',
      'Do you pause during the day to check your motives and behavior?',
      'What triggers remind you to do a spot-check inventory?',
      "How can you recognize when you're off track during the day?",
      'What do you do when you notice a character defect arising?',
      'How do you reset your attitude during the day?',
      'What could I have done better today?',
      'What do I need to do differently tomorrow?',
      'How did I practice the principles of recovery today?',
      'Did I help another addict/alcoholic today?',
      'How am I feeling about my recovery right now?',
      'What is my plan for continued growth?',
    ],
  },

  // ============================================================================
  // STEP 11: SPIRITUAL GROWTH (~25 questions)
  // ============================================================================
  {
    step: 11,
    title: 'Spiritual Growth',
    principle: 'Spiritual Awareness',
    description:
      'Sought through prayer and meditation to improve our conscious contact with God as we understood Him, praying only for knowledge of His will for us and the power to carry that out.',
    sections: [
      {
        title: 'Prayer Practice',
        prompts: [
          'What is your current prayer practice?',
          'What does prayer mean to you?',
          'How do you pray? Formal prayers, informal conversation, both?',
          'What do you pray for?',
          "Why does the step say to pray only for knowledge of God's will and power to carry it out?",
          'How has your prayer practice evolved in recovery?',
          'What obstacles prevent you from praying regularly?',
        ],
      },
      {
        title: 'Meditation Practice',
        prompts: [
          'What is your current meditation practice?',
          'What does meditation mean to you?',
          'What forms of meditation have you tried?',
          'What did you experience in meditation today/recently?',
          'How do you quiet your mind?',
          'What benefits have you noticed from meditation?',
          'What obstacles prevent you from meditating regularly?',
        ],
      },
      {
        title: 'Conscious Contact',
        prompts: [
          'What does "conscious contact" with your Higher Power mean to you?',
          "How do you know when you're in conscious contact?",
          'How has your understanding of a Higher Power evolved in recovery?',
          'How do you seek guidance in your daily life?',
          'What messages or insights have you received?',
          "How do you discern God's will from your own will?",
        ],
      },
      {
        title: 'Integrating Spirituality',
        prompts: [
          'How do you incorporate spirituality into your daily routine?',
          'Do you have morning and evening spiritual practices? Describe them.',
          'How does your spiritual practice support your recovery?',
          'How does it help you deal with difficult emotions or situations?',
          'What would you like to improve about your spiritual practice?',
        ],
      },
    ],
    prompts: [
      'What is your current prayer practice?',
      'What does prayer mean to you?',
      'How do you pray? Formal prayers, informal conversation, both?',
      'What do you pray for?',
      "Why does the step say to pray only for knowledge of God's will and power to carry it out?",
      'How has your prayer practice evolved in recovery?',
      'What obstacles prevent you from praying regularly?',
      'What is your current meditation practice?',
      'What does meditation mean to you?',
      'What forms of meditation have you tried?',
      'What did you experience in meditation today/recently?',
      'How do you quiet your mind?',
      'What benefits have you noticed from meditation?',
      'What obstacles prevent you from meditating regularly?',
      'What does "conscious contact" with your Higher Power mean to you?',
      "How do you know when you're in conscious contact?",
      'How has your understanding of a Higher Power evolved in recovery?',
      'How do you seek guidance in your daily life?',
      'What messages or insights have you received?',
      "How do you discern God's will from your own will?",
      'How do you incorporate spirituality into your daily routine?',
      'Do you have morning and evening spiritual practices? Describe them.',
      'How does your spiritual practice support your recovery?',
      'How does it help you deal with difficult emotions or situations?',
      'What would you like to improve about your spiritual practice?',
    ],
  },

  // ============================================================================
  // STEP 12: SERVICE (~25 questions)
  // ============================================================================
  {
    step: 12,
    title: 'Service',
    principle: 'Service',
    description:
      'Having had a spiritual awakening as the result of these Steps, we tried to carry this message to others, and to practice these principles in all our affairs.',
    sections: [
      {
        title: 'Spiritual Awakening',
        prompts: [
          'What does a spiritual awakening mean to you?',
          'How has your life changed as a result of working the steps?',
          'What was your spiritual condition when you started recovery?',
          'What is your spiritual condition now?',
          'What specific changes have occurred in your thinking, attitudes, and behavior?',
          "How do you know you've had a spiritual awakening?",
          'Is spiritual awakening a moment or a process for you?',
        ],
      },
      {
        title: 'Carrying the Message',
        prompts: [
          'How do you carry the message to those still suffering?',
          'What is "the message" that we carry?',
          'Have you sponsored others or helped newcomers? Describe your experience.',
          'How do you share your story with others?',
          'What service commitments do you have in your recovery community?',
          'How does helping others help your own recovery?',
          'What fears do you have about carrying the message?',
        ],
      },
      {
        title: 'Practicing Principles',
        prompts: [
          'What does "practice these principles in all our affairs" mean to you?',
          'How do you practice honesty in your daily life?',
          'How do you practice hope when facing challenges?',
          'How do you practice faith and surrender?',
          'How do you practice courage and integrity?',
          'How do you practice willingness and humility?',
          'How do you practice love and justice?',
        ],
      },
      {
        title: 'Living Recovery',
        prompts: [
          'How is your home life different today?',
          'How is your work life different today?',
          'How are your relationships different today?',
          'How do you handle difficult situations differently now?',
          'What does recovery mean to you today?',
          'What are your goals for continued growth in recovery?',
        ],
      },
    ],
    prompts: [
      'What does a spiritual awakening mean to you?',
      'How has your life changed as a result of working the steps?',
      'What was your spiritual condition when you started recovery?',
      'What is your spiritual condition now?',
      'What specific changes have occurred in your thinking, attitudes, and behavior?',
      "How do you know you've had a spiritual awakening?",
      'Is spiritual awakening a moment or a process for you?',
      'How do you carry the message to those still suffering?',
      'What is "the message" that we carry?',
      'Have you sponsored others or helped newcomers? Describe your experience.',
      'How do you share your story with others?',
      'What service commitments do you have in your recovery community?',
      'How does helping others help your own recovery?',
      'What fears do you have about carrying the message?',
      'What does "practice these principles in all our affairs" mean to you?',
      'How do you practice honesty in your daily life?',
      'How do you practice hope when facing challenges?',
      'How do you practice faith and surrender?',
      'How do you practice courage and integrity?',
      'How do you practice willingness and humility?',
      'How do you practice love and justice?',
      'How is your home life different today?',
      'How is your work life different today?',
      'How are your relationships different today?',
      'How do you handle difficult situations differently now?',
      'What does recovery mean to you today?',
      'What are your goals for continued growth in recovery?',
    ],
  },
];

/**
 * Get prompts for a specific step
 *
 * @param step - Step number (1-12)
 * @returns Step prompt object if found, undefined otherwise
 * @example
 * ```ts
 * const step1 = getStepPrompts(1);
 * // Returns Step 1 prompts with title "Powerlessness"
 * ```
 */
export function getStepPrompts(step: number): StepPrompt | undefined {
  if (step < 1 || step > 12 || !Number.isInteger(step)) {
    return undefined;
  }
  return STEP_PROMPTS.find((s) => s.step === step);
}

/**
 * Get a specific section from a step
 *
 * @param step - Step number (1-12)
 * @param sectionIndex - Index of the section (0-based)
 * @returns Section object if found, undefined otherwise
 */
export function getStepSection(step: number, sectionIndex: number): StepSection | undefined {
  const stepData = getStepPrompts(step);
  if (!stepData?.sections) return undefined;
  return stepData.sections[sectionIndex];
}

/**
 * Get the total number of questions for a step
 *
 * @param step - Step number (1-12)
 * @returns Total number of prompts in the step
 */
export function getStepQuestionCount(step: number): number {
  const stepData = getStepPrompts(step);
  return stepData?.prompts.length ?? 0;
}

/**
 * Get total questions across all steps
 *
 * @returns Total number of questions in all 12 steps
 */
export function getTotalQuestionCount(): number {
  return STEP_PROMPTS.reduce((sum, step) => sum + step.prompts.length, 0);
}

/**
 * Check if a step number is valid
 *
 * @param step - Step number to validate
 * @returns True if step is between 1 and 12
 */
export function isValidStepNumber(step: number): boolean {
  return Number.isInteger(step) && step >= 1 && step <= 12;
}

/**
 * Get all step numbers that have prompts
 *
 * @returns Array of step numbers (1-12)
 */
export function getAllStepNumbers(): readonly number[] {
  return STEP_PROMPTS.map((s) => s.step);
}
