# Security Guidelines

## Environment Variables

**CRITICAL:** Never commit `.env` files to git. They contain sensitive credentials including:

- Supabase anon key
- API keys
- Environment-specific configuration

### Setup for New Developers

1. Copy `.env.example` to `.env`:

   ```bash
   cd apps/mobile
   cp .env.example .env
   ```

2. Fill in your own Supabase credentials (get from Supabase dashboard)

3. Verify `.env` is gitignored:
   ```bash
   git check-ignore apps/mobile/.env
   # Should output: .gitignore:36:.env    apps/mobile/.env
   ```

### Key Rotation

If Supabase credentials are ever accidentally exposed:

1. **Immediately rotate the key** in Supabase Dashboard:
   - Go to Project Settings > API
   - Click "Reset anon key"
   - Update your local `.env` file

2. **Check git history:**

   ```bash
   git log --all --full-history -- apps/mobile/.env
   # Should be empty (file should never have been committed)
   ```

3. If the key was committed:
   - Rotate immediately (the exposed key is public forever)
   - Consider using `git filter-branch` to remove from history
   - Force push (if working alone) or notify all team members

## Supabase Anon Key - Is It Safe?

The Supabase `anon` key is **designed to be public** and exposed in client-side code. Security comes from:

1. **Row Level Security (RLS)**: All database tables have RLS policies that prevent unauthorized access
2. **Limited Permissions**: The anon key only allows operations permitted by RLS policies
3. **Client-Side Encryption**: Sensitive data (journal entries, step work) is encrypted before reaching Supabase

However, you should still:

- ✅ Protect the `.env` file from git commits (convenience, not security)
- ✅ Rotate keys if they're exposed in unexpected places (e.g., screenshots, support tickets)
- ❌ **NEVER commit the service_role key** (this bypasses RLS - critical secret!)

## Encryption Keys

Encryption keys for journal entries and step work are:

- Generated locally on the device
- Stored in iOS Keychain / Android Keystore (mobile)
- Stored in encrypted localStorage (web - derived from session token)
- **NEVER** transmitted to Supabase or any backend

## Logout Cleanup

When users sign out, the app automatically:

1. Deletes encryption keys from secure storage
2. Clears the local SQLite database
3. Clears web session data

This ensures complete data removal on shared devices.

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** create a public GitHub issue
2. Email [maintainer email] with details
3. Wait for acknowledgment before public disclosure

## Security Audit History

- **2026-01-01**: Initial security audit completed
  - Fixed hardcoded web encryption master key
  - Implemented complete logout cleanup
  - Added defense-in-depth for .env protection
