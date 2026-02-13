import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { Input, Button } from '../../../design-system';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import { validateEmail } from '../../../utils/validation';
import { useKeyboardConfig } from '../../../hooks/useKeyboardOffset';
import type { AuthStackScreenProps } from '../../../navigation/types';

type Props = AuthStackScreenProps<'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const keyboardConfig = useKeyboardConfig();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);

  const { resetPassword } = useAuth();

  const handleResetPassword = async () => {
    setFormError(null);

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
          message = 'No account found with this email.';
        } else if (errorMessage.includes('rate limit')) {
          message = 'Too many requests. Please wait a few minutes.';
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
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.successScroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Feather name="mail" size={32} color={ds.semantic.intent.success.solid} />
            </View>
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successBody}>
              We've sent a password reset link to{'\n'}
              <Text style={styles.successEmail}>{email}</Text>
            </Text>
            <Text style={styles.successHint}>
              If you don't see the email, check your spam folder. The link expires in 24 hours.
            </Text>
            <Button
              title="Back to Login"
              onPress={() => navigation.navigate('Login')}
              testID="back-to-login-button"
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
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
          <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
            <View style={styles.logoWrap}>
              <Feather name="key" size={28} color={ds.semantic.intent.primary.solid} />
            </View>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you a reset link.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(150).duration(350)} style={styles.form}>
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
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={16} color={ds.semantic.intent.alert.solid} />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            )}

            <View style={styles.buttonGroup}>
              <Button
                title="Send Reset Link"
                onPress={handleResetPassword}
                loading={loading}
                testID="forgot-password-submit-button"
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(300).duration(300)} style={styles.footer}>
            <Text style={styles.footerText}>Remember your password? </Text>
            <Pressable
              onPress={() => navigation.navigate('Login')}
              accessibilityRole="link"
              accessibilityLabel="Navigate to login"
            >
              <Text style={styles.footerLink}>Log In</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (ds: DS) =>
  ({
    safeArea: {
      flex: 1,
      backgroundColor: ds.semantic.surface.app,
    },
    container: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: ds.semantic.layout.screenPadding,
      justifyContent: 'center' as const,
    },

    // Header
    header: {
      alignItems: 'center' as const,
      marginBottom: ds.space[10],
    },
    logoWrap: {
      width: 64,
      height: 64,
      borderRadius: ds.radius.xl,
      backgroundColor: ds.semantic.intent.primary.muted,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: ds.space[4],
    },
    title: {
      ...ds.semantic.typography.screenTitle,
      color: ds.semantic.text.primary,
      textAlign: 'center' as const,
    },
    subtitle: {
      ...ds.typography.body,
      color: ds.semantic.text.tertiary,
      textAlign: 'center' as const,
      marginTop: ds.space[2],
      lineHeight: 22,
    },

    // Form
    form: {
      gap: ds.space[3],
    },
    errorContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: ds.space[2],
      padding: ds.space[3],
      borderRadius: ds.radius.lg,
      backgroundColor: ds.semantic.intent.alert.subtle,
      borderWidth: 1,
      borderColor: ds.semantic.intent.alert.muted,
    },
    errorText: {
      ...ds.typography.caption,
      color: ds.semantic.intent.alert.solid,
      flex: 1,
    },
    buttonGroup: {
      marginTop: ds.space[2],
    },

    // Footer
    footer: {
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
      marginTop: ds.space[10],
      paddingVertical: ds.space[4],
    },
    footerText: {
      ...ds.typography.body,
      color: ds.semantic.text.tertiary,
    },
    footerLink: {
      ...ds.typography.body,
      color: ds.semantic.intent.primary.solid,
      fontWeight: '600' as const,
    },

    // Success state
    successScroll: {
      flexGrow: 1,
      justifyContent: 'center' as const,
    },
    successContainer: {
      alignItems: 'center' as const,
      paddingHorizontal: ds.semantic.layout.screenPadding,
    },
    successIcon: {
      width: 72,
      height: 72,
      borderRadius: ds.radius.full,
      backgroundColor: ds.semantic.intent.success.subtle,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: ds.space[6],
    },
    successTitle: {
      ...ds.semantic.typography.screenTitle,
      color: ds.semantic.text.primary,
      textAlign: 'center' as const,
      marginBottom: ds.space[3],
    },
    successBody: {
      ...ds.typography.body,
      color: ds.semantic.text.secondary,
      textAlign: 'center' as const,
      lineHeight: 24,
      marginBottom: ds.space[4],
    },
    successEmail: {
      fontWeight: '600' as const,
      color: ds.semantic.text.primary,
    },
    successHint: {
      ...ds.typography.caption,
      color: ds.semantic.text.tertiary,
      textAlign: 'center' as const,
      lineHeight: 20,
      marginBottom: ds.space[8],
    },
  }) as const;
