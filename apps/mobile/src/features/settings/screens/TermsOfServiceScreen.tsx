/**
 * Terms of Service Screen
 *
 * Displays the app's terms of service. Required for App Store / Play Store submission.
 */

import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../../design-system/components/Text';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';

const LAST_UPDATED = 'February 12, 2026';

export function TermsOfServiceScreen(): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.lastUpdated}>Last updated: {LAST_UPDATED}</Text>

          <Section title="Acceptance of Terms" styles={styles}>
            By downloading, installing, or using Steps to Recovery ("the App"), you agree to be
            bound by these Terms of Service. If you do not agree to these terms, please do not
            use the App.
          </Section>

          <Section title="Description of Service" styles={styles}>
            Steps to Recovery is a personal recovery companion tool designed to support
            individuals in 12-step programs. The App provides journaling, step work tracking,
            daily check-ins, meeting finder, and other recovery support features. The App is
            not a substitute for professional medical advice, diagnosis, or treatment.
          </Section>

          <Section title="Medical Disclaimer" styles={styles}>
            THE APP IS NOT A MEDICAL DEVICE AND IS NOT INTENDED TO DIAGNOSE, TREAT, CURE, OR
            PREVENT ANY DISEASE OR CONDITION. The App does not provide medical, psychological,
            or therapeutic advice. If you are experiencing a medical or mental health emergency,
            please call your local emergency services (e.g., 911) or contact the Suicide &
            Crisis Lifeline at 988 immediately.
          </Section>

          <Section title="User Accounts" styles={styles}>
            You are responsible for maintaining the confidentiality of your account credentials.
            You agree to notify us immediately of any unauthorized use of your account. You must
            be at least 13 years of age to create an account and use the App.
          </Section>

          <Section title="User Content" styles={styles}>
            You retain full ownership of all content you create within the App, including journal
            entries, step work answers, and reflections. Your content is encrypted on your device
            and we cannot access it. You are solely responsible for the content you create.
          </Section>

          <Section title="Acceptable Use" styles={styles}>
            You agree not to:{'\n'}
            • Use the App for any unlawful purpose{'\n'}
            • Attempt to reverse-engineer, decompile, or disassemble the App{'\n'}
            • Interfere with or disrupt the App's servers or networks{'\n'}
            • Impersonate any person or entity{'\n'}
            • Use the App to harass, abuse, or harm others
          </Section>

          <Section title="Privacy" styles={styles}>
            Your use of the App is also governed by our Privacy Policy. Please review the Privacy
            Policy to understand how we collect, use, and protect your information.
          </Section>

          <Section title="Intellectual Property" styles={styles}>
            The App and its original content (excluding user content), features, and
            functionality are owned by the Steps to Recovery team and are protected by
            copyright, trademark, and other intellectual property laws.
          </Section>

          <Section title="Limitation of Liability" styles={styles}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE APP IS PROVIDED "AS IS" WITHOUT
            WARRANTIES OF ANY KIND. IN NO EVENT SHALL THE DEVELOPERS BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE
            APP. THE APP SHOULD NOT BE RELIED UPON AS YOUR SOLE RECOVERY TOOL.
          </Section>

          <Section title="Termination" styles={styles}>
            We reserve the right to terminate or suspend your account at any time for violation
            of these terms. You may delete your account at any time from within the App. Upon
            deletion, all your data will be permanently removed from our servers.
          </Section>

          <Section title="Changes to Terms" styles={styles}>
            We may update these Terms of Service from time to time. Continued use of the App
            after changes constitutes acceptance of the new terms. We will notify you of
            material changes within the App.
          </Section>

          <Section title="Contact" styles={styles}>
            For questions about these Terms, contact us at:{'\n'}
            support@stepstorecovery.app
          </Section>

          <View style={{ height: ds.space[20] }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Section({
  title,
  children,
  styles,
}: {
  title: string;
  children: React.ReactNode;
  styles: ReturnType<typeof createStyles>;
}): React.ReactElement {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">{title}</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

const createStyles = (ds: DS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ds.semantic.surface.app,
    },
    safeArea: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    content: {
      padding: ds.space[4],
      paddingBottom: ds.space[10],
    },
    lastUpdated: {
      ...ds.semantic.typography.meta,
      color: ds.semantic.text.muted,
      marginBottom: ds.space[4],
    },
    section: {
      marginBottom: ds.space[5],
    },
    sectionTitle: {
      ...ds.semantic.typography.body,
      fontWeight: '700',
      color: ds.semantic.text.primary,
      marginBottom: ds.space[2],
    },
    body: {
      ...ds.semantic.typography.bodySmall,
      color: ds.semantic.text.secondary,
      lineHeight: 24,
    },
  });
