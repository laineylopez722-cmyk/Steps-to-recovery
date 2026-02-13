import { useState, useRef } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  Pressable,
  type TextInput,
} from 'react-native';
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

type Props = AuthStackScreenProps<'Login'>;

export function LoginScreen({ navigation }: Props) {
  const keyboardConfig = useKeyboardConfig();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);
  const { signIn, signInAnonymously } = useAuth();

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});
    setFormError(null);

    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (error: unknown) {
      let message = 'Please check your credentials and try again.';

      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = String(error.message);
        if (
          errorMessage.includes('Invalid login credentials') ||
          errorMessage.includes('Invalid email or password')
        ) {
          message = 'Invalid email or password.';
        } else if (errorMessage.includes('Email not confirmed')) {
          message = 'Please check your email and confirm your account first.';
        } else if (errorMessage.includes('User not found')) {
          message = "No account found. Try signing up.";
        } else {
          message = errorMessage;
        }
      }

      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    setFormError(null);
    try {
      await signInAnonymously();
    } catch (error: unknown) {
      let message = 'Could not continue as guest. Please try again.';
      if (error && typeof error === 'object' && 'message' in error) {
        message = String(error.message);
      }
      setFormError(message);
    } finally {
      setGuestLoading(false);
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
          {/* Brand header */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
            <View style={styles.logoWrap}>
              <Feather name="shield" size={32} color={ds.semantic.intent.primary.solid} />
            </View>
            <Text style={styles.appName}>Steps to Recovery</Text>
            <Text style={styles.tagline}>Your journey continues here</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInUp.delay(150).duration(350)} style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="your.email@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              error={errors.email}
              testID="login-email-input"
            />

            <Input
              ref={passwordRef}
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="Enter your password"
              secureTextEntry
              autoComplete="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              error={errors.password}
              testID="login-password-input"
              textContentType="password"
            />

            {formError && (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={16} color={ds.semantic.intent.alert.solid} />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            )}

            <View style={styles.buttonGroup}>
              <Button
                title="Log In"
                onPress={handleLogin}
                loading={loading}
                testID="login-submit-button"
              />

              <Button
                title={guestLoading ? 'Setting up...' : 'Continue Without Account'}
                onPress={handleGuestLogin}
                variant="outline"
                loading={guestLoading}
                disabled={loading}
                testID="login-guest-button"
              />
            </View>

            <Pressable
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotPassword}
              accessibilityRole="link"
              accessibilityLabel="Forgot password"
            >
              <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
            </Pressable>
          </Animated.View>

          {/* Footer */}
          <Animated.View
            entering={FadeIn.delay(300).duration(300)}
            style={styles.footer}
          >
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Pressable
              onPress={() => navigation.navigate('SignUp')}
              accessibilityRole="link"
              accessibilityLabel="Navigate to sign up"
            >
              <Text style={styles.footerLink}>Sign Up</Text>
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
      justifyContent: 'center',
    },

    // Header / brand
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
    appName: {
      ...ds.semantic.typography.screenTitle,
      color: ds.semantic.text.primary,
      textAlign: 'center' as const,
    },
    tagline: {
      ...ds.typography.body,
      color: ds.semantic.text.tertiary,
      textAlign: 'center' as const,
      marginTop: ds.space[2],
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
      gap: ds.space[3],
      marginTop: ds.space[2],
    },
    forgotPassword: {
      alignSelf: 'center' as const,
      paddingVertical: ds.space[2],
    },
    forgotPasswordText: {
      ...ds.typography.caption,
      color: ds.semantic.intent.primary.solid,
      fontWeight: '600' as const,
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
  }) as const;
