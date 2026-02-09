# Bundle Size Analysis Report

Generated: 09/02/2026, 5:33:07 pm

## Summary

- **Total Dependencies**: 102
- **Total Size**: 2.83 MB
- **Heavy Dependencies**: 1
- **Star Imports**: 86 (potential bloat)
- **Dynamic Imports**: 23 (good for code splitting)

## Performance Budget

- **Budget**: 5.00 MB
- **Current**: 2.83 MB (56.7%)
- **Status**: ✅ Within budget

## Top 20 Dependencies by Size

| Package | Size | Category |
|---------|------|----------|
| eslint | 2.83 MB | 🚨 massive |
| @expo/vector-icons | 0 B | 🟢 small |
| @hookform/resolvers | 0 B | 🟢 small |
| @react-native-async-storage/async-storage | 0 B | 🟢 small |
| @react-native-community/datetimepicker | 0 B | 🟢 small |
| @react-native-community/netinfo | 0 B | 🟢 small |
| @react-native-community/slider | 0 B | 🟢 small |
| @react-navigation/bottom-tabs | 0 B | 🟢 small |
| @react-navigation/native | 0 B | 🟢 small |
| @react-navigation/native-stack | 0 B | 🟢 small |
| @recovery/shared | 0 B | 🟢 small |
| @rn-primitives/accordion | 0 B | 🟢 small |
| @rn-primitives/alert-dialog | 0 B | 🟢 small |
| @rn-primitives/avatar | 0 B | 🟢 small |
| @rn-primitives/checkbox | 0 B | 🟢 small |
| @rn-primitives/dialog | 0 B | 🟢 small |
| @rn-primitives/label | 0 B | 🟢 small |
| @rn-primitives/portal | 0 B | 🟢 small |
| @rn-primitives/progress | 0 B | 🟢 small |
| @rn-primitives/separator | 0 B | 🟢 small |

## Optimization Recommendations

### 🔴 1. Star import from heavy dependency "@sentry/react-native" may increase bundle size

- **Location**: `src\lib\sentry.ts:10`
- **Suggestion**: Import specific exports instead: import { specificFunction } from '@sentry/react-native'

### 🟡 2. "@sentry/react-native" (0 B) could be lazy loaded

- **Reason**: Only needed for error tracking
- **Suggestion**: Use React.lazy() or dynamic import: const Module = await import('@sentry/react-native')

### 🟡 3. "expo-print" (0 B) could be lazy loaded

- **Reason**: Only needed when printing
- **Suggestion**: Use React.lazy() or dynamic import: const Module = await import('expo-print')

### 🟡 4. "expo-sharing" (0 B) could be lazy loaded

- **Reason**: Only needed when sharing
- **Suggestion**: Use React.lazy() or dynamic import: const Module = await import('expo-sharing')

### 🟡 5. "react-native-confetti-cannon" (0 B) could be lazy loaded

- **Reason**: Only needed for celebrations
- **Suggestion**: Use React.lazy() or dynamic import: const Module = await import('react-native-confetti-cannon')

### 🟢 6. Icon libraries detected - verify tree-shaking is working

- **Suggestion**: Ensure babel-plugin-lodash or similar is configured for icon libraries

## Star Import Analysis

Star imports (`import * as X`) can increase bundle size by importing unused exports.

| File | Line | Module |
|------|------|--------|
| src\adapters\secureStorage\native.ts | 11 | expo-secure-store |
| src\components\achievements\KeytagWall.tsx | 20 | expo-haptics |
| src\components\capsule\CapsuleCard.tsx | 19 | expo-haptics |
| src\components\common\CrisisButton.tsx | 16 | expo-haptics |
| src\components\common\EmptyState.tsx | 18 | expo-haptics |
| src\components\common\SponsorWidget.tsx | 25 | expo-haptics |
| src\components\contacts\ContactCard.tsx | 21 | expo-haptics |
| src\components\home\DailyReadingCard.tsx | 20 | expo-haptics |
| src\components\home\PhoneWidget.tsx | 23 | expo-haptics |
| src\components\home\StatsRow.tsx | 19 | expo-haptics |
| src\components\home\UpcomingMeetingWidget.tsx | 22 | expo-haptics |
| src\components\journal\ReflectionCard.tsx | 23 | expo-haptics |
| src\components\literature\ChapterCard.tsx | 19 | expo-haptics |
| src\components\meetings\MeetingCard.tsx | 22 | expo-haptics |
| src\components\meetings\SharePrepCard.tsx | 20 | expo-haptics |
| src\components\step-work\AmendsCard.tsx | 19 | expo-haptics |
| src\components\step-work\InventoryEntryCard.tsx | 19 | expo-haptics |
| src\components\step-work\ReviewCard.tsx | 18 | expo-haptics |
| src\components\ui\accordion.tsx | 4 | @rn-primitives/accordion |
| src\components\ui\alert-dialog.tsx | 5 | @rn-primitives/alert-dialog |

... and 66 more. Use --verbose to see all.

