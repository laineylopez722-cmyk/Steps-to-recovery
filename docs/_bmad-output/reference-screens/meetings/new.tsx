/**
 * New Meeting Screen
 * Log a meeting with mood, takeaways, connections, and topics
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, Button, Slider } from '../../components/ui';
import { useMeetings } from '../../lib/hooks/useMeetings';
import { useRegularMeetings } from '../../lib/hooks/useRegularMeetings';
import { MEETING_TOPICS } from '../../lib/constants/meetingTopics';
import type { MeetingType, MeetingConnectionMode } from '../../lib/types';

const CONNECTION_OPTIONS: { value: MeetingConnectionMode; label: string; icon: string }[] = [
  { value: 'got_number', label: 'Got a number', icon: '📱' },
  { value: 'conversation', label: 'Had a conversation', icon: '💬' },
  { value: 'made_plans', label: 'Made plans', icon: '📅' },
  { value: 'sponsor_chat', label: 'Talked to sponsor', icon: '⭐' },
];

export default function NewMeetingScreen() {
  const router = useRouter();
  const { createMeeting } = useMeetings();
  const { meetings: regularMeetings, todayMeetings } = useRegularMeetings();

  // Form state - Basic
  const [meetingName, setMeetingName] = useState('');
  const [location, setLocation] = useState('');
  const [meetingType, setMeetingType] = useState<MeetingType>('in-person');
  const [moodBefore, setMoodBefore] = useState(5);
  const [moodAfter, setMoodAfter] = useState(5);
  const [keyTakeaways, setKeyTakeaways] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  
  // Form state - Enhanced (Phase 2)
  const [whatILearned, setWhatILearned] = useState('');
  const [quoteHeard, setQuoteHeard] = useState('');
  const [selectedConnections, setSelectedConnections] = useState<MeetingConnectionMode[]>([]);
  const [connectionNotes, setConnectionNotes] = useState('');
  const [didShare, setDidShare] = useState(false);
  const [shareReflection, setShareReflection] = useState('');
  const [selectedRegularMeetingId, setSelectedRegularMeetingId] = useState<string | undefined>();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Current step in the flow
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Pre-fill from today's meetings if available
  useEffect(() => {
    if (todayMeetings.length > 0) {
      const meeting = todayMeetings[0];
      setMeetingName(meeting.name);
      setLocation(meeting.location || '');
      setMeetingType(meeting.type as MeetingType);
      setSelectedRegularMeetingId(meeting.id);
    }
  }, [todayMeetings]);

  const getMoodEmoji = (mood: number) => {
    if (mood <= 2) return '😢';
    if (mood <= 4) return '😔';
    if (mood <= 6) return '😐';
    if (mood <= 8) return '🙂';
    return '😊';
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : [...prev, topic]
    );
  };

  const toggleConnection = (connection: MeetingConnectionMode) => {
    setSelectedConnections((prev) =>
      prev.includes(connection)
        ? prev.filter((c) => c !== connection)
        : [...prev, connection]
    );
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await createMeeting({
        name: meetingName || undefined,
        location: location || undefined,
        type: meetingType,
        moodBefore,
        moodAfter,
        keyTakeaways,
        topicTags: selectedTopics,
        // Enhanced fields
        whatILearned: whatILearned || undefined,
        quoteHeard: quoteHeard || undefined,
        connectionsMode: selectedConnections.length > 0 ? selectedConnections : undefined,
        connectionNotes: connectionNotes || undefined,
        didShare,
        shareReflection: shareReflection || undefined,
        regularMeetingId: selectedRegularMeetingId,
      });

      Alert.alert(
        'Meeting Logged!',
        'Your meeting has been recorded. Keep coming back!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Failed to log meeting:', error);
      Alert.alert('Error', 'Failed to save meeting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-4 py-6"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity onPress={handleBack}>
              <Text className="text-primary-600">
                {step > 1 ? '← Back' : '← Cancel'}
              </Text>
            </TouchableOpacity>
            <Text className="text-surface-500">
              Step {step} of {totalSteps}
            </Text>
          </View>

          {/* Progress Bar */}
          <View className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full mb-8">
            <View
              className="h-2 bg-primary-500 rounded-full"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </View>

          {/* Step 1: Meeting Type & Details */}
          {step === 1 && (
            <View>
              <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">
                Meeting Details
              </Text>
              <Text className="text-surface-500 mb-6">
                What meeting did you attend?
              </Text>

              {/* Quick Select from Regular Meetings */}
              {regularMeetings.length > 0 && (
                <View className="mb-6">
                  <Text className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-2">
                    Quick Select
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      {regularMeetings.slice(0, 5).map((meeting) => (
                        <TouchableOpacity
                          key={meeting.id}
                          onPress={() => {
                            setMeetingName(meeting.name);
                            setLocation(meeting.location || '');
                            setMeetingType(meeting.type as MeetingType);
                            setSelectedRegularMeetingId(meeting.id);
                          }}
                          className={`px-4 py-2 rounded-lg border ${
                            selectedRegularMeetingId === meeting.id
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                              : 'border-surface-200 dark:border-surface-700'
                          }`}
                        >
                          <Text
                            className={`text-sm ${
                              selectedRegularMeetingId === meeting.id
                                ? 'text-primary-700 dark:text-primary-300 font-medium'
                                : 'text-surface-600 dark:text-surface-400'
                            }`}
                          >
                            {meeting.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Meeting Type */}
              <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-3">
                Meeting Type
              </Text>
              <View className="flex-row gap-3 mb-6">
                <TouchableOpacity
                  onPress={() => setMeetingType('in-person')}
                  className={`flex-1 p-4 rounded-xl border-2 ${
                    meetingType === 'in-person'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                      : 'border-surface-200 dark:border-surface-700'
                  }`}
                >
                  <Text className="text-3xl text-center mb-2">📍</Text>
                  <Text
                    className={`text-center font-medium ${
                      meetingType === 'in-person'
                        ? 'text-primary-700 dark:text-primary-300'
                        : 'text-surface-600 dark:text-surface-400'
                    }`}
                  >
                    In Person
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setMeetingType('online')}
                  className={`flex-1 p-4 rounded-xl border-2 ${
                    meetingType === 'online'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                      : 'border-surface-200 dark:border-surface-700'
                  }`}
                >
                  <Text className="text-3xl text-center mb-2">💻</Text>
                  <Text
                    className={`text-center font-medium ${
                      meetingType === 'online'
                        ? 'text-primary-700 dark:text-primary-300'
                        : 'text-surface-600 dark:text-surface-400'
                    }`}
                  >
                    Online
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Meeting Name (optional) */}
              <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-2">
                Meeting Name (optional)
              </Text>
              <TextInput
                value={meetingName}
                onChangeText={setMeetingName}
                placeholder="e.g., Friday Night Group"
                placeholderTextColor="#9ca3af"
                className="bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-100 mb-4"
              />

              {/* Location (optional) */}
              <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-2">
                Location (optional)
              </Text>
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder={
                  meetingType === 'in-person'
                    ? 'e.g., Community Center'
                    : 'e.g., Zoom'
                }
                placeholderTextColor="#9ca3af"
                className="bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-100"
              />
            </View>
          )}

          {/* Step 2: Mood Before & After */}
          {step === 2 && (
            <View>
              <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">
                How Did It Go?
              </Text>
              <Text className="text-surface-500 mb-8">
                Track your mood before and after the meeting
              </Text>

              {/* Mood Before */}
              <Card variant="default" className="mb-6">
                <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-4">
                  Before the meeting
                </Text>
                <View className="items-center mb-4">
                  <Text className="text-6xl mb-2">{getMoodEmoji(moodBefore)}</Text>
                  <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                    {moodBefore}/10
                  </Text>
                </View>
                <Slider
                  value={moodBefore}
                  onValueChange={setMoodBefore}
                  min={1}
                  max={10}
                  step={1}
                />
              </Card>

              {/* Mood After */}
              <Card variant="default" className="mb-4">
                <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-4">
                  After the meeting
                </Text>
                <View className="items-center mb-4">
                  <Text className="text-6xl mb-2">{getMoodEmoji(moodAfter)}</Text>
                  <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                    {moodAfter}/10
                  </Text>
                </View>
                <Slider
                  value={moodAfter}
                  onValueChange={setMoodAfter}
                  min={1}
                  max={10}
                  step={1}
                />
              </Card>

              {/* Mood change indicator */}
              {moodAfter !== moodBefore && (
                <Card
                  variant="default"
                  className={`${
                    moodAfter > moodBefore
                      ? 'bg-green-50 dark:bg-green-900/30'
                      : 'bg-amber-50 dark:bg-amber-900/30'
                  }`}
                >
                  <View className="flex-row items-center justify-center gap-2">
                    <Text>
                      {moodAfter > moodBefore ? '📈' : '📉'}
                    </Text>
                    <Text
                      className={
                        moodAfter > moodBefore
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-amber-700 dark:text-amber-300'
                      }
                    >
                      Mood {moodAfter > moodBefore ? 'improved' : 'changed'} by{' '}
                      {Math.abs(moodAfter - moodBefore)} points
                    </Text>
                  </View>
                </Card>
              )}
            </View>
          )}

          {/* Step 3: Reflections */}
          {step === 3 && (
            <View>
              <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">
                Meeting Reflections
              </Text>
              <Text className="text-surface-500 mb-6">
                What stood out to you?
              </Text>

              {/* Key Takeaways */}
              <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-2">
                Key Takeaways
              </Text>
              <TextInput
                value={keyTakeaways}
                onChangeText={setKeyTakeaways}
                placeholder="What resonated with you today?"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                className="bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-100 min-h-[80px] mb-4"
                textAlignVertical="top"
              />

              {/* What I Learned */}
              <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-2">
                What did I learn?
              </Text>
              <TextInput
                value={whatILearned}
                onChangeText={setWhatILearned}
                placeholder="Something new I discovered..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={2}
                className="bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-100 min-h-[60px] mb-4"
                textAlignVertical="top"
              />

              {/* Quote Heard */}
              <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-2">
                Something I heard (quote or phrase)
              </Text>
              <TextInput
                value={quoteHeard}
                onChangeText={setQuoteHeard}
                placeholder='"Progress, not perfection..."'
                placeholderTextColor="#9ca3af"
                className="bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-100 mb-4"
              />
            </View>
          )}

          {/* Step 4: Connections & Sharing */}
          {step === 4 && (
            <View>
              <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">
                Fellowship Connections
              </Text>
              <Text className="text-surface-500 mb-6">
                How did you connect with others?
              </Text>

              {/* Connection Types */}
              <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-3">
                What connections did you make?
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                {CONNECTION_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => toggleConnection(option.value)}
                    className={`px-4 py-2 rounded-full border ${
                      selectedConnections.includes(option.value)
                        ? 'bg-green-500 border-green-500'
                        : 'border-surface-300 dark:border-surface-600'
                    }`}
                  >
                    <Text
                      className={`${
                        selectedConnections.includes(option.value)
                          ? 'text-white'
                          : 'text-surface-700 dark:text-surface-300'
                      }`}
                    >
                      {option.icon} {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Connection Notes */}
              {selectedConnections.length > 0 && (
                <>
                  <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Notes about connections (optional)
                  </Text>
                  <TextInput
                    value={connectionNotes}
                    onChangeText={setConnectionNotes}
                    placeholder="Names, topics discussed..."
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={2}
                    className="bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-100 min-h-[60px] mb-6"
                    textAlignVertical="top"
                  />
                </>
              )}

              {/* Did You Share? */}
              <Card variant="default" className="mb-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Text className="text-2xl mr-3">🎤</Text>
                    <View className="flex-1">
                      <Text className="text-surface-900 dark:text-surface-100 font-medium">
                        Did you share?
                      </Text>
                      <Text className="text-sm text-surface-500">
                        Even just saying your name counts!
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={didShare}
                    onValueChange={setDidShare}
                    trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
                    thumbColor={didShare ? '#3b82f6' : '#f4f4f5'}
                  />
                </View>
              </Card>

              {/* Share Reflection */}
              {didShare && (
                <>
                  <Text className="text-base font-medium text-surface-700 dark:text-surface-300 mb-2">
                    How did it feel to share?
                  </Text>
                  <TextInput
                    value={shareReflection}
                    onChangeText={setShareReflection}
                    placeholder="Nervous at first, but felt good after..."
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={2}
                    className="bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-100 min-h-[60px]"
                    textAlignVertical="top"
                  />
                </>
              )}
            </View>
          )}

          {/* Step 5: Topics & Summary */}
          {step === 5 && (
            <View>
              <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">
                Topics Discussed
              </Text>
              <Text className="text-surface-500 mb-6">
                What was the meeting about? (Select all that apply)
              </Text>

              <View className="flex-row flex-wrap gap-2 mb-6">
                {MEETING_TOPICS.map((topic) => (
                  <TouchableOpacity
                    key={topic.name}
                    onPress={() => toggleTopic(topic.name)}
                    className={`px-4 py-2 rounded-full border ${
                      selectedTopics.includes(topic.name)
                        ? 'bg-primary-500 border-primary-500'
                        : 'border-surface-300 dark:border-surface-600'
                    }`}
                  >
                    <Text
                      className={`${
                        selectedTopics.includes(topic.name)
                          ? 'text-white'
                          : 'text-surface-700 dark:text-surface-300'
                      }`}
                    >
                      {topic.emoji} {topic.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Summary */}
              <Card variant="outlined" className="mb-4">
                <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-3">
                  Meeting Summary
                </Text>
                <View className="space-y-2">
                  <View className="flex-row justify-between">
                    <Text className="text-surface-500">Type</Text>
                    <Text className="text-surface-900 dark:text-surface-100">
                      {meetingType === 'in-person' ? '📍 In Person' : '💻 Online'}
                    </Text>
                  </View>
                  {meetingName && (
                    <View className="flex-row justify-between">
                      <Text className="text-surface-500">Name</Text>
                      <Text className="text-surface-900 dark:text-surface-100">
                        {meetingName}
                      </Text>
                    </View>
                  )}
                  <View className="flex-row justify-between">
                    <Text className="text-surface-500">Mood Change</Text>
                    <Text
                      className={
                        moodAfter > moodBefore
                          ? 'text-green-600 font-medium'
                          : moodAfter < moodBefore
                          ? 'text-red-600 font-medium'
                          : 'text-surface-900 dark:text-surface-100'
                      }
                    >
                      {moodBefore} → {moodAfter}{' '}
                      {moodAfter > moodBefore && '📈'}
                      {moodAfter < moodBefore && '📉'}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-surface-500">Topics</Text>
                    <Text className="text-surface-900 dark:text-surface-100">
                      {selectedTopics.length || 'None'}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-surface-500">Connections</Text>
                    <Text className="text-surface-900 dark:text-surface-100">
                      {selectedConnections.length || 'None'}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-surface-500">Shared</Text>
                    <Text className="text-surface-900 dark:text-surface-100">
                      {didShare ? '✓ Yes' : 'No'}
                    </Text>
                  </View>
                </View>
              </Card>
            </View>
          )}
        </ScrollView>

        {/* Actions */}
        <View className="px-4 py-4 border-t border-surface-200 dark:border-surface-700">
          {step < totalSteps ? (
            <Button title="Continue" onPress={handleNext} size="lg" />
          ) : (
            <Button
              title={isSubmitting ? 'Saving...' : 'Log Meeting'}
              onPress={handleSubmit}
              disabled={isSubmitting}
              size="lg"
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
