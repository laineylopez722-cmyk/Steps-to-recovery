/**
 * Sponsor Connection Screen
 * Manage sponsor/sponsee connections for limited data sharing
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Button } from '../components/ui';
import { useContactStore } from '../lib/store';
import { useSobriety } from '../lib/hooks/useSobriety';
import { useCheckin } from '../lib/hooks/useCheckin';
import { useMeetings } from '../lib/hooks/useMeetings';
import {
  generateSponsorCode,
  getCurrentSponsorCode,
  revokeSponsorCode,
  getSponseeConnections,
  addSponseeConnection,
  removeSponseeConnection,
  generateShareData,
  generateShareMessage,
  isValidCodeFormat,
  type ConnectionCode,
  type SponseeConnection,
  type SponsorShareData,
} from '../lib/services/sponsorConnection';
import { useStepWorkStore } from '../lib/store';

type TabType = 'sponsee' | 'sponsor';

// Tab selector component
function TabSelector({
  activeTab,
  onSelect,
}: {
  activeTab: TabType;
  onSelect: (tab: TabType) => void;
}) {
  return (
    <View className="flex-row bg-navy-800/40 rounded-xl p-1 mb-6">
      <TouchableOpacity
        onPress={() => onSelect('sponsee')}
        className={`flex-1 py-3 rounded-lg ${
          activeTab === 'sponsee' ? 'bg-primary-500' : ''
        }`}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'sponsee' }}
      >
        <Text className={`text-center font-medium ${
          activeTab === 'sponsee' ? 'text-white' : 'text-surface-400'
        }`}>
          I'm a Sponsee
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onSelect('sponsor')}
        className={`flex-1 py-3 rounded-lg ${
          activeTab === 'sponsor' ? 'bg-primary-500' : ''
        }`}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'sponsor' }}
      >
        <Text className={`text-center font-medium ${
          activeTab === 'sponsor' ? 'text-white' : 'text-surface-400'
        }`}>
          I'm a Sponsor
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Sponsee view - share data with sponsor
function SponseeView() {
  const [connectionCode, setConnectionCode] = useState<ConnectionCode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  const { sponsor } = useContactStore();
  const { profile, soberDays } = useSobriety();
  const { checkinStreak, averageMood, averageCraving, todayCheckin } = useCheckin();
  const { meetings: meetingLogs } = useMeetings();
  const { progress: stepProgress } = useStepWorkStore();

  // Load existing code on mount
  useEffect(() => {
    loadCode();
  }, []);

  const loadCode = async () => {
    setIsLoading(true);
    const code = await getCurrentSponsorCode();
    setConnectionCode(code);
    setIsLoading(false);
  };

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      const code = await generateSponsorCode();
      setConnectionCode(code);
      Alert.alert(
        'Code Generated!',
        `Share this code with your sponsor: ${code.code}\n\nIt expires in 7 days.`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to generate code. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = async () => {
    if (!connectionCode) return;

    try {
      await Clipboard.setStringAsync(connectionCode.code);
      Alert.alert('Copied!', 'Connection code copied to clipboard.');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy code. Please try again.');
    }
  };

  const handleRevokeCode = async () => {
    Alert.alert(
      'Revoke Code?',
      'This will invalidate your current connection code. Your sponsor will need a new code to receive updates.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            await revokeSponsorCode();
            setConnectionCode(null);
          },
        },
      ]
    );
  };

  const handleShareUpdate = async () => {
    setIsSharing(true);
    try {
      // Calculate current step
      const currentStep = stepProgress.find(p => p.questionsAnswered < p.totalQuestions)?.stepNumber || 1;
      
      // Calculate meetings this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const meetingsThisWeek = meetingLogs.filter(
        (m) => new Date(m.attendedAt) >= oneWeekAgo
      ).length;

      // Get last meeting date
      const lastMeeting = meetingLogs[0];
      
      const shareData = await generateShareData(
        {
          displayName: profile?.displayName,
          soberDays,
          programType: profile?.programType || 'NA',
        },
        {
          lastCheckinDate: todayCheckin?.createdAt,
          checkinStreak,
          currentStep,
          meetingsThisWeek,
          lastMeetingDate: lastMeeting?.attendedAt,
          averageMoodLast7Days: averageMood || undefined,
          averageCravingLast7Days: averageCraving || undefined,
        }
      );
      
      const message = generateShareMessage(shareData);
      
      await Share.share({
        message,
        title: 'Recovery Update',
      });
    } catch (error) {
      if ((error as Error).message !== 'User did not share') {
        Alert.alert('Error', 'Failed to share update. Please try again.');
      }
    } finally {
      setIsSharing(false);
    }
  };

  if (isLoading) {
    return (
      <View className="items-center py-8">
        <Text className="text-surface-400">Loading...</Text>
      </View>
    );
  }

  return (
    <View>
      {/* Sponsor info */}
      {sponsor ? (
        <View className="bg-success-500/10 rounded-2xl p-4 mb-6 border border-success-500/30">
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 rounded-full bg-success-500/20 items-center justify-center">
              <Feather name="user-check" size={24} color="#4ade80" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold">{sponsor.name}</Text>
              <Text className="text-success-400 text-sm">Your Sponsor</Text>
            </View>
          </View>
        </View>
      ) : (
        <View className="bg-navy-800/40 rounded-2xl p-4 mb-6 border border-surface-700/30">
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 rounded-full bg-surface-700/50 items-center justify-center">
              <Feather name="user-plus" size={24} color="#64748b" />
            </View>
            <View className="flex-1">
              <Text className="text-surface-300">No sponsor added yet</Text>
              <Text className="text-surface-500 text-sm">Add your sponsor in Contacts</Text>
            </View>
          </View>
        </View>
      )}

      {/* Connection code section */}
      <View className="bg-navy-800/40 rounded-2xl p-5 mb-6 border border-surface-700/30">
        <Text className="text-white font-semibold mb-2">Connection Code</Text>
        <Text className="text-surface-400 text-sm mb-4">
          Share this code with your sponsor so they can receive your recovery updates.
        </Text>

        {connectionCode && !connectionCode.isExpired ? (
          <View>
            <View className="bg-navy-900/60 rounded-xl p-4 mb-3 items-center">
              <Text className="text-primary-400 text-3xl font-mono font-bold tracking-wider">
                {connectionCode.code}
              </Text>
              <Text className="text-surface-500 text-xs mt-2">
                Expires: {connectionCode.expiresAt.toLocaleDateString()}
              </Text>
            </View>
            <View className="flex-row gap-3">
              <Button
                title="Copy"
                onPress={handleCopyCode}
                variant="outline"
                icon="copy"
              />
              <Button
                title="Revoke"
                onPress={handleRevokeCode}
                variant="secondary"
                icon="x"
              />
            </View>
          </View>
        ) : (
          <Button
            title={isGenerating ? 'Generating...' : 'Generate Code'}
            onPress={handleGenerateCode}
            icon="key"
            disabled={isGenerating}
          />
        )}
      </View>

      {/* Share update section */}
      <View className="bg-navy-800/40 rounded-2xl p-5 border border-surface-700/30">
        <Text className="text-white font-semibold mb-2">Share Recovery Update</Text>
        <Text className="text-surface-400 text-sm mb-4">
          Send a summary of your recovery progress to your sponsor. Only includes:
        </Text>
        <View className="mb-4">
          {[
            'Clean time',
            'Check-in streak',
            'Current step',
            'Meetings this week',
            'Average mood & craving (7 days)',
          ].map((item) => (
            <View key={item} className="flex-row items-center gap-2 mb-1">
              <Feather name="check" size={14} color="#4ade80" />
              <Text className="text-surface-300 text-sm">{item}</Text>
            </View>
          ))}
        </View>
        <Text className="text-surface-500 text-xs mb-4">
          Journal entries, detailed moods, and personal notes are never shared.
        </Text>
        <Button
          title={isSharing ? 'Preparing...' : 'Share Update'}
          onPress={handleShareUpdate}
          icon="share-2"
          disabled={isSharing}
        />
      </View>
    </View>
  );
}

