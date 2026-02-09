/**
 * Home/Dashboard Screen
 * Main recovery dashboard - matches reference site design
 */

import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, LayoutAnimation, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SobrietyCounter } from '../../components/progress';
import { Card, Button, Slider } from '../../components/ui';
import { useSobriety } from '../../lib/hooks/useSobriety';
import { useCheckin } from '../../lib/hooks/useCheckin';
import { useJournalStore, useRhythmStore } from '../../lib/store';
import type { PulseContext, TinyInventory } from '../../lib/store/rhythmStore';
import { STEP_PROMPTS } from '../../lib/constants/stepPrompts';
import { PromptModal } from '../../components/common/PromptModal';

// Note: LayoutAnimation.configureNext still works but setLayoutAnimationEnabledExperimental
// is a no-op in New Architecture (which is enabled in this app)

// Use Feather's native name type so TS accepts icon strings used in this file.
type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

// Shortcut card component
function ShortcutCard({
  icon,
  title,
  description,
  onPress,
  color = 'primary',
}: {
  icon: FeatherIconName;
  title: string;
  description: string;
  onPress: () => void;
  color?: 'primary' | 'success' | 'danger' | 'warning';
}) {
  const colorMap = {
    primary: { bg: 'bg-primary-500/20', icon: '#60a5fa' },
    success: { bg: 'bg-success-500/20', icon: '#4ade80' },
    danger: { bg: 'bg-danger-500/20', icon: '#f87171' },
    warning: { bg: 'bg-accent-500/20', icon: '#fb923c' },
  };
  
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 bg-navy-800/40 rounded-2xl p-4 border border-surface-700/30"
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={description}
    >
      <View className={`w-10 h-10 rounded-xl items-center justify-center mb-3 ${colorMap[color].bg}`}>
        <Feather name={icon} size={20} color={colorMap[color].icon} />
      </View>
      <Text className="text-white font-semibold">{title}</Text>
      <Text className="text-surface-400 text-sm mt-1" numberOfLines={2}>{description}</Text>
    </TouchableOpacity>
  );
}

