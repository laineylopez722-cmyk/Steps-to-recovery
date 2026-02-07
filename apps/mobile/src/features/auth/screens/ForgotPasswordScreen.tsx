import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme, Input, Button } from '../../../design-system';
import { validateEmail } from '../../../utils/validation';
import { useKeyboardConfig } from '../../../hooks/useKeyboardOffset';
import type { AuthStackScreenProps } from '../../../navigation/types';

type Props = AuthStackScreenProps<'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const theme = useTheme();
  const keyboardConfig = useKeyboardConfig();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);

  const { resetPassword } = useAuth();

  const handleResetPassword = async () => {
    setFormError(null);

    // Validate email
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      await resetPassword(email.trim().toLowerCase());
      setEmailSent(true);
    } catch (err: unknown) {
      let message = 'Failed to send reset email. Please try again.';

      if (err && typeof err === 'object' && 'message' in err) {
        const errorMessage = String(err.message);
        if (errorMessage.includes('User not found')) {
          message = 'No account found with this email address.';
        } else if (errorMessage.includes('rate limit')) {
          message = 'Too many requests. Please wait a few minutes and try again.';
        } else {
          message = errorMessage;
        }
      }

      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
        edges={['top', 'bottom']}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.successContainer}>
            <Text style={styles.successEmoji}>📧</Text>
            <Text
              style={[
                theme.typography.h2,
                { color: theme.colors.text, textAlign: 'center', marginBottom: theme.spacing.md },
              ]}
            >
              Check Your Email
            </Text>
            <Text
              style={[
                theme.typography.body,
                {
                  color: theme.colors.textSecondary,
                  textAlign: 'center',
                  lineHeight: 24,
                  marginBottom: theme.spacing.xl,
                },
              ]}
            >
              We've sent a password reset link to{'\n'}
              <Text style={{ fontWeight: '600', color: theme.colors.text }}>{email}</Text>
            </Text>
            <Text
              style={[
                theme.typography.bodySmall,
                {
                  color: theme.colors.textSecondary,
                  textAlign: 'center',
                  lineHeight: 20,
                  marginBottom: theme.spacing.xl,
                },
              ]}
            >
              If you don't see the email, check your spam folder. The link will expire in 24 hours.
            </Text>
            <Button
              title="Back to Login"
              onPress={() => navigation.navigate('Login')}
              testID="back-to-login-button"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        behavior={keyboardConfig.behavior}
        style={styles.container}
        keyboardVerticalOffset={keyboardConfig.keyboardVerticalOffset}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.header, { marginBottom: theme.spacing.xl }]}>
            <Text
              style={[
                theme.typography.h1,
                { color: theme.colors.text, marginBottom: theme.spacing.sm },
              ]}
            >
              Reset Password
            </Text>
            <Text
              style={[theme.typography.body, { color: theme.colors.textSecondary, lineHeight: 24 }]}
            >
              Enter your email address and we'll send you a link to reset your password.
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError(undefined);
                if (formError) setFormError(null);
              }}
              placeholder="your.email@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType="done"
              onSubmitEditing={handleResetPassword}
              error={error}
              testID="forgot-password-email-input"
            />

            {formError && (
              <View
                style={[
                  styles.errorContainer,
                  {
                    backgroundColor: theme.colors.dangerLight || '#FFE5E5',
                    borderColor: theme.colors.danger,
                  },
                ]}
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

            <Button
              title="Send Reset Link"
              onPress={handleResetPassword}
              loading={loading}
              testID="forgot-password-submit-button"
            />
          </View>

          <View
            style={[
              styles.footer,
              { marginTop: theme.spacing.xl, paddingVertical: theme.spacing.md },
            ]}
          >
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
              Remember your password?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              accessibilityRole="link"
              accessibilityLabel="Navigate to login"
            >
              <Text
                style={[theme.typography.body, { color: theme.colors.primary, fontWeight: '600' }]}
              >
                Log In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    // Styles inline with theme
  },
  form: {
    gap: 8,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
});
