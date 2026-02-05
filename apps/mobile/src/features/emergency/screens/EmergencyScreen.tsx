/**
 * Emergency Support Screen
 * CRITICAL: This screen must be immediately accessible for users in crisis
 * Design: Calming, clear visual hierarchy, large touch targets (≥48x48dp)
 * Accessibility: WCAG AAA compliant, high contrast, clear labels
 *
 * Animations: Gentle, slow entrances to avoid jarring the user
 */

import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Linking, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { useTheme, Card, Button, BreathingCircle } from '../../../design-system';
import { hapticSelection } from '../../../utils/haptics';
import { useNavigation } from '@react-navigation/native';

interface EmergencyScreenProps {
  userId: string;
}

interface CrisisHotline {
  name: string;
  number: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const CRISIS_HOTLINES: CrisisHotline[] = [
  {
    name: 'National Suicide Prevention Lifeline',
    number: '988',
    description: '24/7 free and confidential support',
    icon: 'phone-alert',
  },
  {
    name: 'SAMHSA National Helpline',
    number: '1-800-662-4357',
    description: 'Substance abuse treatment referral',
    icon: 'hospital-box',
  },
  {
    name: 'Crisis Text Line',
    number: 'Text HOME to 741741',
    description: 'Free 24/7 crisis support via text',
    icon: 'message-text',
  },
];

// Gentle animation timing for crisis context
const GENTLE_DURATION = 600;
const getGentleDelay = (index: number): number => 150 + index * 100;

export function EmergencyScreen({ userId: _userId }: EmergencyScreenProps): React.ReactElement {
  const theme = useTheme();
  const navigation = useNavigation();
  const [_showBreathingExercise, setShowBreathingExercise] = useState(false);

  const handleCall = useCallback((number: string): void => {
    hapticSelection();
    const phoneNumber = number.replace(/[^0-9]/g, '');
    Linking.openURL(`tel:${phoneNumber}`);
  }, []);

  const handleBreathingComplete = useCallback(() => {
    // Optional: track completion for analytics
  }, []);

  const _toggleBreathingExercise = useCallback(() => {
    hapticSelection();
    setShowBreathingExercise((prev) => !prev);
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        accessibilityRole="scrollbar"
        accessibilityLabel="Emergency support resources"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section - Gentle fade in */}
        <Animated.View
          entering={FadeIn.duration(GENTLE_DURATION).delay(100)}
          style={[styles.header, { paddingHorizontal: theme.spacing.lg }]}
        >
          <Animated.View
            entering={FadeIn.duration(GENTLE_DURATION * 1.5).delay(200)}
            style={[styles.iconContainer, { backgroundColor: theme.colors.danger + '20' }]}
          >
            <MaterialCommunityIcons name="phone-alert" size={48} color={theme.colors.danger} />
          </Animated.View>
          <Animated.Text
            entering={FadeInDown.duration(GENTLE_DURATION).delay(300)}
            style={[
              theme.typography.h1,
              { color: theme.colors.text, textAlign: 'center', marginTop: theme.spacing.md },
            ]}
            accessibilityRole="header"
          >
            Emergency Support
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.duration(GENTLE_DURATION).delay(400)}
            style={[
              theme.typography.body,
              {
                color: theme.colors.textSecondary,
                textAlign: 'center',
                marginTop: theme.spacing.xs,
              },
            ]}
          >
            You're not alone. Help is available 24/7.
          </Animated.Text>
        </Animated.View>

        {/* Crisis Hotlines Section */}
        <Animated.View
          entering={FadeInDown.duration(GENTLE_DURATION).delay(500)}
          style={[styles.section, { paddingHorizontal: theme.spacing.md }]}
        >
          <Text
            style={[
              theme.typography.h2,
              { color: theme.colors.text, marginBottom: theme.spacing.md },
            ]}
            accessibilityRole="header"
          >
            Crisis Hotlines
          </Text>

          {CRISIS_HOTLINES.map((hotline, index) => (
            <Animated.View
              key={index}
              entering={FadeInDown.duration(GENTLE_DURATION).delay(getGentleDelay(index + 4))}
              layout={Layout.springify()}
            >
              <Card variant="elevated" style={{ marginBottom: theme.spacing.md }}>
                <View style={styles.hotlineCard}>
                  <View style={styles.hotlineIcon}>
                    <MaterialCommunityIcons
                      name={hotline.icon}
                      size={32}
                      color={theme.colors.danger}
                    />
                  </View>
                  <View style={styles.hotlineContent}>
                    <Text
                      style={[
                        theme.typography.h3,
                        { color: theme.colors.text, marginBottom: theme.spacing.xs },
                      ]}
                    >
                      {hotline.name}
                    </Text>
                    <Text
                      style={[
                        theme.typography.bodySmall,
                        { color: theme.colors.textSecondary, marginBottom: theme.spacing.md },
                      ]}
                    >
                      {hotline.description}
                    </Text>
                    <Button
                      title={hotline.number}
                      onPress={() => handleCall(hotline.number)}
                      variant="danger"
                      size="large"
                      fullWidth
                      icon={<MaterialCommunityIcons name="phone" size={20} color="#FFFFFF" />}
                      accessibilityLabel={`Call ${hotline.name} at ${hotline.number}`}
                      accessibilityHint="Initiates a phone call to crisis support"
                    />
                  </View>
                </View>
              </Card>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Before You Use - Crisis Checkpoint */}
        <Animated.View
          entering={FadeInDown.duration(GENTLE_DURATION).delay(800)}
          style={[styles.section, { paddingHorizontal: theme.spacing.md }]}
        >
          <Card variant="elevated" style={{ marginBottom: theme.spacing.md, backgroundColor: 'rgba(239,68,68,0.05)', borderColor: theme.colors.danger, borderWidth: 2 }}>
            <View style={styles.crisisCheckpointCard}>
              <View style={styles.crisisCheckpointIcon}>
                <MaterialCommunityIcons
                  name="pause-circle"
                  size={48}
                  color={theme.colors.danger}
                />
              </View>
              <View style={styles.crisisCheckpointContent}>
                <Text
                  style={[
                    theme.typography.h2,
                    { color: theme.colors.danger, marginBottom: theme.spacing.xs },
                  ]}
                >
                  Before You Use
                </Text>
                <Text
                  style={[
                    theme.typography.body,
                    { color: theme.colors.text, marginBottom: theme.spacing.md },
                  ]}
                >
                  Feeling a craving? Pause here first. We'll walk through this moment together.
                </Text>
                <Button
                  title="Start Checkpoint"
                  onPress={() => {
                    hapticSelection();
                    navigation.navigate('BeforeYouUse' as never);
                  }}
                  variant="danger"
                  size="large"
                  fullWidth
                  icon={<MaterialCommunityIcons name="pause-circle" size={20} color="#FFFFFF" />}
                  accessibilityLabel="Start crisis checkpoint"
                  accessibilityHint="Opens the Before You Use crisis intervention flow"
                />
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Box Breathing Section with Interactive Animation */}
        <Animated.View
          entering={FadeInDown.duration(GENTLE_DURATION).delay(900)}
          style={[styles.section, { paddingHorizontal: theme.spacing.md }]}
        >
          <Text
            style={[
              theme.typography.h2,
              { color: theme.colors.text, marginBottom: theme.spacing.md },
            ]}
            accessibilityRole="header"
          >
            Calming Exercise
          </Text>

          <Card variant="elevated" style={{ marginBottom: theme.spacing.md }}>
            <View style={styles.breathingSection}>
              <Text
                style={[
                  theme.typography.h3,
                  { color: theme.colors.text, marginBottom: theme.spacing.xs, textAlign: 'center' },
                ]}
              >
                Box Breathing
              </Text>
              <Text
                style={[
                  theme.typography.bodySmall,
                  {
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.lg,
                    textAlign: 'center',
                  },
                ]}
              >
                A simple technique to calm your nervous system
              </Text>

              {/* Interactive Breathing Circle */}
              <View style={styles.breathingContainer}>
                <BreathingCircle
                  size={200}
                  cycles={4}
                  phaseDuration={4000}
                  color={theme.colors.secondary}
                  autoStart={false}
                  onComplete={handleBreathingComplete}
                  testID="emergency-breathing-circle"
                />
              </View>

              <Text
                style={[
                  theme.typography.caption,
                  {
                    color: theme.colors.textSecondary,
                    marginTop: theme.spacing.md,
                    textAlign: 'center',
                    fontStyle: 'italic',
                  },
                ]}
              >
                Tap the circle to start • 4 cycles recommended
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Grounding Techniques Section */}
        <Animated.View
          entering={FadeInDown.duration(GENTLE_DURATION).delay(900)}
          style={[styles.section, { paddingHorizontal: theme.spacing.md }]}
        >
          <Text
            style={[
              theme.typography.h2,
              { color: theme.colors.text, marginBottom: theme.spacing.md },
            ]}
            accessibilityRole="header"
          >
            Grounding Techniques
          </Text>

          {/* 5-4-3-2-1 Grounding */}
          <Animated.View entering={FadeInDown.duration(GENTLE_DURATION).delay(950)}>
            <Card variant="elevated" style={{ marginBottom: theme.spacing.md }}>
              <Text
                style={[
                  theme.typography.h3,
                  { color: theme.colors.text, marginBottom: theme.spacing.sm },
                ]}
              >
                5-4-3-2-1 Grounding
              </Text>
              <Text
                style={[
                  theme.typography.bodySmall,
                  { color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
                ]}
              >
                Use your senses to anchor yourself in the present moment:
              </Text>
              {[
                { count: '5', sense: 'things you can see', color: theme.colors.primary },
                { count: '4', sense: 'things you can touch', color: theme.colors.secondary },
                { count: '3', sense: 'things you can hear', color: theme.colors.success },
                { count: '2', sense: 'things you can smell', color: theme.colors.warning },
                { count: '1', sense: 'thing you can taste', color: theme.colors.danger },
              ].map((step, index) => (
                <Animated.View
                  key={index}
                  entering={FadeIn.duration(400).delay(1000 + index * 80)}
                  style={styles.techniqueStep}
                >
                  <View style={[styles.groundingBadge, { backgroundColor: step.color + '20' }]}>
                    <Text style={[theme.typography.labelLarge, { color: step.color }]}>
                      {step.count}
                    </Text>
                  </View>
                  <Text style={[theme.typography.body, { color: theme.colors.text, flex: 1 }]}>
                    {step.sense}
                  </Text>
                </Animated.View>
              ))}
            </Card>
          </Animated.View>
        </Animated.View>

        {/* Immediate Actions Section */}
        <Animated.View
          entering={FadeInDown.duration(GENTLE_DURATION).delay(1100)}
          style={[styles.section, { paddingHorizontal: theme.spacing.md }]}
        >
          <Text
            style={[
              theme.typography.h2,
              { color: theme.colors.text, marginBottom: theme.spacing.md },
            ]}
            accessibilityRole="header"
          >
            Immediate Actions
          </Text>

          <Card variant="elevated" style={{ marginBottom: theme.spacing.xl }}>
            <Text
              style={[
                theme.typography.bodySmall,
                { color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
              ]}
            >
              When you're feeling overwhelmed:
            </Text>
            {[
              'Remove yourself from triggering situations',
              'Call your sponsor or a trusted friend',
              'Attend a meeting (in-person or virtual)',
              'Journal your feelings',
              'Practice deep breathing',
              'Remember: This feeling is temporary',
            ].map((action, index) => (
              <Animated.View
                key={index}
                entering={FadeIn.duration(400).delay(1200 + index * 60)}
                style={styles.actionItem}
              >
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color={theme.colors.success}
                  style={{ marginRight: theme.spacing.sm }}
                />
                <Text style={[theme.typography.body, { color: theme.colors.text, flex: 1 }]}>
                  {action}
                </Text>
              </Animated.View>
            ))}
          </Card>
        </Animated.View>

        {/* Safety Reminder - Final gentle entrance */}
        <Animated.View
          entering={FadeInUp.duration(GENTLE_DURATION * 1.2).delay(1400)}
          style={[
            styles.reminderCard,
            {
              backgroundColor: theme.colors.success + '15',
              marginHorizontal: theme.spacing.md,
              marginBottom: theme.spacing.xl,
              padding: theme.spacing.lg,
              borderRadius: theme.radius.card,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="head-heart"
            size={32}
            color={theme.colors.success}
            style={{ marginBottom: theme.spacing.sm }}
          />
          <Text
            style={[
              theme.typography.title3,
              { color: theme.colors.success, marginBottom: theme.spacing.xs, textAlign: 'center' },
            ]}
          >
            You are stronger than you know
          </Text>
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.text, textAlign: 'center', lineHeight: 22 },
            ]}
          >
            Every moment you choose recovery is a victory. This crisis will pass, and you have the
            tools to get through it.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginTop: 24,
  },
  hotlineCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  hotlineIcon: {
    marginRight: 16,
    paddingTop: 4,
  },
  hotlineContent: {
    flex: 1,
  },
  crisisCheckpointCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crisisCheckpointIcon: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crisisCheckpointContent: {
    flex: 1,
  },
  breathingSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  breathingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  techniqueStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  groundingBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reminderCard: {
    alignItems: 'center',
  },
});
