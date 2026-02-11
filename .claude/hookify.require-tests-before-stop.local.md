---
name: require-tests-before-stop
enabled: true
event: stop
pattern: .*
---

✅ **Before Stopping - Verification Checklist**

Before claiming work is complete, verify these items:

**Required Checks:**
- [ ] `npm test` - All tests passing (no failures)
- [ ] `npx tsc --noEmit` - Type check: 0 errors
- [ ] `npm run lint` - ESLint: 0 warnings
- [ ] Encryption tests: `cd apps/mobile && npm run test:encryption` (if security-related)

**Security Checklist (if code touches sensitive data):**
- [ ] Sensitive data encrypted with `encryptContent()`
- [ ] Keys stored in SecureStore only (never AsyncStorage)
- [ ] No console.log with sensitive data
- [ ] Supabase RLS policies verified
- [ ] Sync operations preserve encryption end-to-end

**UI/Accessibility Checklist (if UI code):**
- [ ] All interactive elements have `accessibilityLabel`
- [ ] `accessibilityRole` present (button, text, etc.)
- [ ] Touch targets ≥48x48dp
- [ ] Color contrast ≥7:1 (WCAG AAA)

**TypeScript Checklist:**
- [ ] No `any` types used
- [ ] All functions have explicit return types
- [ ] No `as unknown` or `!` non-null assertions without reason

**Code Quality:**
- [ ] Related tests run with `npm test -- --findRelatedTests`
- [ ] No dead code or TODOs left behind
- [ ] Follows CLAUDE.md patterns

See CLAUDE.md "Enhanced Development Workflow" for details.
