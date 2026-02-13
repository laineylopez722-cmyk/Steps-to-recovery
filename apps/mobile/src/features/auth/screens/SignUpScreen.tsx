import { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  type TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { Input, Button } from '../../../design-system';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
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
  const keyboardConfig = useKeyboardConfig();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const { signUp } = useAuth();

  const passwordStrength = useMemo(() => {
    if (!password) return { level: 0, label: '', color: ds.semantic.text.muted };

    let score = 0;
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ];

    score = checks.filter(Boolean).length;

    if (score <= 2) return { level: score, label: 'Weak', color: ds.semantic.intent.alert.solid };
    if (score <= 3) return { level: score, label: 'Fair', color: ds.semantic.intent.warning.solid };
    if (score <= 4) return { level: score, label: 'Good', color: ds.semantic.intent.primary.solid };
    return { level: score, label: 'Strong', color: ds.semantic.intent.success.solid };
  }, [password, ds]);

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
    } catch (error: unknown) {
      let message = 'Please try again';

      if (error instanceof Error) {
        if (error.message.includes('already registered')) {
          message = 'An account with this email already exists. Try logging in.';
        } else if (error.message.includes('Invalid email')) {
          message = 'Please enter a valid email address.';
        } else if (error.message.includes('Password should be at least')) {
          message = 'Password is too weak. Please choose a stronger password.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          message = 'Network error. Please check your connection.';
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
              <Feather name="user-plus" size={28} color={ds.semantic.intent.primary.solid} />
            </View>
            <Text style={styles.title} testID="signup-header-title">
              Create Account
            </Text>
            <Text style={styles.subtitle}>
              A private, secure space for your recovery
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(150).duration(350)} style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={(text) => { setEmail(text); clearError('email'); }}
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
            />

            <Input
              ref={passwordRef}
              label="Password"
              value={password}
              onChangeText={(text) => { setPassword(text); clearError('password'); }}
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
            />

            {password.length > 0 && (
              <View style={styles.passwordStrength}>
                <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                  {passwordStrength.label}
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
                              : ds.semantic.surface.overlay,
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
              onChangeText={(text) => { setConfirmPassword(text); clearError('confirmPassword'); }}
              placeholder="Re-enter your password"
              secureTextEntry
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
              error={errors.confirmPassword}
              required
              testID="signup-confirm-password-input"
              accessibilityLabel="Confirm password"
            />

            <View style={styles.privacyNotice} accessibilityRole="text">
              <Feather name="lock" size={16} color={ds.semantic.intent.primary.solid} />
              <Text style={styles.privacyText}>
                Your data is encrypted and never shared. We're committed to your privacy.
              </Text>
            </View>

            {formError && (
              <View style={styles.errorContainer} accessibilityRole="alert" accessibilityLiveRegion="assertive">
                <Feather name="alert-circle" size={16} color={ds.semantic.intent.alert.solid} />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            )}

            <View style={styles.buttonGroup}>
              <Button
                title="Create Account"
                onPress={handleSignUp}
                loading={loading}
                testID="signup-submit-button"
                accessibilityLabel="Create account"
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(300).duration(300)} style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
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
    },

    // Header
    header: {
      alignItems: 'center' as const,
      marginTop: ds.space[10],
      marginBottom: ds.space[8],
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
    },

    // Form
    form: {
      gap: ds.space[3],
    },
    passwordStrength: {
      marginTop: ds.space[1],
    },
    strengthLabel: {
      ...ds.typography.caption,
      fontWeight: '600' as const,
      marginBottom: ds.space[1],
    },
    strengthBar: {
      flexDirection: 'row' as const,
      gap: 2,
    },
    strengthSegment: {
      flex: 1,
      height: 4,
      borderRadius: 2,
    },
    privacyNotice: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: ds.space[3],
      padding: ds.space[3],
      borderRadius: ds.radius.lg,
      backgroundColor: ds.semantic.surface.elevated,
      borderWidth: 1,
      borderColor: ds.semantic.surface.overlay,
    },
    privacyText: {
      ...ds.typography.caption,
      color: ds.semantic.text.secondary,
      flex: 1,
      lineHeight: 20,
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
      marginTop: ds.space[8],
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
  }) as const;
