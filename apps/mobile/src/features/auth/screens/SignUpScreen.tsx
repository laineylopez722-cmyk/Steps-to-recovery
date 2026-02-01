import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  TouchableOpacity,
  ScrollView,
  type TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme, Input, Button } from '../../../design-system';
import { validateEmail, validatePassword } from '../../../utils/validation';
import { useKeyboardConfig } from '../../../hooks/useKeyboardOffset';
import type { AuthStackScreenProps } from '../../../navigation/types';

type Props = AuthStackScreenProps<'SignUp'>;

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function SignUpScreen({ navigation }: Props) {
  const theme = useTheme();
  const keyboardConfig = useKeyboardConfig();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const { signUp } = useAuth();

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { level: 0, label: '', color: theme.colors.muted };

    let score = 0;
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password), // Special characters
    ];

    score = checks.filter(Boolean).length;

    if (score <= 2) return { level: score, label: 'Weak', color: theme.colors.danger };
    if (score <= 3) return { level: score, label: 'Fair', color: theme.colors.warning };
    if (score <= 4) return { level: score, label: 'Good', color: theme.colors.primary };
    return { level: score, label: 'Strong', color: theme.colors.success };
  }, [password, theme.colors]);

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    const passwordValidation = validatePassword(password);
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0];
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword.trim()) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});
    setFormError(null);

    try {
      await signUp(email.trim().toLowerCase(), password);
      // After successful signup, user will be navigated to onboarding
    } catch (error: unknown) {
      let message = 'Please try again';

      if (error instanceof Error) {
        // Handle specific Supabase auth errors
        if (error.message.includes('already registered')) {
          message = 'An account with this email already exists. Try logging in instead.';
        } else if (error.message.includes('Invalid email')) {
          message = 'Please enter a valid email address.';
        } else if (error.message.includes('Password should be at least')) {
          message = 'Password is too weak. Please choose a stronger password.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          message = 'Network error. Please check your connection and try again.';
        } else {
          message = error.message;
        }
      }

      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

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
              Start Your Journey
            </Text>
            <Text
              style={[theme.typography.body, { color: theme.colors.textSecondary, lineHeight: 24 }]}
            >
              A private, secure space for your recovery
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearError('email');
              }}
              placeholder="your.email@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              error={errors.email}
              required
              testID="signup-email-input"
              accessibilityLabel="Email address"
              accessibilityHint="Enter your email address for account creation"
            />

            <Input
              ref={passwordRef}
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearError('password');
              }}
              placeholder="Create a strong password"
              secureTextEntry
              autoComplete="new-password"
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              error={errors.password}
              hint="At least 8 characters with uppercase, lowercase, and number"
              required
              testID="signup-password-input"
              accessibilityLabel="Password"
              accessibilityHint="Create a strong password with at least 8 characters, including uppercase, lowercase, and numbers"
            />

            {password.length > 0 && (
              <View style={styles.passwordStrength}>
                <Text
                  style={[
                    theme.typography.caption,
                    { color: passwordStrength.color, fontWeight: '600' },
                  ]}
                >
                  Password Strength: {passwordStrength.label}
                </Text>
                <View style={styles.strengthBar}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <View
                      key={level}
                      style={[
                        styles.strengthSegment,
                        {
                          backgroundColor:
                            level <= passwordStrength.level
                              ? passwordStrength.color
                              : theme.colors.muted,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
            )}

            <Input
              ref={confirmPasswordRef}
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                clearError('confirmPassword');
              }}
              placeholder="Re-enter your password"
              secureTextEntry
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
              error={errors.confirmPassword}
              required
              testID="signup-confirm-password-input"
              accessibilityLabel="Confirm password"
              accessibilityHint="Re-enter your password to confirm it matches"
            />

            <View
              style={[
                styles.privacyNotice,
                {
                  backgroundColor: theme.colors.surface,
                  padding: theme.spacing.md,
                  borderRadius: theme.radius.md,
                  marginVertical: theme.spacing.sm,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                },
              ]}
              accessibilityRole="text"
              accessibilityLabel="Privacy and security notice"
            >
              <Text style={[styles.privacyIcon, { marginRight: theme.spacing.sm }]}>🔒</Text>
              <Text
                style={[
                  theme.typography.caption,
                  { flex: 1, color: theme.colors.textSecondary, lineHeight: 20 },
                ]}
              >
                Your data is encrypted and never shared without your permission. We're committed to
                your privacy and security.
              </Text>
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

            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={loading}
              testID="signup-submit-button"
              accessibilityLabel="Create account"
              accessibilityHint={
                loading
                  ? 'Creating your account, please wait'
                  : 'Submit the form to create your account'
              }
              accessibilityState={{ disabled: loading }}
            />
          </View>

          <View
            style={[
              styles.footer,
              { marginTop: theme.spacing.xl, paddingVertical: theme.spacing.md },
            ]}
          >
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
              Already have an account?{' '}
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
    padding: 24,
  },
  header: {
    marginTop: 24,
  },
  form: {
    gap: 8,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  privacyIcon: {
    fontSize: 20,
  },
  passwordStrength: {
    marginTop: 8,
    marginBottom: 4,
  },
  strengthBar: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 2,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
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
});
