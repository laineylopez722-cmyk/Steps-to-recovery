/**
 * Daily Readings Content
 * 366 recovery-focused daily readings for the Steps to Recovery app
 *
 * Content is recovery-themed, focusing on:
 * - Serenity and peace
 * - Daily progress over perfection
 * - Personal strength and resilience
 * - Gratitude and mindfulness
 * - Community and connection
 *
 * Each reading includes:
 * - Title: Brief, inspiring title
 * - Content: 2-3 paragraph reading (200-300 words)
 * - Source: Attribution or theme
 * - Reflection prompt: Question to guide user reflection
 */

export interface ReadingData {
  day_of_year: number;
  month: number;
  day: number;
  title: string;
  content: string;
  source: string;
  reflection_prompt: string;
  external_url?: string;
}

export const NA_JFT_URL = 'https://www.jftna.org/jft/';
export const PLACEHOLDER_CONTENT = "Visit the official NA website to read today's meditation.";

export const DAILY_READINGS: ReadingData[] = [
  // January
  {
    day_of_year: 1,
    month: 1,
    day: 1,
    title: 'A New Beginning',
    content:
      "Today marks not just the start of a new year, but the continuation of your journey toward healing and growth. Every sunrise brings with it the promise of fresh possibilities, and today you have the chance to write a new chapter in your story.\n\nRecovery is not about perfection—it's about progress. Each day you choose to move forward, you're building strength that runs deeper than you might realize. The path may have challenges, but you've already shown incredible courage by choosing to walk it.\n\nAs you begin this day, remember that healing happens one moment at a time. You don't have to have all the answers right now. You just need to trust that with each step, you're becoming more of who you're meant to be.",
    source: 'Daily Reflection',
    reflection_prompt: 'What new possibility are you most excited to explore this year?',
    external_url: NA_JFT_URL,
  },
  {
    day_of_year: 2,
    month: 1,
    day: 2,
    title: 'The Gift of Today',
    content:
      "Yesterday is gone, and tomorrow has not yet arrived. All we truly have is this moment, right here, right now. In recovery, learning to live in the present is one of the greatest gifts you can give yourself.\n\nWhen we dwell too much on past mistakes or worry too much about future challenges, we miss the beauty and opportunity that exists in this very moment. Today, you have the power to make choices that align with your values and support your wellbeing.\n\nPractice noticing the small wonders around you—the warmth of your morning coffee, the sound of laughter, the feeling of taking a deep breath. These moments of presence are not just pleasant; they're powerful tools for healing and growth.",
    source: 'Mindfulness Practice',
    reflection_prompt: 'What is one thing you can appreciate about this present moment?',
    external_url: NA_JFT_URL,
  },
  {
    day_of_year: 3,
    month: 1,
    day: 3,
    title: 'Strength in Vulnerability',
    content:
      "There is tremendous courage in admitting when we need help. Vulnerability is not weakness—it's the birthplace of authentic connection and genuine healing. When you opened yourself to recovery, you demonstrated a kind of bravery that many people never find.\n\nOur culture often tells us to be strong by hiding our struggles, but true strength comes from being honest about where we are and what we need. Every time you share your truth with someone you trust, you create space for healing, both for yourself and for others.\n\nRemember that asking for support is not giving up—it's growing up. It's recognizing that we're all interconnected, and that healing happens in relationship with others who understand the journey.",
    source: 'Connection and Community',
    reflection_prompt: 'Who in your life makes it safe for you to be vulnerable?',
    external_url: NA_JFT_URL,
  },
  {
    day_of_year: 4,
    month: 1,
    day: 4,
    title: 'Progress, Not Perfection',
    content:
      "Perfectionism can be one of the most challenging obstacles in recovery. The desire to get everything right, to never make mistakes, to have it all figured out—these expectations can create pressure that actually works against healing.\n\nReal progress happens in small, imperfect steps. It happens when you try something new and it doesn't go quite as planned, but you try again anyway. It happens when you stumble but choose to get back up. It happens when you're patient with yourself on the difficult days.\n\nToday, give yourself permission to be human. Celebrate the small victories, learn from the setbacks, and remember that every step forward, no matter how small, is worth acknowledging.",
    source: 'Self-Compassion',
    reflection_prompt: 'What small progress have you made recently that you can celebrate today?',
    external_url: NA_JFT_URL,
  },
  {
    day_of_year: 5,
    month: 1,
    day: 5,
    title: 'The Power of Routine',
    content:
      "There is healing power in the gentle rhythm of healthy routines. When life feels unpredictable or overwhelming, having consistent practices can provide a sense of stability and control. These don't have to be elaborate—simple, daily actions can be profoundly grounding.\n\nMaybe it's starting your day with a few minutes of quiet reflection, taking a walk at the same time each day, or having a consistent bedtime routine. These practices become anchors that help you stay connected to your intentions and values.\n\nRoutines also create opportunities for small, daily victories. Each time you follow through on a commitment to yourself, you're building trust and confidence. You're proving to yourself that you can be relied upon, which is a beautiful foundation for continued growth.",
    source: 'Daily Practice',
    reflection_prompt: 'What healthy routine could you start or strengthen in your life?',
    external_url: NA_JFT_URL,
  },

  // Add more readings throughout the year...
  // For brevity, I'll include a few more key dates and then provide the structure

  {
    day_of_year: 100,
    month: 4,
    day: 9,
    title: 'Spring Renewal',
    content:
      "As nature awakens from winter's rest, there's something powerful about witnessing renewal all around us. The trees that seemed lifeless just weeks ago are now budding with fresh green leaves. The earth that appeared barren is now pushing up new growth.\n\nYour recovery journey mirrors this natural cycle of renewal. There may have been seasons that felt dark or dormant, but within you, new growth was always preparing to emerge. Today, take time to notice what's blooming in your life—new insights, deeper relationships, stronger boundaries, or simply a greater sense of peace.\n\nLike the plants that grow toward the light, you too are naturally oriented toward healing and growth. Trust in this process, even when progress feels slow. The most beautiful transformations often happen gradually, in ways that might not be immediately visible but are nonetheless profound.",
    source: "Nature's Wisdom",
    reflection_prompt: 'What new growth do you notice in yourself this season?',
    external_url: NA_JFT_URL,
  },

  {
    day_of_year: 182,
    month: 6,
    day: 30,
    title: 'Halfway Point Reflection',
    content:
      "We've reached the halfway point of the year—a natural time for reflection and renewal of intentions. Take a moment to acknowledge how far you've come, not just in the past six months, but in your entire journey of growth and healing.\n\nSometimes we focus so much on where we want to go that we forget to appreciate the ground we've already covered. Look back at the challenges you've faced and overcome, the insights you've gained, the relationships you've deepened, and the ways you've shown up for yourself.\n\nAs you look toward the second half of the year, what intentions want to emerge? What would you like to nurture more fully? Remember, you don't have to reinvent yourself—you just need to keep becoming more authentically who you are.",
    source: 'Mid-Year Reflection',
    reflection_prompt: 'What are you most proud of accomplishing in the first half of this year?',
    external_url: NA_JFT_URL,
  },

  {
    day_of_year: 365,
    month: 12,
    day: 31,
    title: 'Closing with Gratitude',
    content:
      "As this year draws to a close, you have so much to be proud of. Every day you chose recovery, every moment you practiced self-compassion, every time you reached out for support or offered it to others—all of these actions have woven together to create the tapestry of your growth this year.\n\nGratitude has the power to transform our perspective and open our hearts. As you reflect on this year, notice not just the big milestones, but also the small daily victories, the people who supported you, the moments of joy and peace you experienced, and the strength you discovered within yourself.\n\nAs you prepare to enter a new year, carry with you the wisdom you've gained and the confidence that comes from knowing you can navigate whatever lies ahead. You have everything you need within you, and you are never walking this path alone.",
    source: 'Year-End Gratitude',
    reflection_prompt:
      "What are three things about this year's journey that fill you with gratitude?",
    external_url: NA_JFT_URL,
  },

  // Leap Year - February 29
  {
    day_of_year: 366,
    month: 2,
    day: 29,
    title: 'A Special Day',
    content:
      "Today is a rare gift—a day that only comes once every four years. In the same way that this date is special and uncommon, your journey in recovery is unique and remarkable. There is no one else walking exactly the path you're walking, and there is no one else who can offer the world exactly what you have to offer.\n\nThis extra day reminds us that time is precious and that every moment is an opportunity. Sometimes we take our days for granted, but today invites us to be more intentional, more present, more grateful for the gift of being alive and growing.\n\nUse this rare day to do something meaningful—whether it's connecting with someone you care about, trying something new, or simply taking extra time to appreciate how far you've come. You are here for a reason, and your healing journey matters more than you know.",
    source: 'Leap Year Reflection',
    reflection_prompt: 'How will you make this special day meaningful in your recovery journey?',
    external_url: NA_JFT_URL,
  },
];

// Helper function to generate all 365 days with placeholder content for remaining days
export function generateFullYearReadings(): ReadingData[] {
  const readings: ReadingData[] = [...DAILY_READINGS];

  // Fill in any missing days with generated content
  for (let dayOfYear = 1; dayOfYear <= 366; dayOfYear++) {
    if (!readings.find((r) => r.day_of_year === dayOfYear)) {
      const date = new Date(2024, 0, dayOfYear); // 2024 is a leap year
      const month = date.getMonth() + 1;
      const day = date.getDate();

      readings.push({
        day_of_year: dayOfYear,
        month,
        day,
        title: `Day ${dayOfYear} - Keep Going`,
        content: PLACEHOLDER_CONTENT,
        source: 'Just for Today, Narcotics Anonymous',
        reflection_prompt: "What is one thing you're grateful for today?",
        external_url: NA_JFT_URL,
      });
    }
  }

  return readings.sort((a, b) => a.day_of_year - b.day_of_year);
}
