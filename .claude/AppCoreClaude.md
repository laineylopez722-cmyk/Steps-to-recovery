# App Core Setup - Claude Prompt

## Objective

Set up the core app structure: Expo project initialization, navigation (React Navigation), theming, and configuration (Supabase client init, context providers).

## Target Files

- `apps/mobile/App.tsx` - Main app entry point
- `apps/mobile/src/navigation/RootNavigator.tsx` - Root navigation setup
- `apps/mobile/src/contexts/AuthContext.tsx` - Authentication context
- `apps/mobile/src/lib/supabase.ts` - Supabase client initialization
- `apps/mobile/src/design-system/tokens/theme.ts` - App theming and design tokens

## Requirements

### Navigation

- Use React Navigation with a tab navigator for main sections:
  - Home (dashboard with streak counter, quick actions)
  - Journal (encrypted personal journaling)
  - Steps (12-step work tracking)
  - Profile (user settings, sponsor connection)
- Implement authentication flow (show auth screens if not logged in)

### Theming

- Calming color palette (soft blues, greens)
- Support for dark mode
- Accessible color contrast (WCAG AAA)
- Consistent typography

### Context Providers

- AuthContext: Manages user authentication state
- DatabaseContext: SQLite database instance
- SyncContext: Manages offline sync status

### Configuration

- Supabase client with environment variables
- Secure token storage using Expo SecureStore
- Error boundary for crash handling

## Privacy & Security Considerations

- All sensitive data encrypted before storage
- Secure token handling
- No logging of sensitive information
