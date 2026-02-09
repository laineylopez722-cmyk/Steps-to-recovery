# Performance Audit Report

**Generated:** 09/02/2026, 5:33:03 pm

**App:** Steps to Recovery Mobile

## Executive Summary

- **Files Analyzed:** 358
- **Components:** 185
- **Screens:** 39
- **Hooks:** 57
- **Total Lines:** 79,941
- **Issues Found:** 359 (0 critical, 184 warnings, 175 info)

## Performance Score: 🔴 0/100

## Quick Stats

| Metric | Count | Status |
|--------|-------|--------|
| Star Imports | 32 | 🔴 |
| FlatList Usage | 13 | 🟢 |
| FlashList Usage | 1 | 🟡 |
| useMemo Usage | 35 | 🟢 |
| useCallback Usage | 100 | 🟢 |
| React.memo Usage | 13 | 🟡 |

## 🟡 Warnings (184)

<details>
<summary><strong>LARGE FILE</strong> (101)</summary>

- `apps\mobile\src\adapters\storage\indexeddb.ts:1` - File has 473 lines (threshold: 300)
- `apps\mobile\src\components\achievements\AchievementCard.tsx:1` - File has 332 lines (threshold: 300)
- `apps\mobile\src\components\achievements\KeytagWall.tsx:1` - File has 377 lines (threshold: 300)
- `apps\mobile\src\components\common\EmptyState.tsx:1` - File has 387 lines (threshold: 300)
- `apps\mobile\src\components\common\SponsorWidget.tsx:1` - File has 476 lines (threshold: 300)
- `apps\mobile\src\components\contacts\ContactCard.tsx:1` - File has 308 lines (threshold: 300)
- `apps\mobile\src\components\home\PhoneWidget.tsx:1` - File has 510 lines (threshold: 300)
- `apps\mobile\src\components\home\UpcomingMeetingWidget.tsx:1` - File has 501 lines (threshold: 300)
- `apps\mobile\src\components\journal\ReflectionCard.tsx:1` - File has 316 lines (threshold: 300)
- `apps\mobile\src\components\meetings\MeetingCard.tsx:1` - File has 484 lines (threshold: 300)
- ... and 91 more
</details>

<details>
<summary><strong>NO VIRTUALIZATION</strong> (50)</summary>

- `apps\mobile\src\components\achievements\KeytagWall.tsx:1` - Component uses .map() for rendering lists without FlatList/FlashList
- `apps\mobile\src\components\auth\PinIndicators.tsx:1` - Component uses .map() for rendering lists without FlatList/FlashList
- `apps\mobile\src\components\auth\PinKeypad.tsx:1` - Component uses .map() for rendering lists without FlatList/FlashList
- `apps\mobile\src\components\common\CrisisButton.tsx:1` - Component uses .map() for rendering lists without FlatList/FlashList
- `apps\mobile\src\components\common\LoadingState.tsx:1` - Component uses .map() for rendering lists without FlatList/FlashList
- `apps\mobile\src\components\home\PhoneWidget.tsx:1` - Component uses .map() for rendering lists without FlatList/FlashList
- `apps\mobile\src\components\home\UpcomingMeetingWidget.tsx:1` - Component uses .map() for rendering lists without FlatList/FlashList
- `apps\mobile\src\components\progress\SimpleTrendChart.tsx:1` - Component uses .map() for rendering lists without FlatList/FlashList
- `apps\mobile\src\components\step-work\InventoryEntryCard.tsx:1` - Component uses .map() for rendering lists without FlatList/FlashList
- `apps\mobile\src\components\step-work\ReviewCard.tsx:1` - Component uses .map() for rendering lists without FlatList/FlashList
- ... and 40 more
</details>

<details>
<summary><strong>STAR IMPORT</strong> (32)</summary>

