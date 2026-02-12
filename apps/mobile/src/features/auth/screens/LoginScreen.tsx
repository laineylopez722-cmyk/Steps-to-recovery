import { useState, useRef } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  TouchableOpacity,
  ScrollView,
  type TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme, Input, Button } from '../../../design-system';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import { validateEmail } from '../../../utils/validation';
import { useKeyboardConfig } from '../../../hooks/useKeyboardOffset';
import type { AuthStackScreenProps } from '../../../navigation/types';

type Props = AuthStackScreenProps<'Login'>;

export function LoginScreen({ navigation }: Props) {
  const theme = useTheme();
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
      // Navigation handled by root navigator based on auth state
    } catch (error: unknown) {
      let message = 'Please check your credentials and try again.';

      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = String(error.message);
        // Provide user-friendly error messages
        if (
          errorMessage.includes('Invalid login credentials') ||
          errorMessage.includes('Invalid email or password')
        ) {
          message = 'Invalid email or password. Please check your credentials and try again.';
        } else if (errorMessage.includes('Email not confirmed')) {
          message = 'Please check your email and confirm your account before signing in.';
        } else if (errorMessage.includes('User not found')) {
          message = 'No account found with this email. Please sign up first.';
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
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.semantic.surface.app }]}
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
              Welcome Back
            </Text>
            <Text
              style={[theme.typography.body, { color: theme.colors.textSecondary, lineHeight: 24 }]}
            >
              Your recovery journey continues here
            </Text>
          </View>

          <View style={styles.form}>
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
              <View
                style={[
                  styles.errorContainer,
                  {
                    backgroundColor: theme.colors.dangerLight || ds.semantic.intent.alert.subtle,
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

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotPassword}
              accessibilityRole="link"
              accessibilityLabel="Forgot password"
            >
              <Text style={[theme.typography.bodySmall, { color: theme.colors.primary }]}>
                Forgot your password?
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.footer,
              { marginTop: theme.spacing.xl, paddingVertical: theme.spacing.md },
            ]}
          >
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SignUp')}
              accessibilityRole="link"
              accessibilityLabel="Navigate to sign up"
            >
              <Text
                style={[theme.typography.body, { color: theme.colors.primary, fontWeight: '600' }]}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (_ds: DS) =>
  ({
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
      // Styles now inline with theme
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
    forgotPassword: {
      alignSelf: 'center',
      marginTop: 12,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
  }) as const;
