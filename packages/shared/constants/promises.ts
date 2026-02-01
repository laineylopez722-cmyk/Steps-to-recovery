/**
 * The Promises of Recovery
 * Adapted from 12-step literature
 */

export interface Promise {
  id: string;
  number: number;
  text: string;
  reflection: string;
}

/**
 * The Promises (adapted from Big Book pages 83-84)
 * These are the spiritual benefits that come from working the steps
 */
export const PROMISES: Promise[] = [
  {
    id: 'promise-1',
    number: 1,
    text: 'We are going to know a new freedom and a new happiness.',
    reflection:
      'Have you begun to experience freedom from the chains of addiction? Are there moments of genuine happiness in your life now?',
  },
  {
    id: 'promise-2',
    number: 2,
    text: 'We will not regret the past nor wish to shut the door on it.',
    reflection:
      'Are you beginning to see your past—even the painful parts—as something that can help others? Have you started to find purpose in your story?',
  },
  {
    id: 'promise-3',
    number: 3,
    text: 'We will comprehend the word serenity.',
    reflection:
      'Have you experienced moments of true peace? Do you understand now what serenity means through direct experience?',
  },
  {
    id: 'promise-4',
    number: 4,
    text: 'We will know peace.',
    reflection:
      'Are there times now when your mind is at rest? Is peace becoming more familiar to you?',
  },
  {
    id: 'promise-5',
    number: 5,
    text: 'No matter how far down the scale we have gone, we will see how our experience can benefit others.',
    reflection:
      'Can you see now that your struggles have given you something valuable to offer? Has your pain become a tool for helping others?',
  },
  {
    id: 'promise-6',
    number: 6,
    text: 'That feeling of uselessness and self-pity will disappear.',
    reflection:
      'Are you feeling more useful these days? Has self-pity lost some of its grip on you?',
  },
  {
    id: 'promise-7',
    number: 7,
    text: 'We will lose interest in selfish things and gain interest in our fellows.',
    reflection:
      'Are you finding yourself thinking more about others? Is service becoming natural rather than forced?',
  },
  {
    id: 'promise-8',
    number: 8,
    text: 'Self-seeking will slip away.',
    reflection:
      'Are you noticing a shift from "what can I get?" to "what can I give?" Is your motivation becoming less self-centered?',
  },
  {
    id: 'promise-9',
    number: 9,
    text: 'Our whole attitude and outlook upon life will change.',
    reflection:
      "Do you see the world differently now? Has your perspective shifted in ways you couldn't have imagined before?",
  },
  {
    id: 'promise-10',
    number: 10,
    text: 'Fear of people and of economic insecurity will leave us.',
    reflection:
      'Are you less afraid in social situations? Is your anxiety about money and security decreasing?',
  },
  {
    id: 'promise-11',
    number: 11,
    text: 'We will intuitively know how to handle situations which used to baffle us.',
    reflection:
      'Are you finding that you know what to do in situations that used to confuse or overwhelm you? Is right action becoming more natural?',
  },
  {
    id: 'promise-12',
    number: 12,
    text: 'We will suddenly realize that God is doing for us what we could not do for ourselves.',
    reflection:
      'Have you had moments where you realized a Higher Power was working in your life? Can you see the hand of something greater guiding your recovery?',
  },
];

/**
 * The closing statement of the promises
 */
export const PROMISES_CLOSING = `Are these extravagant promises? We think not. They are being fulfilled among us—sometimes quickly, sometimes slowly. They will always materialize if we work for them.`;

/**
 * Get promise by ID
 */
export function getPromiseById(id: string): Promise | undefined {
  return PROMISES.find((p) => p.id === id);
}

/**
 * Get promise by number (1-12)
 */
export function getPromiseByNumber(number: number): Promise | undefined {
  return PROMISES.find((p) => p.number === number);
}
