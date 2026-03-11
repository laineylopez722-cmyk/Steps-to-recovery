/**
 * Recovery Readings Library
 * Common readings from 12-step literature
 * These are paraphrased/adapted versions for educational purposes
 */

export interface Reading {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  source: string;
  category: 'opening' | 'closing' | 'step' | 'tradition' | 'informational';
  isCommonlyRead: boolean;
}

export const READINGS: Reading[] = [
  // Opening Readings
  {
    id: 'who-is-addict',
    title: 'Who Is an Addict?',
    content: `Most of us do not have to think twice about this question. We know! Our whole life and thinking was centered in drugs in one form or another—the getting and using and finding ways and means to get more.

We lived to use and used to live. Very simply, an addict is a man or woman whose life is controlled by drugs. We are people in the grip of a continuing and progressive illness whose ends are always the same: jails, institutions, and death.

We have the disease of addiction. It is chronic, it is progressive, and it is fatal if untreated. But there is hope. When we stop using and apply simple principles to our lives, recovery is possible.`,
    source: 'Adapted from NA Literature',
    category: 'opening',
    isCommonlyRead: true,
  },
  {
    id: 'what-is-program',
    title: 'What Is the NA Program?',
    content: `NA is a nonprofit fellowship of men and women for whom drugs had become a major problem. We are recovering addicts who meet regularly to help each other stay clean.

This is a program of complete abstinence from all drugs. There is only one requirement for membership, the desire to stop using.

We suggest that you keep an open mind and give yourself a break. Our program is a set of principles written so simply that we can follow them in our daily lives. The most important thing about them is that they work.

There are no strings attached to NA. We are not affiliated with any other organizations. We have no initiation fees or dues, no pledges to sign, no promises to make to anyone. We are not connected with any political, religious, or law enforcement groups, and are under no surveillance at any time.

Anyone may join us regardless of age, race, sexual identity, creed, religion, or lack of religion.`,
    source: 'Adapted from NA Literature',
    category: 'opening',
    isCommonlyRead: true,
  },
  {
    id: 'why-are-we-here',
    title: 'Why Are We Here?',
    content: `Before coming to the fellowship, we could not manage our own lives. We could not live and enjoy life as other people do.

We had to have something different and we thought we had found it in drugs. We placed their use ahead of the welfare of our families, our spouses, and our children. We had to have drugs at all costs.

We did many things that we are now ashamed of. We lied, stole, cheated, and even committed acts of violence. We violated our own moral codes.

But all of that is in the past. Now we are a group of clean addicts who have found a new way to live. We are learning to live in peace with ourselves and with others.

We gather together in meetings and share our experience, strength, and hope. We've learned that we don't have to use drugs anymore—there is a way out. That's why we're here.`,
    source: 'Adapted from NA Literature',
    category: 'opening',
    isCommonlyRead: true,
  },
  {
    id: 'how-it-works',
    title: 'How It Works',
    content: `If you want what we have to offer, and are willing to make the effort to get it, then you are ready to take certain steps. These are the principles that made our recovery possible:

1. We admitted that we were powerless over our addiction, that our lives had become unmanageable.
2. We came to believe that a Power greater than ourselves could restore us to sanity.
3. We made a decision to turn our will and our lives over to the care of God as we understood Him.
4. We made a searching and fearless moral inventory of ourselves.
5. We admitted to God, to ourselves, and to another human being the exact nature of our wrongs.
6. We were entirely ready to have God remove all these defects of character.
7. We humbly asked Him to remove our shortcomings.
8. We made a list of all persons we had harmed, and became willing to make amends to them all.
9. We made direct amends to such people wherever possible, except when to do so would injure them or others.
10. We continued to take personal inventory and when we were wrong promptly admitted it.
11. We sought through prayer and meditation to improve our conscious contact with God as we understood Him, praying only for knowledge of His will for us and the power to carry that out.
12. Having had a spiritual awakening as a result of these steps, we tried to carry this message to addicts, and to practice these principles in all our affairs.

This sounds like a big order, and we can't do it all at once. We didn't become addicted in one day, so remember—easy does it.`,
    source: 'Adapted from 12-Step Literature',
    category: 'opening',
    isCommonlyRead: true,
  },
  {
    id: 'we-do-recover',
    title: 'We Do Recover',
    content: `When at the end of the road we find that we can no longer function as a human being, either with or without drugs, we all face the same dilemma. What is there left to do?

There seems to be this alternative: either go on as best we can to the bitter ends—jails, institutions, or death—or find a new way to live.

In years gone by, very few addicts ever had this last choice. Those who are addicted today are more fortunate. For the first time in man's entire history, a simple way has been proving itself in the lives of many addicts.

It is available to us all. This is a simple spiritual—not religious—program, known as Narcotics Anonymous.

When we first came to NA, we realized we were searching for an answer to our living problem that we could understand and use. We had to have something that worked.

We have found it in this fellowship. This is the message we carry to others. We do recover.`,
    source: 'Adapted from NA Literature',
    category: 'informational',
    isCommonlyRead: true,
  },

  // Closing Readings
  {
    id: 'just-for-today',
    title: 'Just for Today',
    content: `Tell yourself:

Just for today my thoughts will be on my recovery, living and enjoying life without the use of drugs.

Just for today I will have faith in someone in NA who believes in me and wants to help me in my recovery.

Just for today I will have a program. I will try to follow it to the best of my ability.

Just for today, through NA, I will try to get a better perspective on my life.

Just for today I will be unafraid. My new confidence will give me the courage to take that next step on my journey.

Just for today I will not compare myself to anyone else. I'll accept myself as I am and be grateful for my recovery.

Just for today I will have faith that things are happening exactly as they should be.`,
    source: 'NA Daily Meditation',
    category: 'closing',
    isCommonlyRead: true,
  },
  {
    id: 'responsibility-declaration',
    title: 'Responsibility Declaration',
    content: `I am responsible. When anyone, anywhere, reaches out for help, I want the hand of recovery always to be there. And for that: I am responsible.`,
    source: 'Adapted from Recovery Literature',
    category: 'closing',
    isCommonlyRead: true,
  },

  // Informational Readings
  {
    id: 'sponsorship',
    title: 'What Is Sponsorship?',
    content: `A sponsor is a member of the fellowship who is further along in recovery and shares their experience with a newer member to help guide them through the program.

Sponsorship is a key element of recovery. A sponsor can help you:
• Work the Twelve Steps
• Understand the program and traditions
• Navigate difficult situations in recovery
• Stay accountable to your recovery
• Find your way in the fellowship

When looking for a sponsor, we suggest finding someone:
• Who has what you want in recovery
• Who has worked the steps themselves
• Who has time available to help you
• Whose recovery you respect

Don't be afraid to ask. Most people are honored to be asked to sponsor someone. It's one of the ways we give back what was so freely given to us.`,
    source: 'Common Recovery Principles',
    category: 'informational',
    isCommonlyRead: false,
  },
  {
    id: 'meetings-work',
    title: 'How Meetings Work',
    content: `Meetings are the foundation of the 12-step program. They provide a safe space where we can share our experience, strength, and hope with others.

Common meeting formats include:
• Speaker meetings - One person shares their story
• Discussion meetings - Open sharing on a topic
• Step meetings - Focus on a specific step
• Literature meetings - Reading and discussing program literature
• Beginner meetings - Introduction to the program

What to expect at your first meeting:
• You don't have to share if you don't want to
• What's said in meetings stays in meetings
• There's no pressure to do anything
• You can just listen
• Everyone was new once

The only requirement for membership is a desire to stop using. If you're struggling, just keep coming back. It works if you work it.`,
    source: 'Common Recovery Principles',
    category: 'informational',
    isCommonlyRead: false,
  },
  {
    id: 'home-group',
    title: 'The Home Group',
    content: `A home group is the meeting you attend regularly, where you have made a commitment to the group. It becomes your "home" in recovery.

Benefits of having a home group:
• A consistent place to belong
• Regular contact with recovering addicts
• Opportunity for service work
• Accountability and support
• People who know your journey

Suggested involvement in your home group:
• Attend regularly
• Arrive early, stay late
• Volunteer for service positions
• Welcome newcomers
• Support group activities

Your home group is where you can grow in recovery, develop lasting friendships, and give back to the program that saved your life.`,
    source: 'Common Recovery Principles',
    category: 'informational',
    isCommonlyRead: false,
  },
  {
    id: 'service-work',
    title: 'Service in Recovery',
    content: `Service is an essential part of recovery. When we help others, we help ourselves stay clean.

"We can only keep what we have by giving it away."

Types of service:
• Making coffee or setting up chairs
• Greeting newcomers
• Sharing your story
• Sponsoring others
• Serving as a group officer
• Helping with events

Why service matters:
• It gets us out of our own heads
• It builds connection to the fellowship
• It gives us purpose
• It's an expression of gratitude
• It helps others find recovery

You don't need years of clean time to be of service. Even with one day clean, you can welcome the newcomer who just walked through the door.`,
    source: 'Common Recovery Principles',
    category: 'informational',
    isCommonlyRead: false,
  },
  {
    id: 'anonymity',
    title: 'Anonymity: The Spiritual Foundation',
    content: `Anonymity is the spiritual foundation of all our traditions, ever reminding us to place principles before personalities.

What anonymity means:
• We don't reveal who we see at meetings
• We use first names only
• We don't speak publicly about our membership
• We protect each other's privacy

Why anonymity matters:
• It creates a safe space for honesty
• It removes barriers to seeking help
• It keeps the focus on the program, not personalities
• It protects members from judgment or consequences
• It reminds us we're all equal in recovery

Anonymity is a gift we give to each other and to ourselves. It allows us to be vulnerable, honest, and free.`,
    source: 'Adapted from 12-Step Traditions',
    category: 'informational',
    isCommonlyRead: false,
  },
];

/**
 * Get readings by category
 */
export function getReadingsByCategory(category: Reading['category']): Reading[] {
  return READINGS.filter((r) => r.category === category);
}

/**
 * Get commonly read readings
 */
export function getCommonReadings(): Reading[] {
  return READINGS.filter((r) => r.isCommonlyRead);
}

/**
 * Get reading by ID
 */
export function getReadingById(id: string): Reading | undefined {
  return READINGS.find((r) => r.id === id);
}

/**
 * Reading categories with labels
 */
export const READING_CATEGORIES: { key: Reading['category']; label: string; icon: string }[] = [
  { key: 'opening', label: 'Opening Readings', icon: '📖' },
  { key: 'closing', label: 'Closing Readings', icon: '🙏' },
  { key: 'informational', label: 'Understanding Recovery', icon: '💡' },
  { key: 'step', label: 'Step Readings', icon: '👣' },
  { key: 'tradition', label: 'Traditions', icon: '⚖️' },
];