// Sponsor view - receive updates from sponsees
function SponsorView() {
  const [sponsees, setSponsees] = useState<SponseeConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadSponsees();
  }, []);

  const loadSponsees = async () => {
    setIsLoading(true);
    const connections = await getSponseeConnections();
    setSponsees(connections);
    setIsLoading(false);
  };

  const handleAddSponsee = async () => {
    if (!newCode || !newName) {
      Alert.alert('Missing Info', 'Please enter both the connection code and sponsee name.');
      return;
    }

    const formattedCode = newCode.toUpperCase().trim();
    
    if (!isValidCodeFormat(formattedCode)) {
      Alert.alert('Invalid Code', 'Please enter a valid connection code (format: RC-XXXXXX).');
      return;
    }

    try {
      await addSponseeConnection(formattedCode, newName.trim());
      setNewCode('');
      setNewName('');
      await loadSponsees();
      Alert.alert('Success', `${newName} has been added to your sponsees.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to add sponsee. Please try again.');
    }
  };

  const handleRemoveSponsee = (sponsee: SponseeConnection) => {
    Alert.alert(
      'Remove Sponsee?',
      `Remove ${sponsee.name} from your sponsees?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeSponseeConnection(sponsee.id);
            await loadSponsees();
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="items-center py-8">
        <Text className="text-surface-400">Loading...</Text>
      </View>
    );
  }

  return (
    <View>
      {/* Add sponsee section */}
      <View className="bg-navy-800/40 rounded-2xl p-5 mb-6 border border-surface-700/30">
        <Text className="text-white font-semibold mb-2">Add a Sponsee</Text>
        <Text className="text-surface-400 text-sm mb-4">
          Enter the connection code your sponsee shared with you.
        </Text>
        
        <View className="mb-3">
          <Text className="text-surface-400 text-xs mb-1">Connection Code</Text>
          <TouchableOpacity
            onPress={() => {
              Alert.prompt(
                'Connection Code',
                'Enter the code your sponsee shared (e.g., RC-ABC123)',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'OK', onPress: (text?: string) => text && setNewCode(text) },
                ],
                'plain-text',
                newCode
              );
            }}
            className="bg-navy-900/60 rounded-xl px-4 py-3 border border-surface-600/50"
          >
            <Text className={newCode ? 'text-white font-mono' : 'text-surface-500'}>
              {newCode || 'Tap to enter code...'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View className="mb-4">
          <Text className="text-surface-400 text-xs mb-1">Sponsee Name</Text>
          <TouchableOpacity
            onPress={() => {
              Alert.prompt(
                'Sponsee Name',
                'Enter your sponsee\'s name',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'OK', onPress: (text?: string) => text && setNewName(text) },
                ],
                'plain-text',
                newName
              );
            }}
            className="bg-navy-900/60 rounded-xl px-4 py-3 border border-surface-600/50"
          >
            <Text className={newName ? 'text-white' : 'text-surface-500'}>
              {newName || 'Tap to enter name...'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <Button
          title="Add Sponsee"
          onPress={handleAddSponsee}
          icon="user-plus"
          disabled={!newCode || !newName}
        />
      </View>

      {/* Sponsees list */}
      <View className="bg-navy-800/40 rounded-2xl p-5 border border-surface-700/30">
        <Text className="text-white font-semibold mb-4">Your Sponsees</Text>
        
        {sponsees.length === 0 ? (
          <View className="items-center py-6">
            <Feather name="users" size={32} color="#64748b" />
            <Text className="text-surface-400 mt-3">No sponsees connected yet</Text>
            <Text className="text-surface-500 text-sm text-center mt-1">
              Ask your sponsees to generate a connection code and share it with you.
            </Text>
          </View>
        ) : (
          <View>
            {sponsees.map((sponsee) => (
              <View
                key={sponsee.id}
                className="flex-row items-center justify-between py-3 border-b border-surface-700/30 last:border-0"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-full bg-primary-500/20 items-center justify-center">
                    <Text className="text-primary-400 font-semibold">
                      {sponsee.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-white font-medium">{sponsee.name}</Text>
                    <Text className="text-surface-500 text-xs">
                      Connected: {sponsee.connectedAt.toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveSponsee(sponsee)}
                  className="p-2"
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${sponsee.name}`}
                >
                  <Feather name="trash-2" size={18} color="#f87171" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Info section */}
      <View className="mt-6 bg-primary-500/10 rounded-2xl p-4 border border-primary-500/30">
        <View className="flex-row items-center gap-2 mb-2">
          <Feather name="info" size={16} color="#60a5fa" />
          <Text className="text-primary-400 font-medium">How it works</Text>
        </View>
        <Text className="text-surface-300 text-sm leading-5">
          When your sponsees share updates from their app, they'll send you a text or email with a summary of their recovery progress. This helps you stay connected and supportive without accessing their private data.
        </Text>
      </View>
    </View>
  );
}

export default function SponsorConnectionScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('sponsee');

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
        <Text className="text-white text-lg font-semibold">Sponsor Connection</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {/* Introduction */}
        <View className="bg-navy-800/40 rounded-2xl p-4 mb-6 border border-surface-700/30">
          <View className="flex-row items-center gap-2 mb-2">
            <Feather name="link" size={18} color="#60a5fa" />
            <Text className="text-primary-400 font-semibold">Stay Connected</Text>
          </View>
          <Text className="text-surface-300 text-sm leading-5">
            Share recovery updates with your sponsor or track your sponsees' progress. 
            All data stays private - only summary information is shared when you choose.
          </Text>
        </View>

        {/* Tab selector */}
        <TabSelector activeTab={activeTab} onSelect={setActiveTab} />

        {/* Tab content */}
        {activeTab === 'sponsee' ? <SponseeView /> : <SponsorView />}

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

