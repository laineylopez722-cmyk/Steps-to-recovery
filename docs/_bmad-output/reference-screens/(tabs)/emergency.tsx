/**
 * Emergency Tab Screen
 * Crisis resources and support - matches reference site design
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSettingsStore } from '../../lib/store';
import {
  getCrisisResources,
  type CrisisHotline,
} from '../../lib/constants/crisisResources';

// Section card component
function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="bg-navy-800/40 rounded-2xl p-4 mb-4 border border-surface-700/30">
      <View className="flex-row items-center gap-2 mb-3">
        <Feather name={icon} size={18} color="#60a5fa" />
        <Text className="text-primary-400 font-semibold">{title}</Text>
      </View>
      {children}
    </View>
  );
}

// Quick action button
function QuickActionButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-navy-800/40 rounded-2xl p-4 items-center flex-1 border border-surface-700/30"
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Feather name={icon} size={24} color="#94a3b8" />
      <Text className="text-surface-300 text-xs mt-2 text-center">{label}</Text>
    </TouchableOpacity>
  );
}

export default function EmergencyScreen() {
  const router = useRouter();
  const { settings } = useSettingsStore();
  
  const currentRegion = settings?.crisisRegion || 'AU';
  const resources = getCrisisResources(currentRegion);

  const handleCall = (hotline: CrisisHotline) => {
    const phoneNumber = hotline.phone.replace(/\D/g, '');
    
    Alert.alert(
      `Call ${hotline.name}?`,
      hotline.isEmergency 
        ? 'This will connect you to emergency services.'
        : `You will be connected to ${hotline.phone}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          style: hotline.isEmergency ? 'destructive' : 'default',
          onPress: () => Linking.openURL(`tel:${phoneNumber}`),
        },
      ]
    );
  };

  const handleSMS = (number: string) => {
    Linking.openURL(`sms:${number.replace(/\D/g, '')}`);
  };

  const openExternalLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView className="flex-1 bg-navy-950">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="items-center px-4 pt-6 pb-6">
          <View className="bg-danger-500/20 p-4 rounded-full mb-4">
            <Feather name="alert-circle" size={32} color="#f87171" />
          </View>
          <Text className="text-white text-2xl font-bold text-center">Emergency Help</Text>
          <Text className="text-surface-400 text-center mt-2">
            You're not alone. Help is available right now.
          </Text>
        </View>

        <View className="px-4">
          {/* Safety Plan Card */}
          <SectionCard icon="shield" title="Create Your Safety Plan">
            <Text className="text-surface-400 text-sm mb-4">
              Build a personalized safety plan when you're stable. It will be ready when you need it most.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/scenarios')}
              className="bg-primary-500 py-3 px-6 rounded-xl flex-row items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Create Safety Plan"
            >
              <Feather name="shield" size={18} color="#fff" />
              <Text className="text-white font-semibold ml-2">Create Safety Plan</Text>
            </TouchableOpacity>
          </SectionCard>

          {/* Crisis Lines */}
          <SectionCard icon="phone" title="Crisis Lines - Available 24/7">
            {resources.hotlines.slice(0, 4).map((hotline) => (
              <TouchableOpacity
                key={hotline.id}
                onPress={() => handleCall(hotline)}
                className="flex-row justify-between items-center py-3 border-b border-surface-700/30 last:border-0"
                accessibilityRole="button"
                accessibilityLabel={`Call ${hotline.name}`}
              >
                <View className="flex-1 pr-4">
                  <Text className="text-white font-medium">{hotline.name}</Text>
                  <Text className="text-surface-500 text-sm" numberOfLines={1}>
                    {hotline.description}
                  </Text>
                </View>
                <Text className="text-primary-400 font-semibold">{hotline.phone}</Text>
              </TouchableOpacity>
            ))}
          </SectionCard>

          {/* NA Fellowship Support */}
          <SectionCard icon="users" title="NA Australia Fellowship Support">
            <View className="py-2 border-b border-surface-700/30">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-white font-medium">NA Helpline</Text>
                  <Text className="text-surface-500 text-sm">24/7 recovery support and information</Text>
                </View>
                <TouchableOpacity onPress={() => handleCall({ id: 'na', name: 'NA Helpline', phone: '1300 652 820', description: '', available: '24/7', color: '#3b82f6' })}>
                  <Text className="text-primary-400 font-semibold">1300 652 820</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View className="py-3">
              <View className="flex-row justify-between items-center mb-2">
                <View>
                  <Text className="text-white font-medium">Meeting Info Line</Text>
                  <Text className="text-surface-500 text-sm">Call or SMS for nearby meetings</Text>
                </View>
                <TouchableOpacity onPress={() => handleCall({ id: 'meeting', name: 'Meeting Info', phone: '0488 811 247', description: '', available: '24/7', color: '#3b82f6' })}>
                  <Text className="text-primary-400 font-semibold">0488 811 247</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => handleSMS('0488811247')}
                className="bg-navy-700/50 py-2 px-4 rounded-lg flex-row items-center justify-center mt-2"
              >
                <Feather name="message-circle" size={16} color="#94a3b8" />
                <Text className="text-surface-300 ml-2 text-sm">SMS for Meetings</Text>
              </TouchableOpacity>
              <Text className="text-surface-500 text-xs mt-2">
                <Text className="text-surface-400 font-medium">SMS Tip:</Text> Text your postcode and state (e.g., "2000 NSW") to receive a list of meetings.
              </Text>
            </View>
          </SectionCard>

          {/* Add Sponsor */}
          <View className="bg-navy-800/40 rounded-2xl p-6 mb-4 items-center border border-surface-700/30">
            <Feather name="user" size={32} color="#64748b" />
            <Text className="text-white font-semibold mt-3">Add Your Sponsor</Text>
            <Text className="text-surface-400 text-sm text-center mt-1">
              Quick access when you need support
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/contacts/add')}
              className="bg-primary-500/20 py-2 px-6 rounded-xl mt-4"
            >
              <Text className="text-primary-400 font-medium">Add Sponsor Info</Text>
            </TouchableOpacity>
          </View>

          {/* Recovery Scenes */}
          <SectionCard icon="play-circle" title="Recovery Scenes">
            <Text className="text-surface-400 text-sm mb-4">
              Open a situation-specific playbook for your current moment. These scenes help you navigate high-risk situations with prepared actions.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/scenarios')}
              className="bg-accent-500/20 py-3 px-6 rounded-xl flex-row items-center justify-center"
            >
              <Feather name="zap" size={18} color="#fb923c" />
              <Text className="text-accent-400 font-semibold ml-2">I'm in a scene</Text>
            </TouchableOpacity>
          </SectionCard>

          {/* Find Meeting Button */}
          <TouchableOpacity
            onPress={() => openExternalLink('https://www.na.org.au/multi/searchable-map/')}
            className="bg-success-500 py-4 rounded-xl flex-row items-center justify-center mb-4"
            accessibilityRole="link"
            accessibilityLabel="Find NA Meeting Near Me"
          >
            <Feather name="map-pin" size={20} color="#fff" />
            <Text className="text-white font-semibold ml-2">Find NA Meeting Near Me</Text>
          </TouchableOpacity>

          {/* Quick Action Buttons */}
          <View className="flex-row gap-3 mb-4">
            <QuickActionButton icon="clock" label="5 Minute Timer" onPress={() => router.push('/timer')} />
            <QuickActionButton icon="heart" label="Breathing Exercise" onPress={() => router.push('/breathing')} />
          </View>
          <View className="flex-row gap-3 mb-4">
            <QuickActionButton icon="anchor" label="Grounding Techniques" onPress={() => router.push('/grounding')} />
            <QuickActionButton icon="sun" label="Mindfulness Pack" onPress={() => router.push('/mindfulness')} />
          </View>
          <View className="flex-row gap-3 mb-6">
            <QuickActionButton icon="file-text" label="Coping Strategies" onPress={() => router.push('/coping')} />
            <View className="flex-1" />
          </View>

          {/* Remember Section */}
          <View className="bg-navy-800/40 rounded-2xl p-4 mb-8 border border-surface-700/30">
            <View className="flex-row items-center gap-2 mb-3">
              <Feather name="heart" size={18} color="#f87171" />
              <Text className="text-white font-semibold">Remember</Text>
            </View>
            <Text className="text-surface-400 text-sm leading-6">
              • Cravings are temporary - they will pass{'\n'}
              • You have the tools to get through this{'\n'}
              • Reaching out is a sign of strength, not weakness{'\n'}
              • One day at a time - you've got this
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating "I'm in a scene" button */}
      <TouchableOpacity
        onPress={() => router.push('/scenarios')}
        className="absolute bottom-24 left-4 bg-accent-500 py-3 px-5 rounded-full flex-row items-center shadow-lg"
        style={{ elevation: 8 }}
        accessibilityRole="button"
        accessibilityLabel="I'm in a scene - get immediate help"
      >
        <Feather name="zap" size={18} color="#fff" />
        <Text className="text-white font-semibold ml-2">I'm in a scene</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

