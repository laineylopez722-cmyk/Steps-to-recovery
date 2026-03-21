/**
 * Common Meeting Topics
 * Pre-defined topics for tagging meetings
 */

export interface MeetingTopic {
  name: string;
  emoji: string;
}

export const MEETING_TOPICS: MeetingTopic[] = [
  { name: 'Gratitude', emoji: '🙏' },
  { name: 'Step Work', emoji: '📖' },
  { name: 'Service', emoji: '🤝' },
  { name: 'Sponsorship', emoji: '👥' },
  { name: 'Acceptance', emoji: '💚' },
  { name: 'Resentment', emoji: '🔥' },
  { name: 'Fear', emoji: '😰' },
  { name: 'Relationships', emoji: '💕' },
  { name: 'Amends', emoji: '🌱' },
  { name: 'Serenity', emoji: '☮️' },
  { name: 'Sobriety Date', emoji: '🎂' },
  { name: 'Speaker Meeting', emoji: '🎤' },
  { name: 'Big Book', emoji: '📚' },
  { name: 'Recovery Stories', emoji: '📝' },
  { name: 'Newcomers', emoji: '👋' },
  { name: 'Higher Power', emoji: '✨' },
];

export const getTopicEmoji = (topicName: string): string => {
  const topic = MEETING_TOPICS.find((t) => t.name.toLowerCase() === topicName.toLowerCase());
  return topic?.emoji || '📍';
};
