import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Button, useTheme } from '../../../design-system';
import { generateEncryptionKey, encryptContent } from '../../../utils/encryption';
import { formatDate, calculateDaysSober } from '../../../utils/validation';
import { supabase } from '../../../lib/supabase';

export function OnboardingScreen() {
  const [sobrietyDate, setSobrietyDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { user } = useAuth();
  const { db, isReady } = useDatabase();
  const theme = useTheme();

  const daysSober = useMemo(() => calculateDaysSober(sobrietyDate), [sobrietyDate]);

  const handleComplete = async () => {
    setFormError(null);

    // Validate sobriety date
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    const hundredYearsAgo = new Date();
    hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100);

    if (sobrietyDate > today) {
      setFormError('Sobriety date cannot be in the future');
      return;
    }

    if (sobrietyDate < hundredYearsAgo) {
      setFormError('Please select a more recent sobriety date');
      return;
    }

    if (!user || !db || !isReady) {
      setFormError('Please wait for initialization');
      return;
    }

    setLoading(true);

    try {
      // Generate encryption key for secure local storage
      await generateEncryptionKey();

      // Save profile to Supabase
      const { error: supabaseError } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        sobriety_start_date: formatDate(sobrietyDate),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (supabaseError) throw supabaseError;

      // Save profile locally for offline access (encrypt email for security)
      const encryptedEmail = user.email ? await encryptContent(user.email) : '';
      await db.runAsync(
        `INSERT INTO user_profile (id, encrypted_email, sobriety_start_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          user.id,
          encryptedEmail,
          formatDate(sobrietyDate),
          new Date().toISOString(),
          new Date().toISOString(),
        ],
      );

      // Navigation will be handled by RootNavigator detecting profile exists
    } catch (error: unknown) {
      let message = 'Please try again';

      if (error instanceof Error) {
        // Handle specific Supabase and database errors
        if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
          message = 'Profile already exists. You should be redirected shortly.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          message = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('encrypt') || error.message.includes('key')) {
          message = 'Security setup failed. Please try again.';
        } else {
          message = error.message;
        }
      }

      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header} accessibilityRole="header">
          <Text style={styles.welcomeEmoji} accessibilityLabel="Welcome emoji">
            🌱
          </Text>
          <Text
            style={[styles.title, { color: theme.colors.text }]}
            accessibilityRole="header"
            accessibilityLabel="Welcome to Your Recovery Journey"
          >
            Welcome to Your{'\n'}Recovery Journey
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
            accessibilityLabel="App description"
          >
            This app is your private, secure companion for recovery. All your data is encrypted and
            stays on your device unless you choose to share.
          </Text>
        </View>

        <View style={styles.dateSection}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.text }]}
            accessibilityRole="header"
            accessibilityLabel="Sobriety start date question"
          >
            When did your sobriety begin?
          </Text>
          <Text
            style={[styles.sectionHint, { color: theme.colors.textSecondary }]}
            accessibilityLabel="Why we ask for this date"
          >
            This helps us celebrate your milestones with you
          </Text>

          <Button
            title={formatDisplayDate(sobrietyDate)}
            onPress={() => setShowDatePicker(true)}
            variant="outline"
            testID="date-picker-button"
            accessibilityLabel={`Select sobriety start date, currently set to ${formatDisplayDate(sobrietyDate)}`}
            accessibilityHint="Opens date picker to select when your sobriety journey began"
          />

          {daysSober > 0 && (
            <View
              style={[styles.streakCard, { backgroundColor: theme.colors.primary }]}
              accessibilityRole="text"
              accessibilityLabel={`Congratulations! ${daysSober} ${daysSober === 1 ? 'day' : 'days'} of recovery. ${daysSober < 7 ? "Every day counts. You're doing great!" : daysSober < 30 ? 'Amazing progress! Keep going!' : "Incredible dedication. You're an inspiration!"}`}
            >
              <Text style={styles.streakNumber} accessibilityLabel={`${daysSober} days sober`}>
                {daysSober}
              </Text>
              <Text
                style={styles.streakLabel}
                accessibilityLabel={`${daysSober === 1 ? 'day' : 'days'} of recovery`}
              >
                {daysSober === 1 ? 'day' : 'days'} of recovery
              </Text>
              <Text style={styles.streakMessage} accessibilityLabel="Encouraging message">
                {daysSober < 7
                  ? "Every day counts. You're doing great!"
                  : daysSober < 30
                    ? 'Amazing progress! Keep going!'
                    : "Incredible dedication. You're an inspiration!"}
              </Text>
            </View>
          )}
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={sobrietyDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_event: DateTimePickerEvent, selectedDate?: Date) => {
              if (Platform.OS === 'android') {
                setShowDatePicker(false);
              }
              if (selectedDate) {
                setSobrietyDate(selectedDate);
              }
            }}
            maximumDate={new Date()}
            testID="date-picker"
            accessibilityLabel="Sobriety start date picker"
            accessibilityHint="Select the date when your sobriety journey began"
          />
        )}

        {Platform.OS === 'ios' && showDatePicker && (
          <Button
            title="Done"
            onPress={() => setShowDatePicker(false)}
            variant="secondary"
            size="small"
          />
        )}

        <View
          style={[
            styles.features,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
          accessibilityLabel="App features section"
        >
          <Text
            style={[styles.featuresTitle, { color: theme.colors.text }]}
            accessibilityRole="header"
          >
            What you can do:
          </Text>
          <FeatureItem
            emoji="📓"
            title="Private Journaling"
            description="Write encrypted entries only you can read"
            theme={theme}
          />
          <FeatureItem
            emoji="📋"
            title="Step Work"
            description="Track your progress through the 12 steps"
            theme={theme}
          />
          <FeatureItem
            emoji="🤝"
            title="Sponsor Connection"
            description="Securely share selected entries with your sponsor"
            theme={theme}
          />
          <FeatureItem
            emoji="🔔"
            title="Reminders"
            description="Get gentle nudges to check in and reflect"
            theme={theme}
          />
        </View>

        {formError && (
          <View
            style={[
              styles.errorContainer,
              {
                backgroundColor: theme.colors.dangerLight || '#FFE5E5',
                borderColor: theme.colors.danger,
              },
            ]}
            accessibilityRole="alert"
            accessibilityLabel="Error message"
            accessibilityLiveRegion="assertive"
          >
            <Text
              style={[
                theme.typography.bodySmall,
                { color: theme.colors.danger, textAlign: 'center' },
              ]}
            >
              {formError}
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Button
            title="Complete Setup"
            onPress={handleComplete}
            loading={loading}
            size="large"
            testID="complete-setup-button"
            accessibilityLabel="Complete setup"
            accessibilityHint={
              loading
                ? 'Setting up your account, please wait'
                : 'Complete the onboarding process and start your recovery journey'
            }
            accessibilityState={{ disabled: loading }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface FeatureItemProps {
  emoji: string;
  title: string;
  description: string;
  theme: ReturnType<typeof useTheme>;
}

function FeatureItem({ emoji, title, description, theme }: FeatureItemProps) {
  return (
    <View
      style={styles.featureItem}
      accessibilityRole="text"
      accessibilityLabel={`${title}: ${description}`}
    >
      <Text style={styles.featureEmoji} accessibilityLabel={`${title} icon`}>
        {emoji}
      </Text>
      <View style={styles.featureText}>
        <Text
          style={[styles.featureTitle, { color: theme.colors.text }]}
          accessibilityRole="header"
        >
          {title}
        </Text>
        <Text style={[styles.featureDescription, { color: theme.colors.textSecondary }]}>
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 12,
  },
  dateSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 14,
    marginBottom: 12,
  },
  streakCard: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  streakLabel: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  streakMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 8,
    textAlign: 'center',
  },
  features: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  featureDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 12,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
});
