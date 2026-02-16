/**
 * Privacy Policy Screen
 *
 * Displays the app's privacy policy. Required for App Store / Play Store submission.
 * Content is rendered locally (no external URL dependency).
 */

import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../../design-system/components/Text';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';

const LAST_UPDATED = 'February 12, 2026';

export function PrivacyPolicyScreen(): React.ReactElement {
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

          <Section title="Overview" styles={styles}>
            Steps to Recovery ("the App") is a privacy-first recovery companion designed for
            individuals in 12-step programs. We are committed to protecting your personal
            information and your right to privacy. This policy explains what information we
            collect, how we use it, and your rights regarding your data.
          </Section>

          <Section title="Data We Collect" styles={styles}>
            <BulletPoint styles={styles}>
              <Bold>Account information</Bold>: Email address and optional display name, used for
              authentication and account recovery.
            </BulletPoint>
            <BulletPoint styles={styles}>
              <Bold>Recovery data</Bold>: Journal entries, step work answers, daily check-ins,
              gratitude lists, and personal inventory. All recovery data is encrypted on your
              device before it leaves your phone.
            </BulletPoint>
            <BulletPoint styles={styles}>
              <Bold>Sobriety date</Bold>: Used locally to calculate your clean time and milestones.
            </BulletPoint>
            <BulletPoint styles={styles}>
              <Bold>App usage data</Bold>: Anonymous crash reports and performance metrics (via
              Sentry) to improve app stability. No personal content is included.
            </BulletPoint>
          </Section>

          <Section title="End-to-End Encryption" styles={styles}>
            Your most sensitive data — journal entries, step work, check-ins, and personal
            reflections — is encrypted using AES-256 encryption on your device before being
            stored or transmitted. Your encryption key is stored exclusively in your device's
            secure hardware (iOS Keychain / Android Keystore). We cannot read your encrypted
            data, even if compelled to do so.
          </Section>

          <Section title="How We Use Your Data" styles={styles}>
            <BulletPoint styles={styles}>
              To provide and maintain the App's core functionality
            </BulletPoint>
            <BulletPoint styles={styles}>
              To sync your encrypted data across your devices (optional)
            </BulletPoint>
            <BulletPoint styles={styles}>
              To send you notifications you've opted into (daily reminders, milestones)
            </BulletPoint>
            <BulletPoint styles={styles}>
              To improve app stability through anonymous crash reports
            </BulletPoint>
          </Section>

          <Section title="Data Storage & Security" styles={styles}>
            Your data is stored locally on your device (SQLite) as the primary source of truth.
            Cloud backup is provided via Supabase with Row-Level Security ensuring you can only
            access your own data. All cloud-stored sensitive content remains encrypted — we store
            only encrypted blobs, never plaintext.
          </Section>

          <Section title="Data Sharing" styles={styles}>
            We do not sell, trade, or share your personal data with third parties. The only
            exception is the optional Sponsor Sharing feature, where you explicitly choose to
            share specific journal entries with your sponsor. Shared entries remain encrypted
            end-to-end.
          </Section>

          <Section title="Your Rights" styles={styles}>
            <BulletPoint styles={styles}>
              <Bold>Export</Bold>: You can export all your data at any time from Settings → Data
              Export.
            </BulletPoint>
            <BulletPoint styles={styles}>
              <Bold>Delete</Bold>: You can delete your account and all associated data at any time
              from Settings → Privacy & Security → Delete Account.
            </BulletPoint>
            <BulletPoint styles={styles}>
              <Bold>Offline access</Bold>: The App works fully offline. You are never required to
              sync with the cloud.
            </BulletPoint>
          </Section>

          <Section title="Children's Privacy" styles={styles}>
            The App is not intended for use by individuals under 13 years of age. We do not
            knowingly collect personal information from children under 13.
          </Section>

          <Section title="Changes to This Policy" styles={styles}>
            We may update this Privacy Policy from time to time. We will notify you of any
            material changes by posting the new policy within the App.
          </Section>

          <Section title="Contact Us" styles={styles}>
            If you have questions about this Privacy Policy, please contact us at:{'\n'}
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

function BulletPoint({
  children,
  styles,
}: {
  children: React.ReactNode;
  styles: ReturnType<typeof createStyles>;
}): React.ReactElement {
  return (
    <View style={styles.bullet}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

function Bold({ children }: { children: React.ReactNode }): React.ReactElement {
  return <Text style={{ fontWeight: '700' }}>{children}</Text>;
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
    bullet: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: ds.space[1],
    },
    bulletDot: {
      ...ds.semantic.typography.bodySmall,
      color: ds.semantic.text.secondary,
      marginRight: ds.space[2],
      lineHeight: 24,
    },
    bulletText: {
      flex: 1,
      ...ds.semantic.typography.bodySmall,
      color: ds.semantic.text.secondary,
      lineHeight: 24,
    },
  });
