/**
 * Coping Strategies Screen
 * A collection of evidence-based coping techniques for difficult moments
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import { Feather } from '@expo/vector-icons';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

interface CopingStrategy {
  id: string;
  title: string;
  category: 'immediate' | 'physical' | 'mental' | 'social' | 'spiritual';
  icon: FeatherIconName;
  description: string;
  steps: string[];
  timeNeeded: string;
}

const COPING_STRATEGIES: CopingStrategy[] = [
  // Immediate
  {
    id: 'halt',
    title: 'H.A.L.T. Check',
    category: 'immediate',
    icon: 'alert-circle',
    description: 'Check if you\'re Hungry, Angry, Lonely, or Tired - common triggers for cravings.',
    steps: [
      'Ask yourself: Am I Hungry? When did I last eat?',
      'Ask yourself: Am I Angry? What\'s bothering me?',
      'Ask yourself: Am I Lonely? Do I need connection?',
      'Ask yourself: Am I Tired? Do I need rest?',
      'Address whichever need is present',
    ],
    timeNeeded: '2 min',
  },
  {
    id: 'delay',
    title: 'Delay & Distract',
    category: 'immediate',
    icon: 'clock',
    description: 'Cravings typically last 15-30 minutes. Delay your response and distract yourself.',
    steps: [
      'Set a timer for 15-30 minutes',
      'Tell yourself: "I\'ll decide after the timer"',
      'Do something engaging (game, video, chore)',
      'When timer ends, reassess how you feel',
      'Repeat if needed - cravings always pass',
    ],
    timeNeeded: '15-30 min',
  },
  {
    id: 'cold',
    title: 'Cold Water Technique',
    category: 'immediate',
    icon: 'droplet',
    description: 'Cold water activates your dive reflex, slowing heart rate and calming anxiety.',
    steps: [
      'Get a bowl of cold water with ice if possible',
      'Take a deep breath and hold it',
      'Submerge your face in the cold water for 30 seconds',
      'If no bowl, splash cold water on your face',
      'Or hold ice cubes in your hands',
    ],
    timeNeeded: '2 min',
  },
  
  // Physical
  {
    id: 'breathing',
    title: 'Box Breathing',
    category: 'physical',
    icon: 'wind',
    description: 'A Navy SEAL technique to calm your nervous system quickly.',
    steps: [
      'Breathe IN for 4 counts',
      'HOLD for 4 counts',
      'Breathe OUT for 4 counts',
      'HOLD for 4 counts',
      'Repeat 4-6 times',
    ],
    timeNeeded: '2-3 min',
  },
  {
    id: 'movement',
    title: 'Physical Movement',
    category: 'physical',
    icon: 'activity',
    description: 'Movement releases endorphins and burns off anxious energy.',
    steps: [
      'Do 20 jumping jacks',
      'Or take a brisk 10-minute walk',
      'Or do push-ups until tired',
      'Or dance to one song',
      'Notice how your body feels after',
    ],
    timeNeeded: '5-15 min',
  },
  {
    id: 'progressive',
    title: 'Progressive Relaxation',
    category: 'physical',
    icon: 'sunset',
    description: 'Systematically tense and release muscles to release physical tension.',
    steps: [
      'Start with your feet - tense for 5 seconds, then release',
      'Move to calves - tense, then release',
      'Continue up: thighs, stomach, chest, arms, hands',
      'Finish with face and jaw',
      'Notice the difference between tension and relaxation',
    ],
    timeNeeded: '10 min',
  },
  
  // Mental
  {
    id: 'play-tape',
    title: 'Play the Tape Forward',
    category: 'mental',
    icon: 'fast-forward',
    description: 'Imagine the full consequences of using - not just the relief, but what comes after.',
    steps: [
      'Close your eyes and imagine using',
      'Now imagine 1 hour later - how do you feel?',
      'Imagine tomorrow morning - the shame, the hangover',
      'Imagine telling your sponsor or loved ones',
      'Imagine losing your clean time',
      'Is it worth it?',
    ],
    timeNeeded: '5 min',
  },
  {
    id: 'gratitude',
    title: 'Gratitude List',
    category: 'mental',
    icon: 'heart',
    description: 'Shift your focus from what you want to what you have.',
    steps: [
      'Write down 5 things you\'re grateful for right now',
      'Include at least one thing about your recovery',
      'Include one person who supports you',
      'Include one thing about today',
      'Read your list out loud',
    ],
    timeNeeded: '5 min',
  },
  {
    id: 'reframe',
    title: 'Thought Reframing',
    category: 'mental',
    icon: 'refresh-cw',
    description: 'Challenge and reframe the thoughts driving your craving.',
    steps: [
      'Identify the thought: "I need to use"',
      'Challenge it: "Is this true? What\'s the evidence?"',
      'Reframe: "I WANT to use, but I don\'t NEED to"',
      'Replace: "I can handle this feeling without using"',
      'Repeat your new thought',
    ],
    timeNeeded: '5 min',
  },
  
  // Social
  {
    id: 'call',
    title: 'Make a Call',
    category: 'social',
    icon: 'phone',
    description: 'Connection is the opposite of addiction. Reach out to someone.',
    steps: [
      'Call your sponsor (first choice)',
      'Or call someone from your home group',
      'Or call a recovery hotline',
      'Be honest: "I\'m struggling right now"',
      'You don\'t have to have answers, just connect',
    ],
    timeNeeded: '5-15 min',
  },
  {
    id: 'meeting',
    title: 'Get to a Meeting',
    category: 'social',
    icon: 'users',
    description: 'There\'s almost always a meeting happening somewhere, online or in person.',
    steps: [
      'Check for online meetings (24/7 available)',
      'Or find the nearest in-person meeting',
      'Don\'t worry about being late - just go',
      'Share if you can: "I\'m struggling today"',
      'Stay for the whole meeting',
    ],
    timeNeeded: '1 hour',
  },
  
  // Spiritual
  {
    id: 'serenity',
    title: 'Serenity Prayer',
    category: 'spiritual',
    icon: 'sun',
    description: 'The Serenity Prayer helps us accept what we cannot change.',
    steps: [
      'Find a quiet moment',
      'Say: "God, grant me the serenity..."',
      '"...to accept the things I cannot change..."',
      '"...courage to change the things I can..."',
      '"...and wisdom to know the difference."',
      'Repeat as needed',
    ],
    timeNeeded: '1 min',
  },
  {
    id: 'surrender',
    title: 'Third Step Prayer',
    category: 'spiritual',
    icon: 'anchor',
    description: 'Turn your will and life over to your Higher Power.',
    steps: [
      'Find a quiet space',
      'Say: "God, I offer myself to Thee..."',
      '"...to build with me and do with me as Thou wilt..."',
      '"...Relieve me of the bondage of self..."',
      '"...that I may better do Thy will."',
    ],
    timeNeeded: '2 min',
  },
];

const CATEGORY_INFO: Record<string, { label: string; color: string; icon: FeatherIconName }> = {
  immediate: { label: 'Immediate Relief', color: '#f87171', icon: 'zap' },
  physical: { label: 'Physical', color: '#4ade80', icon: 'activity' },
  mental: { label: 'Mental', color: '#60a5fa', icon: 'activity' },
  social: { label: 'Social', color: '#fbbf24', icon: 'users' },
  spiritual: { label: 'Spiritual', color: '#a78bfa', icon: 'sun' },
};

function StrategyCard({
  strategy,
  isExpanded,
  onToggle,
}: {
  strategy: CopingStrategy;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const categoryInfo = CATEGORY_INFO[strategy.category];

  return (
    <View className="bg-navy-800/40 rounded-2xl mb-3 border border-surface-700/30 overflow-hidden">
      <TouchableOpacity
        onPress={onToggle}
        className="flex-row items-center p-4"
        accessibilityRole="button"
        accessibilityLabel={`${strategy.title}, ${isExpanded ? 'expanded' : 'collapsed'}`}
      >
        <View 
          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: `${categoryInfo.color}20` }}
        >
          <Feather name={strategy.icon} size={20} color={categoryInfo.color} />
        </View>
        <View className="flex-1">
          <Text className="text-white font-semibold">{strategy.title}</Text>
          <Text className="text-surface-400 text-xs">{strategy.timeNeeded}</Text>
        </View>
        <Feather 
          name={isExpanded ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color="#64748b" 
        />
      </TouchableOpacity>

      {isExpanded && (
        <View className="px-4 pb-4 border-t border-surface-700/30 pt-3">
          <Text className="text-surface-300 text-sm mb-4">{strategy.description}</Text>
          
          <Text className="text-surface-400 text-xs uppercase tracking-wider mb-2">Steps:</Text>
          {strategy.steps.map((step, index) => (
            <View key={index} className="flex-row items-start gap-2 mb-2">
              <View className="w-5 h-5 rounded-full bg-primary-500/20 items-center justify-center mt-0.5">
                <Text className="text-primary-400 text-xs font-semibold">{index + 1}</Text>
              </View>
              <Text className="text-surface-300 text-sm flex-1">{step}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function CopingScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = Object.entries(CATEGORY_INFO);
  
  const filteredStrategies = selectedCategory
    ? COPING_STRATEGIES.filter(s => s.category === selectedCategory)
    : COPING_STRATEGIES;

  return (
    <SafeAreaView className="flex-1 bg-navy-950">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-surface-700/30">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="p-2"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={24} color="#94a3b8" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">Coping Strategies</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1">
        {/* Category filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="px-4 py-3 border-b border-surface-700/30"
        >
          <TouchableOpacity
            onPress={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full mr-2 ${
              selectedCategory === null 
                ? 'bg-primary-500' 
                : 'bg-navy-800/40 border border-surface-700/30'
            }`}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedCategory === null }}
          >
            <Text className={selectedCategory === null ? 'text-white font-medium' : 'text-surface-300'}>
              All
            </Text>
          </TouchableOpacity>
          
          {categories.map(([key, info]) => (
            <TouchableOpacity
              key={key}
              onPress={() => setSelectedCategory(key)}
              className={`px-4 py-2 rounded-full mr-2 flex-row items-center gap-2 ${
                selectedCategory === key 
                  ? 'bg-primary-500' 
                  : 'bg-navy-800/40 border border-surface-700/30'
              }`}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedCategory === key }}
            >
              <Feather 
                name={info.icon} 
                size={14} 
                color={selectedCategory === key ? '#fff' : info.color} 
              />
              <Text className={selectedCategory === key ? 'text-white font-medium' : 'text-surface-300'}>
                {info.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quick actions */}
        <View className="px-4 py-4">
          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity
              onPress={() => router.push('/breathing' as Href)}
              className="flex-1 bg-success-500/20 rounded-xl p-4 border border-success-500/30"
              accessibilityRole="button"
            >
              <Feather name="wind" size={24} color="#4ade80" />
              <Text className="text-success-400 font-semibold mt-2">Breathing</Text>
              <Text className="text-surface-400 text-xs">Guided exercise</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => router.push('/grounding' as Href)}
              className="flex-1 bg-primary-500/20 rounded-xl p-4 border border-primary-500/30"
              accessibilityRole="button"
            >
              <Feather name="anchor" size={24} color="#60a5fa" />
              <Text className="text-primary-400 font-semibold mt-2">Grounding</Text>
              <Text className="text-surface-400 text-xs">5-4-3-2-1 technique</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => router.push('/timer' as Href)}
              className="flex-1 bg-accent-500/20 rounded-xl p-4 border border-accent-500/30"
              accessibilityRole="button"
            >
              <Feather name="clock" size={24} color="#fb923c" />
              <Text className="text-accent-400 font-semibold mt-2">Timer</Text>
              <Text className="text-surface-400 text-xs">Ride the wave</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Strategy list */}
        <View className="px-4 pb-8">
          <Text className="text-surface-400 text-sm mb-3">
            {filteredStrategies.length} strategies available
          </Text>
          
          {filteredStrategies.map((strategy) => (
            <StrategyCard
              key={strategy.id}
              strategy={strategy}
              isExpanded={expandedId === strategy.id}
              onToggle={() => setExpandedId(
                expandedId === strategy.id ? null : strategy.id
              )}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