// Collapsible section component
function CollapsibleSection({
  icon,
  title,
  isExpanded,
  onToggle,
  children,
  badge,
}: {
  icon: FeatherIconName;
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: string;
}) {
  return (
    <View className="bg-navy-800/40 rounded-2xl border border-surface-700/30 mb-4">
      <TouchableOpacity
        onPress={onToggle}
        className="flex-row items-center justify-between p-4"
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${isExpanded ? 'expanded' : 'collapsed'}`}
      >
        <View className="flex-row items-center gap-2">
          <Feather name={icon} size={18} color="#60a5fa" />
          <Text className="text-white font-semibold">{title}</Text>
          {badge && (
            <View className="bg-success-500/20 px-2 py-0.5 rounded-full">
              <Text className="text-success-400 text-xs">{badge}</Text>
            </View>
          )}
        </View>
        <Feather 
          name={isExpanded ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color="#64748b" 
        />
      </TouchableOpacity>
      {isExpanded && (
        <View className="px-4 pb-4 border-t border-surface-700/30 pt-4">
          {children}
        </View>
      )}
    </View>
  );
}

// Intention selector component
function IntentionSelector({ 
  selectedIntention,
  onSelect,
  onSave,
  isSaving,
}: { 
  selectedIntention: string | null;
  onSelect: (intention: string) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  const intentions = ['Stay Clean', 'Stay Connected', 'Be Gentle with Myself'];
  const [customMode, setCustomMode] = useState(false);
  const [customIntention, setCustomIntention] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);

  const handleCustomSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setShowCustomModal(false);
      return;
    }
    setCustomIntention(trimmed);
    setCustomMode(true);
    onSelect(trimmed);
    setShowCustomModal(false);
  };
  
  return (
    <View>
      <Text className="text-surface-400 text-sm mb-3">
        Pick one intention for today (or create your own)
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-3">
        {intentions.map((intention) => (
          <TouchableOpacity
            key={intention}
            onPress={() => {
              setCustomMode(false);
              onSelect(intention);
            }}
            className={`px-3 py-2 rounded-lg border ${
              selectedIntention === intention && !customMode
                ? 'bg-primary-500/20 border-primary-500' 
                : 'border-surface-600/50'
            }`}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedIntention === intention && !customMode }}
          >
            <Text className={selectedIntention === intention && !customMode ? 'text-primary-400' : 'text-surface-300'}>
              {intention}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity 
          onPress={() => {
            setCustomMode(true);
            setShowCustomModal(true);
          }}
          className={`px-3 py-2 rounded-lg border ${
            customMode ? 'bg-primary-500/20 border-primary-500' : 'border-surface-600/50'
          }`}
          accessibilityRole="button"
        >
          <Text className={customMode ? 'text-primary-400' : 'text-surface-400'}>Custom</Text>
        </TouchableOpacity>
      </View>
      
      {customMode && (
        <View className="mb-3">
          <View className="bg-navy-900/60 rounded-lg border border-surface-600/50 px-3 py-2">
            <Text 
              className="text-white"
              onPress={() => {
                setShowCustomModal(true);
              }}
            >
              {customIntention || 'Tap to enter your intention...'}
            </Text>
          </View>
        </View>
      )}
      
      <Button
        title={isSaving ? 'Saving...' : 'Set Intention'}
        onPress={onSave}
        variant="outline"
        icon="check"
        disabled={!selectedIntention || isSaving}
      />

      <PromptModal
        visible={showCustomModal}
        title="Custom Intention"
        description="Set a personal intention for today."
        initialValue={customIntention}
        placeholder="I will focus on..."
        confirmLabel="Set Intention"
        onSubmit={handleCustomSubmit}
        onCancel={() => setShowCustomModal(false)}
      />
    </View>
  );
}

// Interactive Mood slider component
function MoodSlider({ 
  label, 
  value, 
  onChange, 
  leftLabel, 
  rightLabel,
  color = 'primary',
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  leftLabel: string;
  rightLabel: string;
  color?: 'primary' | 'danger' | 'success';
}) {
  const colorClasses = {
    primary: 'bg-primary-500',
    danger: 'bg-danger-500',
    success: 'bg-success-500',
  };
  
  const [containerWidth, setContainerWidth] = useState(300);
  
  const getValueLabel = () => {
    if (value <= 3) return leftLabel;
    if (value >= 7) return rightLabel;
    return 'Okay';
  };

  const handleTouch = (locationX: number) => {
    if (containerWidth > 0) {
      const newValue = Math.max(1, Math.min(10, Math.round((locationX / containerWidth) * 10)));
      onChange(newValue);
    }
  };

  return (
    <View className="mb-4">
      <View className="flex-row justify-between mb-2">
        <Text className="text-surface-300">{label}</Text>
        <Text className="text-primary-400">{getValueLabel()} ({value})</Text>
      </View>
      
      {/* Slider track */}
      <View 
        className="h-8 justify-center"
        onLayout={(e) => {
          const { width } = e.nativeEvent.layout;
          if (width > 0) {
            setContainerWidth(width);
          }
        }}
      >
        <View className="h-2 bg-surface-700/50 rounded-full relative">
          <View 
            className={`h-2 ${colorClasses[color]} rounded-full`}
            style={{ width: `${value * 10}%` }} 
          />
        </View>
        
        {/* Slider thumb - touchable area */}
        <View 
          className="absolute h-8 w-full"
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e) => {
            handleTouch(e.nativeEvent.locationX);
          }}
          onResponderMove={(e) => {
            handleTouch(e.nativeEvent.locationX);
          }}
        />
        
        {/* Thumb indicator */}
        <View 
          className={`absolute w-5 h-5 ${colorClasses[color]} rounded-full border-2 border-white`}
          style={{ left: `${(value - 1) * 11}%`, top: 6 }}
          pointerEvents="none"
        />
      </View>
      
      {/* Quick value buttons */}
      <View className="flex-row justify-between mt-2">
        {[1, 3, 5, 7, 10].map((v) => (
          <TouchableOpacity
            key={v}
            onPress={() => onChange(v)}
            className={`w-8 h-8 rounded-full items-center justify-center ${
              value === v ? 'bg-primary-500/30' : 'bg-surface-700/30'
            }`}
            accessibilityRole="button"
            accessibilityLabel={`Set ${label.toLowerCase()} to ${v}`}
          >
            <Text className={`text-xs ${value === v ? 'text-primary-400 font-semibold' : 'text-surface-400'}`}>
              {v}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View className="flex-row justify-between mt-1">
        <Text className="text-surface-500 text-xs">{leftLabel}</Text>
        <Text className="text-surface-500 text-xs">{rightLabel}</Text>
      </View>
    </View>
  );
}

// Context tag selector
function ContextSelector({
  selectedContexts,
  onToggle,
}: {
  selectedContexts: PulseContext[];
  onToggle: (context: PulseContext) => void;
}) {
  const contexts: { key: PulseContext; label: string }[] = [
    { key: 'alone', label: 'Alone' },
    { key: 'with_people', label: 'With people' },
    { key: 'bored', label: 'Bored' },
    { key: 'stressed', label: 'Stressed' },
    { key: 'hungry', label: 'Hungry' },
    { key: 'tired', label: 'Tired' },
    { key: 'anxious', label: 'Anxious' },
    { key: 'angry', label: 'Angry' },
  ];

  return (
    <View className="flex-row flex-wrap gap-2">
      {contexts.map(({ key, label }) => {
        const isSelected = selectedContexts.includes(key);
        return (
          <TouchableOpacity
            key={key}
            onPress={() => onToggle(key)}
            className={`px-3 py-2 rounded-lg border ${
              isSelected 
                ? 'bg-primary-500/20 border-primary-500' 
                : 'border-surface-600/50'
            }`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
          >
            <Text className={`text-sm ${isSelected ? 'text-primary-400' : 'text-surface-300'}`}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Tiny Inventory component
function TinyInventoryForm({
  onSubmit,
  isSaving,
}: {
  onSubmit: (data: Omit<TinyInventory, 'id' | 'date' | 'createdAt'>) => void;
  isSaving: boolean;
}) {
  const [stayedClean, setStayedClean] = useState<TinyInventory['stayedClean'] | null>(null);
  const [attendedMeeting, setAttendedMeeting] = useState(false);
  const [contactedSponsor, setContactedSponsor] = useState(false);
  const [contactedFellowship, setContactedFellowship] = useState(false);

  const handleSubmit = () => {
    if (!stayedClean) {
      Alert.alert('Required', 'Please answer "Did I stay clean today?"');
      return;
    }
    onSubmit({
      stayedClean,
      attendedMeeting,
      contactedSponsor,
      contactedFellowship,
    });
  };

  return (
    <View>
      <Text className="text-surface-400 text-sm mb-3">Did I stay clean today?</Text>
      <View className="flex-row gap-3 mb-4">
        {[
          { value: 'yes' as const, label: 'Yes', color: 'success' },
          { value: 'no' as const, label: 'No', color: 'danger' },
          { value: 'close_call' as const, label: 'Close call', color: 'warning' },
        ].map(({ value, label, color }) => (
          <TouchableOpacity
            key={value}
            onPress={() => setStayedClean(value)}
            className="flex-row items-center gap-2"
            accessibilityRole="radio"
            accessibilityState={{ selected: stayedClean === value }}
          >
            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
              stayedClean === value 
                ? `border-${color}-500 bg-${color}-500/20` 
                : 'border-surface-500'
            }`}>
              {stayedClean === value && (
                <View className={`w-2.5 h-2.5 rounded-full bg-${color}-500`} />
              )}
            </View>
            <Text className={stayedClean === value ? 'text-white' : 'text-surface-300'}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text className="text-surface-400 text-sm mb-2">Did I stay connected?</Text>
      <View className="gap-2 mb-4">
        {[
          { key: 'meeting', label: 'Meetings', value: attendedMeeting, setter: setAttendedMeeting },
          { key: 'sponsor', label: 'Sponsor', value: contactedSponsor, setter: setContactedSponsor },
          { key: 'fellowship', label: 'Recovery Friends', value: contactedFellowship, setter: setContactedFellowship },
        ].map(({ key, label, value, setter }) => (
          <TouchableOpacity 
            key={key} 
            className="flex-row items-center justify-between py-1"
            onPress={() => setter(!value)}
            accessibilityRole="switch"
            accessibilityState={{ checked: value }}
          >
            <Text className="text-surface-300">{label}</Text>
            <View className={`w-12 h-7 rounded-full p-1 ${value ? 'bg-success-500' : 'bg-surface-700/50'}`}>
              <View 
                className={`w-5 h-5 rounded-full bg-white ${value ? 'ml-auto' : ''}`}
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>
      
      <Button
        title={isSaving ? 'Saving...' : 'Save Inventory'}
        onPress={handleSubmit}
        variant="outline"
        icon="check"
        disabled={!stayedClean || isSaving}
      />
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const {
    profile,
    soberDays,
    soberHours,
    soberMinutes,
    isLoading: sobrietyLoading,
  } = useSobriety();

  const { hasCheckedInToday, submitCheckin } = useCheckin();
  const { entries } = useJournalStore();
  
  // Rhythm store
  const {
    todayIntention,
    todayPulseChecks,
    todayInventory,
    isLoading: rhythmLoading,
    loadTodayRhythm,
    setIntention,
    submitPulseCheck,
    submitTinyInventory,
  } = useRhythmStore();
  
  // Load rhythm data on mount
  useEffect(() => {
    loadTodayRhythm();
  }, []);
  
  // Section expansion states
  const [rhythmExpanded, setRhythmExpanded] = useState(true);
  const [setToneExpanded, setSetToneExpanded] = useState(!todayIntention);
  const [pulseExpanded, setPulseExpanded] = useState(true);
  const [inventoryExpanded, setInventoryExpanded] = useState(!todayInventory);
  const [checkinExpanded, setCheckinExpanded] = useState(false);
  
  // Form states
  const [selectedIntention, setSelectedIntention] = useState<string | null>(null);
  const [mood, setMood] = useState(7);
  const [craving, setCraving] = useState(2);
  const [selectedContexts, setSelectedContexts] = useState<PulseContext[]>([]);
  const [isSavingIntention, setIsSavingIntention] = useState(false);
  const [isSavingPulse, setIsSavingPulse] = useState(false);
  const [isSavingInventory, setIsSavingInventory] = useState(false);

  // Update expansion states when data loads
  useEffect(() => {
    if (todayIntention) {
      setSetToneExpanded(false);
      setSelectedIntention(todayIntention.intention);
    }
    if (todayInventory) {
      setInventoryExpanded(false);
    }
  }, [todayIntention, todayInventory]);

  // Calculate current step (first incomplete)
  const getCurrentStep = () => {
    for (const step of STEP_PROMPTS) {
      const stepEntries = entries.filter(e => e.type === 'step-work' && e.stepNumber === step.step);
      if (stepEntries.length < 3) return step.step;
    }
    return 12;
  };
  const currentStep = getCurrentStep();
  const completedSteps = STEP_PROMPTS.filter(s => {
    const stepEntries = entries.filter(e => e.type === 'step-work' && e.stepNumber === s.step);
    return stepEntries.length >= 3;
  }).length;

  const toggleSection = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setter(prev => !prev);
  };

  // Navigation handlers
  const navigateTo = useCallback((route: string) => {
    router.push(route as Href);
  }, [router]);

  // Intention save handler
  const handleSaveIntention = async () => {
    if (!selectedIntention) return;
    setIsSavingIntention(true);
    try {
      const isCustom = !['Stay Clean', 'Stay Connected', 'Be Gentle with Myself'].includes(selectedIntention);
      await setIntention(selectedIntention, isCustom);
      setSetToneExpanded(false);
      Alert.alert('Intention Set', `Your intention for today: "${selectedIntention}"`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save intention. Please try again.');
    } finally {
      setIsSavingIntention(false);
    }
  };

  // Pulse check save handler
  const handleSavePulseCheck = async () => {
    setIsSavingPulse(true);
    try {
      await submitPulseCheck(mood, craving, selectedContexts);
      // Also save to the main check-in store if not already checked in
      if (!hasCheckedInToday) {
        await submitCheckin(mood, craving);
      }
      Alert.alert('Pulse Check Saved', 'Your mood and craving levels have been recorded.');
      // Reset context selections
      setSelectedContexts([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save pulse check. Please try again.');
    } finally {
      setIsSavingPulse(false);
    }
  };

  // Inventory save handler
  const handleSaveInventory = async (data: Omit<TinyInventory, 'id' | 'date' | 'createdAt'>) => {
    setIsSavingInventory(true);
    try {
      await submitTinyInventory(data);
      setInventoryExpanded(false);
      
      if (data.stayedClean === 'no') {
        Alert.alert(
          'Recovery is Progress',
          'Thank you for your honesty. Every day is a new opportunity. Would you like to reset your clean date?',
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Reset Date', onPress: () => navigateTo('/relapse') },
          ]
        );
      } else {
        Alert.alert('Inventory Saved', 'Great job reflecting on your day!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save inventory. Please try again.');
    } finally {
      setIsSavingInventory(false);
    }
  };

  // Toggle context selection
  const toggleContext = (context: PulseContext) => {
    setSelectedContexts(prev => 
      prev.includes(context)
        ? prev.filter(c => c !== context)
        : [...prev, context]
    );
  };

  // If no profile, show onboarding prompt
  if (!sobrietyLoading && !profile) {
    return (
      <SafeAreaView className="flex-1 bg-navy-950">
        <View className="flex-1 items-center justify-center p-6">
          <View className="bg-primary-500/20 p-6 rounded-full mb-6">
            <Feather name="sun" size={48} color="#60a5fa" />
          </View>
          <Text className="text-2xl font-bold text-white text-center">
            Welcome to Recovery Companion
          </Text>
          <Text className="text-surface-400 text-center mt-2 mb-8 px-4">
            Your private, secure companion for your recovery journey.
          </Text>
          <Button
            title="Get Started"
            onPress={() => navigateTo('/onboarding/welcome')}
            size="lg"
            icon="arrow-right"
            iconPosition="right"
          />
        </View>
      </SafeAreaView>
    );
  }

  // Calculate rhythm completion
  const rhythmComplete = todayIntention && todayPulseChecks.length > 0 && todayInventory;
  const rhythmProgress = [todayIntention, todayPulseChecks.length > 0, todayInventory].filter(Boolean).length;

  return (
    <SafeAreaView className="flex-1 bg-navy-950">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Welcome Header */}
        <View className="px-4 pt-4 pb-4 flex-row items-center gap-3">
          <Text className="text-2xl">✨</Text>
          <View className="flex-1">
            <Text className="text-xl font-bold text-white">Welcome back</Text>
            <Text className="text-surface-400 text-sm">
              This space keeps the next right moves visible, not overwhelming.
            </Text>
          </View>
        </View>

        <View className="px-4">
          {/* Clean Time Section */}
          <View className="mb-6">
            <SobrietyCounter
              days={soberDays}
              hours={soberHours}
              minutes={soberMinutes}
              showDetailed={soberDays >= 30}
            />
          </View>

          {/* Step Progress Section */}
          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-3">Step Progress</Text>
            <View className="flex-row gap-3">
              {/* Current Step */}
              <View className="flex-1 bg-navy-800/40 rounded-2xl p-4 border border-surface-700/30">
                <View className="flex-row items-center gap-2 mb-2">
                  <Feather name="bookmark" size={14} color="#60a5fa" />
                  <Text className="text-primary-400 text-xs uppercase tracking-wider">Current Step</Text>
                </View>
                <View className="flex-row items-baseline">
                  <Text className="text-white text-3xl font-bold">{currentStep}</Text>
                  <Text className="text-surface-500 text-sm ml-1">/12</Text>
                </View>
                <Text className="text-surface-400 text-xs mt-2">
                  Tap from nav to pick up where you stopped.
                </Text>
              </View>
              
              {/* Steps Done */}
              <View className="flex-1 bg-navy-800/40 rounded-2xl p-4 border border-surface-700/30">
                <View className="flex-row items-center gap-2 mb-2">
                  <Feather name="check-circle" size={14} color="#4ade80" />
                  <Text className="text-success-400 text-xs uppercase tracking-wider">Steps Done</Text>
                </View>
                <Text className="text-white text-3xl font-bold">{completedSteps}</Text>
                <Text className="text-surface-400 text-xs mt-2">
                  Marked complete with your sponsor.
                </Text>
              </View>
            </View>
          </View>

          {/* Today Shortcuts Section */}
          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-1">Today Shortcuts</Text>
            <Text className="text-surface-500 text-sm mb-3">Curated from your routine</Text>
            
            <View className="gap-3">
              <View className="flex-row gap-3">
                <ShortcutCard
                  icon="book-open"
                  title="Step Work"
                  description={`Continue Step ${currentStep}`}
                  onPress={() => navigateTo('/step-work')}
                  color="primary"
                />
                <ShortcutCard
                  icon="edit-3"
                  title="Journal"
                  description="Capture what actually happened today"
                  onPress={() => navigateTo('/journal/new')}
                  color="primary"
                />
              </View>
              <View className="flex-row gap-3">
                <ShortcutCard
                  icon="alert-circle"
                  title="Emergency"
                  description="Open your support plan instantly"
                  onPress={() => navigateTo('/(tabs)/emergency')}
                  color="danger"
                />
                <ShortcutCard
                  icon="bar-chart-2"
                  title="Insights"
                  description="Patterns, triggers, and progress view"
                  onPress={() => navigateTo('/(tabs)/insights')}
                  color="warning"
                />
              </View>
            </View>
          </View>

          {/* Recovery Rhythm Section */}
          <CollapsibleSection
            icon="activity"
            title="Recovery Rhythm"
            isExpanded={rhythmExpanded}
            onToggle={() => toggleSection(setRhythmExpanded)}
            badge={rhythmComplete ? '✓ Complete' : `${rhythmProgress}/3`}
          >
            <Text className="text-surface-400 text-sm mb-4">
              Three quick check-ins to build your daily recovery habit
            </Text>
            
            {/* Set the Tone */}
            <View className="bg-navy-900/40 rounded-xl mb-3 border border-surface-700/20">
              <TouchableOpacity
                onPress={() => toggleSection(setSetToneExpanded)}
                className="flex-row items-center justify-between p-3"
              >
                <View className="flex-row items-center gap-2">
                  <Feather name="sun" size={16} color="#fbbf24" />
                  <Text className="text-white font-medium">Set the Tone</Text>
                  {todayIntention && (
                    <Feather name="check-circle" size={14} color="#4ade80" />
                  )}
                </View>
                <Feather name={setToneExpanded ? 'minus' : 'plus'} size={18} color="#64748b" />
              </TouchableOpacity>
              {setToneExpanded && (
                <View className="px-3 pb-3">
                  {todayIntention ? (
                    <View className="bg-success-500/10 rounded-lg p-3 mb-3 border border-success-500/30">
                      <Text className="text-success-400 text-sm">Today's intention:</Text>
                      <Text className="text-white font-medium mt-1">"{todayIntention.intention}"</Text>
                    </View>
                  ) : null}
                  <IntentionSelector 
                    selectedIntention={selectedIntention}
                    onSelect={setSelectedIntention}
                    onSave={handleSaveIntention}
                    isSaving={isSavingIntention}
                  />
                </View>
              )}
            </View>

            {/* Pulse Check */}
            <View className="bg-navy-900/40 rounded-xl mb-3 border border-surface-700/20">
              <TouchableOpacity
                onPress={() => toggleSection(setPulseExpanded)}
                className="flex-row items-center justify-between p-3"
              >
                <View className="flex-row items-center gap-2">
                  <Feather name="activity" size={16} color="#60a5fa" />
                  <Text className="text-white font-medium">Pulse Check</Text>
                  {todayPulseChecks.length > 0 && (
                    <View className="flex-row items-center gap-1">
                      <Feather name="check-circle" size={14} color="#4ade80" />
                      <Text className="text-surface-400 text-xs">({todayPulseChecks.length})</Text>
                    </View>
                  )}
                </View>
                <Feather name={pulseExpanded ? 'minus' : 'plus'} size={18} color="#64748b" />
              </TouchableOpacity>
              {pulseExpanded && (
                <View className="px-3 pb-3">
                  {todayPulseChecks.length > 0 && (
                    <View className="bg-primary-500/10 rounded-lg p-3 mb-4 border border-primary-500/30">
                      <Text className="text-primary-400 text-sm">Last check: Mood {todayPulseChecks[0].mood}/10, Craving {todayPulseChecks[0].cravingLevel}/10</Text>
                    </View>
                  )}
                  
                  <MoodSlider
                    label="How's your mood?"
                    value={mood}
                    onChange={setMood}
                    leftLabel="Low"
                    rightLabel="Great"
                    color="primary"
                  />
                  <MoodSlider
                    label="Craving intensity?"
                    value={craving}
                    onChange={setCraving}
                    leftLabel="None"
                    rightLabel="Intense"
                    color={craving >= 7 ? 'danger' : 'primary'}
                  />
                  
                  <Text className="text-surface-400 text-sm mb-2">Context (optional)</Text>
                  <View className="mb-4">
                    <ContextSelector 
                      selectedContexts={selectedContexts}
                      onToggle={toggleContext}
                    />
                  </View>
                  
                  <Button
                    title={isSavingPulse ? 'Saving...' : 'Save Check-In'}
                    onPress={handleSavePulseCheck}
                    icon="check"
                    disabled={isSavingPulse}
                  />
                </View>
              )}
            </View>

            {/* Tiny Inventory */}
            <View className="bg-navy-900/40 rounded-xl border border-surface-700/20">
              <TouchableOpacity
                onPress={() => toggleSection(setInventoryExpanded)}
                className="flex-row items-center justify-between p-3"
              >
                <View className="flex-row items-center gap-2">
                  <Feather name="moon" size={16} color="#a78bfa" />
                  <Text className="text-white font-medium">Tiny Inventory</Text>
                  {todayInventory && (
                    <Feather name="check-circle" size={14} color="#4ade80" />
                  )}
                </View>
                <Feather name={inventoryExpanded ? 'minus' : 'plus'} size={18} color="#64748b" />
              </TouchableOpacity>
              {inventoryExpanded && (
                <View className="px-3 pb-3">
                  {todayInventory ? (
                    <View className="bg-success-500/10 rounded-lg p-3 mb-3 border border-success-500/30">
                      <Text className="text-success-400 text-sm">Inventory complete for today!</Text>
                      <Text className="text-surface-300 text-xs mt-1">
                        Stayed clean: {todayInventory.stayedClean === 'yes' ? '✓ Yes' : todayInventory.stayedClean === 'no' ? '✗ No' : '⚠ Close call'}
                      </Text>
                    </View>
                  ) : (
                    <TinyInventoryForm 
                      onSubmit={handleSaveInventory}
                      isSaving={isSavingInventory}
                    />
                  )}
                </View>
              )}
            </View>
          </CollapsibleSection>

          {/* Today's Check-in */}
          <CollapsibleSection
            icon="check-circle"
            title="Today's Check-in"
            isExpanded={checkinExpanded}
            onToggle={() => toggleSection(setCheckinExpanded)}
            badge={hasCheckedInToday ? '✓' : undefined}
          >
            {hasCheckedInToday ? (
              <View className="items-center py-4">
                <Feather name="check-circle" size={32} color="#4ade80" />
                <Text className="text-success-400 font-medium mt-2">You've checked in today!</Text>
              </View>
            ) : (
              <View>
                <Text className="text-surface-400 mb-4">
                  Take a moment to check in with yourself.
                </Text>
                <Button
                  title="Start Check-in"
                  onPress={() => navigateTo('/checkin')}
                  icon="arrow-right"
                  iconPosition="right"
                />
              </View>
            )}
          </CollapsibleSection>
        </View>

        {/* Bottom spacing */}
        <View className="h-24" />
      </ScrollView>

      {/* Floating "I'm in a scene" button */}
      <TouchableOpacity
        onPress={() => navigateTo('/scenarios')}
        className="absolute bottom-24 left-4 bg-accent-500 py-3 px-5 rounded-full flex-row items-center"
        style={{ elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
        accessibilityRole="button"
        accessibilityLabel="I'm in a scene - get immediate help"
      >
        <Feather name="zap" size={18} color="#fff" />
        <Text className="text-white font-semibold ml-2">I'm in a scene</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
