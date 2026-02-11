/**
 * AI Offline Fallback Service
 * Provides cached and pre-written recovery responses when offline.
 *
 * SECURITY NOTE: Cached AI responses are encrypted before storage
 * using SecureStore, following project encryption-first patterns.
 * No sensitive user data is stored in plaintext.
 */

import NetInfo from '@react-native-community/netinfo';
import { secureStorage } from '../../../adapters/secureStorage';
import { logger } from '../../../utils/logger';

const CACHED_RESPONSES_KEY = 'ai_offline_cached_responses';
const PENDING_MESSAGES_KEY = 'ai_offline_pending_messages';
const MAX_CACHED_RESPONSES = 20;

export interface CachedResponse {
  topic: string;
  userPattern: string;
  response: string;
  cachedAt: string;
}

export interface PendingMessage {
  id: string;
  content: string;
  conversationId: string;
  queuedAt: string;
}

export interface OfflineResponse {
  content: string;
  isOffline: true;
  source: 'cached' | 'prewritten';
}

/**
 * Check if the device is currently offline.
 */
export async function isOfflineMode(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return !state.isConnected || !state.isInternetReachable;
  } catch {
    return false;
  }
}

/**
 * Categorize a user message into a topic for matching.
 */
function categorizeMessage(message: string): string {
  const lower = message.toLowerCase();

  const categories: Array<{ pattern: RegExp; topic: string }> = [
    {
      pattern: /crav(e|ing|ings)|urge|tempt(ed|ation)|want to (use|drink|get high)/i,
      topic: 'craving',
    },
    { pattern: /sad|depress(ed|ion)|down|lonely|hopeless|empty|numb/i, topic: 'sadness' },
    { pattern: /anxi(ous|ety)|worr(y|ied)|nervous|panic|scared|afraid/i, topic: 'anxiety' },
    { pattern: /ang(ry|er)|frust(rated|ation)|rage|furious|mad|irritat/i, topic: 'anger' },
    { pattern: /grat(eful|itude)|thankful|bless(ed|ing)|appreciat/i, topic: 'gratitude' },
    { pattern: /meeting|fellowship|group|attend|go to a meeting/i, topic: 'meeting' },
    {
      pattern: /step\s*(\d+|work|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)/i,
      topic: 'stepwork',
    },
    { pattern: /sponsor|sponsee|mentor/i, topic: 'sponsor' },
    { pattern: /relaps(e|ed|ing)|slip(ped)?|fell off|went back/i, topic: 'relapse' },
    { pattern: /sleep|insomnia|nightmare|can't sleep|tired|exhausted/i, topic: 'sleep' },
    { pattern: /family|relationship|partner|spouse|parent|child/i, topic: 'relationship' },
    { pattern: /celebrat|milestone|proud|achievement|anniversary/i, topic: 'milestone' },
    { pattern: /pray(er|ing)?|meditat(e|ion)|higher power|spiritual/i, topic: 'spiritual' },
    { pattern: /guilt|shame|regret|sorry|forgiv/i, topic: 'guilt' },
  ];

  for (const { pattern, topic } of categories) {
    if (pattern.test(lower)) {
      return topic;
    }
  }

  return 'general';
}

/**
 * Pre-written recovery-focused responses for offline use.
 */
const PREWRITTEN_RESPONSES: Record<string, string[]> = {
  craving: [
    "Cravings are temporary — they always pass. Try the HALT check: are you Hungry, Angry, Lonely, or Tired? Addressing the real need often eases the craving. You've made it this far, and that takes real strength.",
    "Right now, this craving feels overwhelming, but remember: you've survived every craving before this one. Try changing your environment — go for a walk, call someone, or do something with your hands. You don't have to fight this alone.",
    "The fact that you're here instead of using says everything about your commitment. Cravings peak and then fade. Try deep breathing: in for 4, hold for 4, out for 4. Ride the wave — it will pass.",
  ],
  sadness: [
    "It's okay to feel sad. In recovery, we learn to sit with our feelings instead of running from them. Be gentle with yourself today. If you can, reach out to someone — even a short call can help.",
    "Sadness is a natural part of healing. You're processing things you may have been numbing for a long time. That takes courage. Consider writing about what you're feeling — getting it out of your head can bring relief.",
    "You don't have to have it all figured out today. Just get through this moment, then the next. Remember: you're building a life worth living, and some days are harder than others. That's okay.",
  ],
  anxiety: [
    "Anxiety is your body's alarm system — but sometimes it fires when there's no real danger. Try grounding: name 5 things you can see, 4 you can hear, 3 you can touch, 2 you can smell, and 1 you can taste.",
    'Take a slow breath. You are safe right now, in this moment. Anxiety often comes from projecting into the future. What can you do right now, just for the next 5 minutes? Start there.',
    "Feeling anxious doesn't mean something bad is happening — it means your body is on alert. Try box breathing (4 counts in, 4 hold, 4 out, 4 hold). Your body knows how to calm down; give it permission.",
  ],
  anger: [
    'Anger is a signal — it tells us something matters to us. Before reacting, pause. Take 10 deep breaths. Ask yourself: will this matter in a week? You have the power to choose your response.',
    "It's okay to feel angry. What's important is what you do with it. Try writing down what's bothering you — sometimes seeing it on paper takes away some of its power. Your recovery is worth more than any reaction.",
  ],
  gratitude: [
    "Gratitude is one of the most powerful tools in recovery. Even on hard days, there's something — your sobriety, a meal, a safe place to sleep. What are three things, no matter how small, that you're grateful for right now?",
    "Practicing gratitude rewires your brain over time. Try this: before bed tonight, write down three good things from today. They don't have to be big. Consistency is what makes it transformative.",
  ],
  meeting: [
    "Going to a meeting is one of the best things you can do for your recovery. Even if you don't feel like it, showing up matters. You might hear exactly what you need to hear today.",
    "If you're on the fence about a meeting, go. The hardest part is getting there. Once you're in the room, you're surrounded by people who understand. You never have to do this alone.",
  ],
  stepwork: [
    "Step work can feel overwhelming, but remember: progress, not perfection. Take it one question at a time. You don't have to do it perfectly — you just have to be honest. That's where the healing happens.",
    "Working the steps is a journey, not a race. Be patient with yourself. If you're stuck, talk to your sponsor or someone who's been through it. Every step you take brings you closer to freedom.",
    "The steps aren't meant to be easy — they're meant to be transformative. Whatever step you're on, you're exactly where you need to be. Trust the process.",
  ],
  sponsor: [
    "If you're thinking about calling your sponsor, do it. That's exactly what they're there for. Sponsors have been where you are. Reaching out isn't weakness — it's one of the strongest things you can do in recovery.",
    "Your sponsor is your guide through the steps and through the tough moments. Don't wait until things are bad to check in. Regular connection builds the trust that carries you through the hard times.",
  ],
  relapse: [
    "A relapse doesn't erase your progress — it's a bump in the road, not the end of the road. The most important thing right now is your safety. Reach out to someone you trust: your sponsor, a meeting, or a helpline.",
    "Recovery isn't a straight line. What matters is that you're here, right now, reaching out. That takes courage. Don't let shame keep you from getting the help you deserve. One moment at a time.",
  ],
  sleep: [
    "Sleep problems are common in recovery. Try a wind-down routine: no screens for 30 minutes before bed, a warm shower, and some gentle stretching or reading. Your body is still adjusting, and that's normal.",
    "If you can't sleep, don't fight it. Get up, do something calm — read, write, or listen to soothing sounds. Avoid caffeine after noon. Over time, your sleep will improve as your body heals.",
  ],
  relationship: [
    'Relationships in recovery can be complicated. Remember: you can only control your own actions. Set healthy boundaries, communicate openly, and give yourself grace. Healing your relationships starts with healing yourself.',
    "It's natural for relationships to shift in recovery. Some people may not understand the changes you're making. Focus on the people who support your recovery, and trust that the right relationships will grow.",
  ],
  milestone: [
    "Every day clean is a victory worth celebrating. Whether it's day 1 or day 1,000, you showed up for yourself today. Be proud of that. You're doing something incredibly hard, and you're doing it.",
    "Milestones remind us how far we've come. Take a moment to reflect on who you were and who you're becoming. You earned this. Keep going — the best is still ahead.",
  ],
  spiritual: [
    "Spirituality in recovery doesn't have to look a certain way. It can be prayer, meditation, time in nature, or just sitting quietly. What matters is connecting with something bigger than yourself, however you define that.",
    "Even a few minutes of quiet reflection can make a difference. Try sitting still for 5 minutes — no phone, no distractions. Just breathe and be present. That's enough. That's a start.",
  ],
  guilt: [
    "Guilt and shame are heavy burdens, but they don't have to define you. The steps give us tools to make amends and let go. You can't change the past, but you can choose how you show up today.",
    "Feeling guilty means you have a conscience — and that's a good thing. But don't let guilt keep you stuck. Talk about it with your sponsor or in a meeting. Bringing it into the light takes away its power.",
  ],
  general: [
    "I'm not able to connect to the AI service right now, but I'm still here for you. Remember: you're not alone in this journey. Take a deep breath and know that this moment will pass.",
    "I'm currently offline, but your recovery matters every moment. If you need to talk to someone right now, consider calling your sponsor, attending a meeting, or reaching out to the SAMHSA helpline at 1-800-662-4357.",
    "While I can't provide a personalized response right now, remember the basics: one day at a time, reach out when you need help, and be kind to yourself. You're doing great by being here.",
    "I'm offline right now, but here's something to remember: recovery is about progress, not perfection. Whatever you're going through, you have the strength to handle it. You've proven that every day you've stayed sober.",
  ],
};

/**
 * Get a pre-written response matching the user's message topic.
 */
function getPrewrittenResponse(topic: string): string {
  const responses = PREWRITTEN_RESPONSES[topic] || PREWRITTEN_RESPONSES.general;
  const index = Math.floor(Math.random() * responses.length);
  return responses[index];
}

/**
 * Load cached responses from secure storage.
 */
async function loadCachedResponses(): Promise<CachedResponse[]> {
  try {
    const raw = await secureStorage.getItemAsync(CACHED_RESPONSES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CachedResponse[];
  } catch {
    return [];
  }
}

/**
 * Save cached responses to secure storage.
 */
async function saveCachedResponses(responses: CachedResponse[]): Promise<void> {
  try {
    await secureStorage.setItemAsync(CACHED_RESPONSES_KEY, JSON.stringify(responses));
  } catch (error) {
    logger.error('Failed to save cached responses', error);
  }
}

/**
 * Cache an AI response for offline use.
 * Stores by topic for efficient retrieval.
 */
export async function cacheResponse(userMessage: string, aiResponse: string): Promise<void> {
  try {
    const topic = categorizeMessage(userMessage);
    const cached = await loadCachedResponses();

    const newEntry: CachedResponse = {
      topic,
      userPattern: userMessage.substring(0, 100),
      response: aiResponse,
      cachedAt: new Date().toISOString(),
    };

    // Replace existing entry for same topic or add new
    const existingIndex = cached.findIndex((c) => c.topic === topic);
    if (existingIndex >= 0) {
      cached[existingIndex] = newEntry;
    } else {
      cached.push(newEntry);
    }

    // Trim to max size
    const trimmed = cached.slice(-MAX_CACHED_RESPONSES);
    await saveCachedResponses(trimmed);

    logger.debug('Cached AI response', { topic });
  } catch (error) {
    logger.error('Failed to cache response', error);
  }
}

/**
 * Get an offline response for a user message.
 * Tries cached responses first, then falls back to pre-written ones.
 */
export async function getOfflineResponse(userMessage: string): Promise<OfflineResponse> {
  const topic = categorizeMessage(userMessage);

  // Try cached responses first
  try {
    const cached = await loadCachedResponses();
    const match = cached.find((c) => c.topic === topic);
    if (match) {
      return {
        content: match.response,
        isOffline: true,
        source: 'cached',
      };
    }
  } catch {
    // Fall through to prewritten
  }

  // Fall back to pre-written responses
  return {
    content: getPrewrittenResponse(topic),
    isOffline: true,
    source: 'prewritten',
  };
}

/**
 * Queue a message for sending when back online.
 */
export async function queuePendingMessage(content: string, conversationId: string): Promise<void> {
  try {
    const raw = await secureStorage.getItemAsync(PENDING_MESSAGES_KEY);
    const pending: PendingMessage[] = raw ? JSON.parse(raw) : [];

    const id = `pending_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    pending.push({
      id,
      content,
      conversationId,
      queuedAt: new Date().toISOString(),
    });

    await secureStorage.setItemAsync(PENDING_MESSAGES_KEY, JSON.stringify(pending));
    logger.debug('Queued pending message', { conversationId });
  } catch (error) {
    logger.error('Failed to queue pending message', error);
  }
}

/**
 * Get and clear all pending messages for sending.
 */
export async function drainPendingMessages(): Promise<PendingMessage[]> {
  try {
    const raw = await secureStorage.getItemAsync(PENDING_MESSAGES_KEY);
    if (!raw) return [];

    const pending: PendingMessage[] = JSON.parse(raw);
    await secureStorage.setItemAsync(PENDING_MESSAGES_KEY, JSON.stringify([]));

    logger.debug('Drained pending messages', { count: pending.length });
    return pending;
  } catch {
    return [];
  }
}
