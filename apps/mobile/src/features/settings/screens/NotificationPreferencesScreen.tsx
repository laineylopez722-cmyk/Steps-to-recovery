import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../../design-system/components/GlassCard';
import { AnimatedToggle } from '../../../design-system/components/MicroInteractions';
import { darkAccent, radius, spacing, typography } from '../../../design-system/tokens/modern';

interface NotificationChannel {
  id: string;
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
}

interface NotificationTime {
  id: string;
  label: string;
  time: string;
  enabled: boolean;
}

export function NotificationPreferencesScreen(): React.ReactElement {
  const [channels, setChannels] = useState<NotificationChannel[]>([
    { id: 'morning', title: 'Morning Intention', description: 'Daily check-in reminder', icon: 'wb-sunny', enabled: true },
    { id: 'evening', title: 'Evening Reflection', description: 'End of day check-in', icon: 'nights-stay', enabled: true },
    { id: 'meetings', title: 'Meeting Reminders', description: 'Upcoming meetings nearby', icon: 'groups', enabled: true },
    { id: 'milestones', title: 'Milestones', description: 'Celebrate achievements', icon: 'emoji-events', enabled: true },
    { id: 'sponsor', title: 'Sponsor Messages', description: 'When sponsor shares with you', icon: 'person', enabled: true },
  ]);

  const [quietHours, setQuietHours] = useState({ enabled: true, start: '22:00', end: '07:00' });

  const toggleChannel = (id: string) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[darkAccent.background, darkAccent.surface]} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Header */}
          <Animated.View entering={FadeInUp}>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>Customize how and when you receive alerts</Text>
          </Animated.View>

          {/* Master Toggle */}
          <Animated.View entering={FadeInUp.delay(100)}>
            <GlassCard intensity="medium" style={styles.masterToggle}>
              <View style={styles.masterToggleContent}>
                <View style={styles.masterToggleIcon}>
                  <MaterialIcons name="notifications" size={28} color={darkAccent.primary} />
                </View>
                <View style={styles.masterToggleText}>
                  <Text style={styles.masterToggleTitle}>Allow Notifications</Text>
                  <Text style={styles.masterToggleDesc}>Turn on to receive all notifications</Text>
                </View>
                <AnimatedToggle
                  value={true}
                  onValueChange={() => {}}
                />
              </View>
            </GlassCard>
          </Animated.View>

          {/* Notification Channels */}
          <Animated.View entering={FadeInUp.delay(200)}>
            <Text style={styles.sectionTitle}>Notification Types</Text>
            <GlassCard intensity="light">
              {channels.map((channel, index) => (
                <View key={channel.id}>
                  <View style={styles.channelRow}>
                    <View style={[styles.channelIcon, { backgroundColor: `${darkAccent.primary}15` }]}>
                      <MaterialIcons name={channel.icon as any} size={20} color={darkAccent.primary} />
                    </View>
                    <View style={styles.channelInfo}>
                      <Text style={styles.channelTitle}>{channel.title}</Text>
                      <Text style={styles.channelDesc}>{channel.description}</Text>
                    </View>
                    <AnimatedToggle
                      value={channel.enabled}
                      onValueChange={() => toggleChannel(channel.id)}
                    />
                  </View>
                  {index < channels.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </GlassCard>
          </Animated.View>

          {/* Quiet Hours */}
          <Animated.View entering={FadeInUp.delay(300)}>
            <Text style={styles.sectionTitle}>Quiet Hours</Text>
            <GlassCard intensity="light">
              <View style={styles.quietHoursHeader}>
                <View style={styles.quietHoursInfo}>
                  <MaterialIcons name="do-not-disturb" size={24} color={darkAccent.warning} />
                  <View style={styles.quietHoursText}>
                    <Text style={styles.quietHoursTitle}>Do Not Disturb</Text>
                    <Text style={styles.quietHoursDesc}>
                      {quietHours.enabled ? `${quietHours.start} - ${quietHours.end}` : 'Off'}
                    </Text>
                  </View>
                </View>
                <AnimatedToggle
                  value={quietHours.enabled}
                  onValueChange={(enabled) => setQuietHours((prev) => ({ ...prev, enabled }))}
                />
              </View>

              {quietHours.enabled && (
                <View style={styles.timeSelectors}>
                  <TimeSelector label="Start" time={quietHours.start} />
                  <View style={styles.timeArrow}>
                    <MaterialIcons name="arrow-forward" size={20} color={darkAccent.textMuted} />
                  </View>
                  <TimeSelector label="End" time={quietHours.end} />
                </View>
              )}
            </GlassCard>
          </Animated.View>

          {/* Notification Preview */}
          <Animated.View entering={FadeInUp.delay(400)}>
            <Text style={styles.sectionTitle}>Preview</Text>
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <View style={styles.previewAppIcon}>
                  <MaterialIcons name="self-improvement" size={16} color="#FFF" />
                </View>
                <Text style={styles.previewAppName}>Steps to Recovery</Text>
                <Text style={styles.previewTime}>Now</Text>
              </View>
              <Text style={styles.previewTitle}>Morning Check-in</Text>
              <Text style={styles.previewBody}>How are you feeling today? Take a moment to check in with yourself.</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function TimeSelector({ label, time }: { label: string; time: string }) {
  return (
    <View style={styles.timeSelector}>
      <Text style={styles.timeLabel}>{label}</Text>
      <View style={styles.timeValue}>
        <Text style={styles.timeText}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing[3],
    gap: spacing[4],
  },
  title: {
    ...typography.h1,
    color: darkAccent.text,
    marginBottom: spacing[1],
  },
  subtitle: {
    ...typography.body,
    color: darkAccent.textMuted,
  },
  masterToggle: {
    padding: spacing[3],
  },
  masterToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  masterToggleIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: `${darkAccent.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterToggleText: {
    flex: 1,
  },
  masterToggleTitle: {
    ...typography.bodyLarge,
    color: darkAccent.text,
    fontWeight: '600',
  },
  masterToggleDesc: {
    ...typography.bodySmall,
    color: darkAccent.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    ...typography.h4,
    color: darkAccent.text,
    marginBottom: spacing[2],
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  channelIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelInfo: {
    flex: 1,
  },
  channelTitle: {
    ...typography.body,
    color: darkAccent.text,
    fontWeight: '500',
  },
  channelDesc: {
    ...typography.caption,
    color: darkAccent.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: darkAccent.border,
  },
  quietHoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  quietHoursInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing[2],
  },
  quietHoursText: {
    flex: 1,
  },
  quietHoursTitle: {
    ...typography.body,
    color: darkAccent.text,
    fontWeight: '500',
  },
  quietHoursDesc: {
    ...typography.caption,
    color: darkAccent.textMuted,
    marginTop: 2,
  },
  timeSelectors: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
    borderTopWidth: 1,
    borderTopColor: darkAccent.border,
    gap: spacing[3],
  },
  timeSelector: {
    alignItems: 'center',
  },
  timeLabel: {
    ...typography.caption,
    color: darkAccent.textMuted,
    marginBottom: spacing[1],
  },
  timeValue: {
    backgroundColor: darkAccent.surfaceHigh,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.md,
  },
  timeText: {
    ...typography.body,
    color: darkAccent.text,
    fontWeight: '600',
  },
  timeArrow: {
    marginTop: spacing[2],
  },
  previewCard: {
    backgroundColor: darkAccent.surface,
    borderRadius: radius.lg,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: darkAccent.border,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  previewAppIcon: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    backgroundColor: darkAccent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[1.5],
  },
  previewAppName: {
    ...typography.caption,
    color: darkAccent.textMuted,
    flex: 1,
  },
  previewTime: {
    ...typography.caption,
    color: darkAccent.textMuted,
  },
  previewTitle: {
    ...typography.body,
    color: darkAccent.text,
    fontWeight: '600',
    marginBottom: spacing[0.5],
  },
  previewBody: {
    ...typography.bodySmall,
    color: darkAccent.textMuted,
  },
});
