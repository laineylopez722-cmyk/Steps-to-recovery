# Onboarding & Authentication - Claude Prompt

## Objective

Implement user onboarding flows, including Sign Up/Sign In screens and initial user profile setup with Supabase Auth.

## Target Files

- `apps/mobile/src/features/auth/screens/LoginScreen.tsx`
- `apps/mobile/src/features/auth/screens/SignUpScreen.tsx`
- `apps/mobile/src/features/auth/screens/OnboardingScreen.tsx`
- `apps/mobile/src/features/auth/components/AuthForm.tsx`
- `apps/mobile/src/features/onboarding/OnboardingFlow.tsx` - Onboarding flow
- `apps/mobile/src/features/auth/screens/` - Auth screens (Login, SignUp, ForgotPassword)

## Requirements

### Authentication Screens

1. **Login Screen**
   - Email/password input with validation
   - Password reset link
   - Sign up navigation
   - Loading states and error handling

2. **Sign Up Screen**
   - Email/password with confirmation
   - Form validation (email format, password strength)
   - Terms of service acceptance
   - Privacy policy link

3. **Onboarding Screen**
   - Welcome message explaining app privacy-first approach
   - Collect sobriety start date (critical for streak tracking)
   - Optional: recovery program preference
   - Generate and store encryption key in SecureStore

### Supabase Integration

- Use Supabase Auth SDK for email/password authentication
- Store session in SecureStore for persistence
- Handle auth state changes
- Row-Level Security awareness

### Security

- Never log passwords or sensitive data
- Validate input to prevent injection
- Use SecureStore for all sensitive storage
- Generate unique encryption key per user

## User Experience

- Supportive, non-judgmental copy
- Clear privacy messaging
- Simple, focused forms
- Encouraging feedback on account creation
