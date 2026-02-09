#!/bin/bash
# =============================================================================
# EAS Secrets Setup Script for Steps to Recovery
# =============================================================================
# This script documents and helps set up EAS secrets for production builds.
#
# Usage:
#   chmod +x scripts/setup-eas-secrets.sh
#   ./scripts/setup-eas-secrets.sh
#
# Or run commands manually as documented below.
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  EAS Secrets Setup for Production${NC}"
echo -e "${BLUE}  Steps to Recovery App${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if eas CLI is installed
if ! command -v eas &> /dev/null; then
    echo -e "${RED}❌ EAS CLI not found!${NC}"
    echo "Install it with: npm install -g eas-cli"
    exit 1
fi

echo -e "${GREEN}✅ EAS CLI found${NC}"
eas --version
echo ""

# Check if user is logged in
echo -e "${YELLOW}🔐 Checking EAS login status...${NC}"
if ! eas whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to EAS!${NC}"
    echo "Run: eas login"
    exit 1
fi

echo -e "${GREEN}✅ Logged in as:$(eas whoami)${NC}"
echo ""

# Get project info
cd apps/mobile
echo -e "${YELLOW}📱 Project: $(eas project:info 2>/dev/null | head -1 || echo 'steps-to-recovery')${NC}"
echo ""

# =============================================================================
# REQUIRED SECRETS
# =============================================================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  REQUIRED SECRETS${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}These secrets are REQUIRED for the app to function:${NC}"
echo ""

# 1. Supabase URL
echo -e "${GREEN}1. EXPO_PUBLIC_SUPABASE_URL${NC}"
echo "   Get from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api"
echo "   Example: https://tbiunmmvfbakwlzykpwq.supabase.co"
echo "   Command:"
echo -e "   ${BLUE}eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value \"your-url\" --scope project${NC}"
echo ""

# 2. Supabase Anon Key
echo -e "${GREEN}2. EXPO_PUBLIC_SUPABASE_ANON_KEY${NC}"
echo "   Get from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api"
echo "   Command:"
echo -e "   ${BLUE}eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value \"your-key\" --scope project${NC}"
echo ""

# =============================================================================
# RECOMMENDED SECRETS
# =============================================================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  RECOMMENDED SECRETS${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}These secrets are recommended for production:${NC}"
echo ""

# 3. Sentry DSN
echo -e "${GREEN}3. EXPO_PUBLIC_SENTRY_DSN (Optional but recommended)${NC}"
echo "   Get from: https://sentry.io/settings/projects/"
echo "   Command:"
echo -e "   ${BLUE}eas secret:create --name EXPO_PUBLIC_SENTRY_DSN --value \"your-dsn\" --scope project${NC}"
echo ""

# =============================================================================
# STORE SUBMISSION SECRETS (Required for automated submission)
# =============================================================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  STORE SUBMISSION SECRETS${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}These are required for 'eas submit' to work:${NC}"
echo ""

# 4. Apple App Store Connect
echo -e "${GREEN}4. ASC_APP_ID (iOS App Store Connect App ID)${NC}"
echo "   Get from: https://appstoreconnect.apple.com/apps"
echo "   Format: Numeric ID (e.g., 1234567890)"
echo "   Set as environment variable:"
echo -e "   ${BLUE}export ASC_APP_ID=your-app-id${NC}"
echo ""

# 5. Google Service Account
echo -e "${GREEN}5. GOOGLE_SERVICE_ACCOUNT_KEY_PATH (Android Play Store)${NC}"
echo "   Create at: https://play.google.com/console"
echo "   Guide: https://github.com/expo/fyi/blob/main/creating-google-service-account.md"
echo "   Set as environment variable:"
echo -e "   ${BLUE}export GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./path/to/service-account.json${NC}"
echo ""

# =============================================================================
# VERIFY SECRETS
# =============================================================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  VERIFY SECRETS${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}To verify all secrets are set correctly:${NC}"
echo -e "   ${BLUE}eas secret:list${NC}"
echo ""

# List current secrets
echo -e "${YELLOW}Current secrets:${NC}"
eas secret:list 2>/dev/null || echo "   (Unable to list secrets - may not have permission)"
echo ""

# =============================================================================
# BUILD COMMANDS
# =============================================================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  BUILD COMMANDS${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}After setting secrets, run:${NC}"
echo ""
echo -e "${GREEN}Development Build:${NC}"
echo -e "   ${BLUE}eas build --profile development --platform android${NC}"
echo -e "   ${BLUE}eas build --profile development --platform ios${NC}"
echo ""

echo -e "${GREEN}Preview Build (Internal Testing):${NC}"
echo -e "   ${BLUE}eas build --profile preview --platform android${NC}"
echo -e "   ${BLUE}eas build --profile preview --platform ios${NC}"
echo ""

echo -e "${GREEN}Production Build:${NC}"
echo -e "   ${BLUE}eas build --profile production --platform android${NC}"
echo -e "   ${BLUE}eas build --profile production --platform ios${NC}"
echo ""

echo -e "${GREEN}Submit to Stores:${NC}"
echo -e "   ${BLUE}eas submit --platform ios --latest${NC}"
echo -e "   ${BLUE}eas submit --platform android --latest${NC}"
echo ""

# =============================================================================
# SECURITY NOTES
# =============================================================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  SECURITY NOTES${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}⚠️  Important Security Considerations:${NC}"
echo ""
echo "   • EAS secrets are encrypted and stored securely by Expo"
echo "   • Secrets are only available during the build process"
echo "   • Never commit secrets to git (they are in .gitignore)"
echo "   • Rotate secrets regularly (especially API keys)"
echo "   • Use separate Supabase projects for dev/staging/production"
echo "   • The Supabase anon key is safe to expose (RLS protects data)"
echo "   • Encryption master keys are NEVER stored in EAS secrets"
echo ""

# =============================================================================
# TROUBLESHOOTING
# =============================================================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  TROUBLESHOOTING${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}If secrets are not working:${NC}"
echo ""
echo "   1. Verify secret name matches exactly (case-sensitive)"
echo "   2. Check scope: use --scope project for project-wide secrets"
echo "   3. Rebuild after setting secrets (secrets are baked at build time)"
echo "   4. Check EAS build logs for missing variable warnings"
echo ""

echo -e "${YELLOW}To update a secret:${NC}"
echo -e "   ${BLUE}eas secret:delete --name SECRET_NAME --scope project${NC}"
echo -e "   ${BLUE}eas secret:create --name SECRET_NAME --value \"new-value\" --scope project${NC}"
echo ""

echo -e "${GREEN}✅ Setup documentation complete!${NC}"
echo ""