- `apps\mobile\src\components\ui\accordion.tsx:4` - Star import from "@rn-primitives/accordion"
- `apps\mobile\src\components\ui\alert-dialog.tsx:5` - Star import from "@rn-primitives/alert-dialog"
- `apps\mobile\src\components\ui\avatar.tsx:2` - Star import from "@rn-primitives/avatar"
- `apps\mobile\src\components\ui\badge.tsx:3` - Star import from "@rn-primitives/slot"
- `apps\mobile\src\components\ui\checkbox.tsx:3` - Star import from "@rn-primitives/checkbox"
- `apps\mobile\src\components\ui\dialog.tsx:4` - Star import from "@rn-primitives/dialog"
- `apps\mobile\src\components\ui\label.tsx:2` - Star import from "@rn-primitives/label"
- `apps\mobile\src\components\ui\progress.tsx:2` - Star import from "@rn-primitives/progress"
- `apps\mobile\src\components\ui\separator.tsx:2` - Star import from "@rn-primitives/separator"
- `apps\mobile\src\components\ui\switch.tsx:2` - Star import from "@rn-primitives/switch"
- ... and 22 more
</details>

<details>
<summary><strong>HEAVY COMPUTATION</strong> (1)</summary>

- `apps\mobile\src\features\ai-companion\components\AmendsTracker.tsx:75` - Computation in render
</details>

## 💡 Optimization Recommendations

### 1. Implement Code Splitting for Heavy Screens

Screens like MeetingFinderScreen.tsx, ChatScreen.tsx, JournalListScreen.tsx, ProgressDashboardScreen.tsx are loaded upfront but may not be needed immediately. Use React.lazy() for on-demand loading.

- **Impact:** 🔴 HIGH
- **Effort:** 🟡 MEDIUM
- **Files:**
  - `apps\mobile\src\features\MeetingFinderScreen.tsx`
  - `apps\mobile\src\features\ChatScreen.tsx`
  - `apps\mobile\src\features\JournalListScreen.tsx`
  - `apps\mobile\src\features\ProgressDashboardScreen.tsx`

### 2. Migrate to FlashList for All Large Lists

Currently using FlatList 13 times. FlashList provides better performance with recycling.

- **Impact:** 🔴 HIGH
- **Effort:** 🟢 LOW

### 3. Optimize Bundle Size

Several heavy dependencies detected. Consider: 1) Lazy loading Sentry, 2) Importing specific icons instead of full libraries, 3) Using babel-plugin-lodash for tree-shaking.

- **Impact:** 🔴 HIGH
- **Effort:** 🟡 MEDIUM

### 4. Replace Star Imports with Named Imports

32 star imports found. Named imports enable better tree-shaking.

- **Impact:** 🟡 MEDIUM
- **Effort:** 🟢 LOW

### 5. Optimize Image Loading

Ensure all images use expo-image with proper caching, content-fit, and lazy loading for off-screen images.

- **Impact:** 🟡 MEDIUM
- **Effort:** 🟢 LOW

### 6. Add Performance Monitoring

Use the new usePerformanceMonitor hook in key components to track render times and identify bottlenecks.

- **Impact:** 🟢 LOW
- **Effort:** 🟢 LOW

## 📊 Performance Budget

Current targets for the app:

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Bundle Size | < 4MB | Unknown | ⚪ |
| Cold Start | < 2s | Unknown | ⚪ |
| Screen Load | < 300ms | Unknown | ⚪ |
| List Scroll | 60 FPS | Unknown | ⚪ |

## 🚀 Next Steps

1. **Immediate (This Week):**
   - [ ] Run bundle analysis: `node scripts/analyze-bundle.js`
   - [ ] Fix critical issues identified above
   - [ ] Add performance monitoring to 3 most-used screens

2. **Short Term (Next 2 Weeks):**
   - [ ] Migrate FlatList to FlashList where applicable
   - [ ] Replace star imports with named imports
   - [ ] Add code splitting for heavy screens

3. **Long Term (Next Month):**
   - [ ] Implement performance regression testing
   - [ ] Set up CI performance budget checks
   - [ ] Profile app on low-end devices

---

*This report was generated automatically by the performance audit script.*
