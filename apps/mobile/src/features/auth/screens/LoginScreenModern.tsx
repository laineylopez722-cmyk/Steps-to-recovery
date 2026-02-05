import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  FadeInUp,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { darkAccent, gradients, radius, spacing, typography } from '../../../design-system/tokens/modern';
import { GlassCard } from '../../../design-system/components/GlassCard';
import { GradientButton } from '../../../design-system/components/GradientButton';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export function LoginScreenModern(): React.ReactElement {
  const navigation = useNavigation();
  const { signIn } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const passwordRef = useRef<TextInput>(null);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }, [email, password, signIn]);

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={[darkAccent.background, '#0a0f1c', darkAccent.surface]}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Decorative elements */}
      <View style={styles.glowOrbTop} pointerEvents="none" />
      <View style={styles.glowOrbBottom} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <AnimatedScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo/Brand */}
            <Animated.View entering={FadeInUp.duration(600)} style={styles.brand}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={gradients.primary}
                  style={styles.logoGradient}
                >
                  <MaterialIcons name="self-improvement" size={40} color="#FFF" accessible={false} />
                </LinearGradient>
              </View>
              <Text style={styles.brandTitle} accessibilityRole="header">Steps to Recovery</Text>
              <Text style={styles.brandSubtitle}>Your journey to healing starts here</Text>
            </Animated.View>

            {/* Form Card */}
            <Animated.View entering={FadeInUp.delay(200).duration(600)}>
              <GlassCard intensity="heavy">
                <Text style={styles.formTitle} accessibilityRole="header">Welcome Back</Text>
                
                {error && (
                  <Animated.View entering={FadeIn} style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={18} color={darkAccent.error} accessible={false} />
                    <Text style={styles.errorText}>{error}</Text>
                  </Animated.View>
                )}

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons
                      name="email"
                      size={20}
                      color={darkAccent.textSubtle}
                      style={styles.inputIcon}
                      accessible={false}
                    />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="you@example.com"
                      placeholderTextColor={darkAccent.textSubtle}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      returnKeyType="next"
                      onSubmitEditing={() => passwordRef.current?.focus()}
                      style={styles.input}
                      accessibilityLabel="Email address"
                      accessibilityHint="Enter your email address"
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons
                      name="lock"
                      size={20}
                      color={darkAccent.textSubtle}
                      style={styles.inputIcon}
                      accessible={false}
                    />
                    <TextInput
                      ref={passwordRef}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••"
                      placeholderTextColor={darkAccent.textSubtle}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                      style={styles.input}
                      accessibilityLabel="Password"
                      accessibilityHint="Enter your password"
                    />
                    <Pressable 
                      onPress={() => setShowPassword(!showPassword)} 
                      style={styles.eyeIcon}
                      accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                      accessibilityRole="button"
                      accessibilityHint="Toggles password visibility"
                    >
                      <MaterialIcons
                        name={showPassword ? 'visibility-off' : 'visibility'}
                        size={20}
                        color={darkAccent.textSubtle}
                        accessible={false}
                      />
                    </Pressable>
                  </View>
                </View>

                {/* Forgot Password */}
                <Pressable
                  onPress={() => navigation.navigate('ForgotPassword' as never)}
                  style={styles.forgotPassword}
                  accessibilityLabel="Forgot password"
                  accessibilityRole="button"
                  accessibilityHint="Opens password recovery screen"
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </Pressable>

                {/* Login Button */}
                <GradientButton
                  title="Sign In"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  onPress={handleLogin}
                  style={styles.loginButton}
                  accessibilityLabel="Sign in"
                  accessibilityHint="Signs you in to your account"
                  accessibilityState={{ disabled: loading }}
                />
              </GlassCard>
            </Animated.View>

            {/* Sign Up Link */}
            <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <Pressable 
                onPress={() => navigation.navigate('SignUp' as never)}
                accessibilityLabel="Create account"
                accessibilityRole="button"
                accessibilityHint="Opens sign up screen"
              >
                <Text style={styles.footerLink}>Create Account</Text>
              </Pressable>
            </Animated.View>
          </AnimatedScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  glowOrbTop: {
    position: 'absolute',
    top: -150,
    right: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: darkAccent.primary,
    opacity: 0.1,
  },
  glowOrbBottom: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: darkAccent.success,
    opacity: 0.08,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing[3],
    gap: spacing[4],
  },
  brand: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: spacing[3],
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    ...typography.h1,
    color: darkAccent.text,
    marginBottom: spacing[1],
  },
  brandSubtitle: {
    ...typography.body,
    color: darkAccent.textMuted,
  },
  formTitle: {
    ...typography.h3,
    color: darkAccent.text,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${darkAccent.error}15`,
    padding: spacing[2],
    borderRadius: radius.md,
    marginBottom: spacing[3],
  },
  errorText: {
    ...typography.bodySmall,
    color: darkAccent.error,
    flex: 1,
  },
  inputContainer: {
    marginBottom: spacing[3],
  },
  inputLabel: {
    ...typography.bodySmall,
    color: darkAccent.textMuted,
    marginBottom: spacing[1],
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkAccent.surfaceHigh,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: darkAccent.border,
    paddingHorizontal: spacing[2],
  },
  inputIcon: {
    marginRight: spacing[1.5],
  },
  input: {
    flex: 1,
    height: 52,
    color: darkAccent.text,
    fontSize: 16,
  },
  eyeIcon: {
    padding: spacing[1],
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing[3],
  },
  forgotPasswordText: {
    ...typography.bodySmall,
    color: darkAccent.primaryLight,
    fontWeight: '600',
  },
  loginButton: {
    marginTop: spacing[1],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    ...typography.body,
    color: darkAccent.textMuted,
  },
  footerLink: {
    ...typography.body,
    color: darkAccent.primary,
    fontWeight: '700',
  },
});
