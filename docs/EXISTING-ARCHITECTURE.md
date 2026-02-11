# Existing Architecture Analysis

## Project Overview

**Steps to Recovery** is a React Native (Expo) mobile app with a sophisticated, multi-layered design system already in place. This document analyzes the existing architecture to inform design system integration decisions.

---

## Current Directory Structure

```
apps/mobile/src/
├── adapters/                 # Platform abstractions
│   ├── secureStorage/       # Keychain/Keystore integration
│   └── storage/             # SQLite/IndexedDB adapters
├── components/              # Shared UI components
│   ├── ui/                  # shadcn/ui style components (20 files)
│   ├── achievements/
│   ├── auth/
│   ├── common/
│   ├── home/
│   ├── journal/
│   ├── meetings/
│   ├── progress/
│   ├── step-work/
│   └── steps/
├── design-system/           # COMPLETE DESIGN SYSTEM (115+ files)
│   ├── accessibility/       # WCAG AAA compliance utils
│   ├── animations/          # Reanimated presets
│   ├── components/          # 45+ design system components
│   ├── context/             # ThemeContext
│   ├── hooks/               # useTheme, useMotionPress, useAnimation
│   ├── primitives/          # Action primitive (motion-enabled)
│   ├── review/              # UI/UX audit system
│   ├── runtime-theme/       # Remote theming
│   └── tokens/              # Design tokens (colors, spacing, typography, motion)
├── features/                # Feature-based organization
│   ├── ai-companion/
│   ├── auth/
│   ├── crisis/
│   ├── emergency/
│   ├── home/
│   ├── journal/
│   ├── meetings/
│   ├── onboarding/
│   ├── profile/
│   ├── progress/
│   ├── readings/
│   ├── settings/
│   ├── sponsor/
│   └── steps/
├── navigation/              # React Navigation setup
├── contexts/                # Auth, Database, Sync, Notification
├── hooks/                   # Shared custom hooks
├── lib/                     # Third-party (Supabase, Sentry)
├── services/                # Business logic services
├── store/                   # Zustand stores
├── utils/                   # Utilities (encryption, logging)
└── types/                   # TypeScript definitions
```

---

## Existing Dependencies

### Core Framework
| Package | Version | Purpose |
|---------|---------|---------|
| expo | ~54.0.0 | Expo SDK |
| react | 19.1.0 | React |
| react-native | 0.81.5 | React Native |
| typescript | ~5.9.3 | TypeScript (strict mode) |

### Styling & UI
| Package | Version | Purpose |
|---------|---------|---------|
| tailwindcss | ~4.1.18 | Tailwind CSS v4 |
| nativewind | (via preset) | React Native Tailwind |
| uniwind | ^1.3.0 | Universal styling |
| class-variance-authority | ^0.7.1 | Component variants |
| clsx | ^2.1.1 | Conditional classes |
| tailwind-merge | ^3.4.0 | Class conflict resolution |

### Animation
| Package | Version | Purpose |
|---------|---------|---------|
| react-native-reanimated | ~4.1.1 | Primary animation library |
| react-native-gesture-handler | ~2.28.0 | Gesture handling |
| expo-haptics | ~15.0.8 | Haptic feedback |
| react-native-confetti-cannon | ^1.5.2 | Celebration effects |

### UI Primitives (React Native Reusables)
| Package | Purpose |
|---------|---------|
| @rn-primitives/accordion | Accessible accordion |
| @rn-primitives/alert-dialog | Alert dialogs |
| @rn-primitives/avatar | Avatar component |
| @rn-primitives/checkbox | Checkbox input |
| @rn-primitives/dialog | Modal dialogs |
| @rn-primitives/label | Form labels |
| @rn-primitives/progress | Progress bars |
| @rn-primitives/switch | Toggle switches |
| @rn-primitives/tabs | Tab navigation |

### Navigation
| Package | Version |
|---------|---------|
| @react-navigation/native | ^7.1.8 |
| @react-navigation/bottom-tabs | ^7.4.0 |
| @react-navigation/native-stack | ^7.3.16 |

### Icons
| Package | Version |
|---------|---------|
| lucide-react-native | ^0.563.0 |
| @expo/vector-icons | ^15.0.3 |

---

## Current Theming Approach

### 1. Tailwind/NativeWind v4 (Primary)

**File**: `apps/mobile/src/global.css`

- CSS variables for theming (`--color-bg-primary`, `--color-accent-warm`)
- Dark mode by default with `.light` class override
- Custom theme extensions (spacing, radius, typography)
- Legacy shadcn compatibility variables

```css
:root {
  --color-bg-primary: #000000;
  --color-accent-warm: #E8A855;
  /* ... 40+ variables */
}
```

### 2. Design System Tokens (Secondary)

**File**: `apps/mobile/src/design-system/tokens/ds.ts`

- TypeScript-based tokens
- Apple-inspired design language
- OLED-optimized dark theme
- Semantic color system (intent, surface, text)

```typescript
export const ds = {
  space: { 0: 0, 1: 4, 2: 8, /* ... */ },
  colors: { bgPrimary: '#000000', accent: '#F59E0B', /* ... */ },
  semantic: { intent: { primary: { solid, muted, subtle } } },
  // ... comprehensive token system
};
```

### 3. Multiple Theme Variants (Tertiary)

| Theme | Location | Description |
|-------|----------|-------------|
| Serene Olive | `tokens/theme.ts` | Calm wellness aesthetic |
| MD3 Warm | `tokens/colors.ts` | Material Design 3 warm palette |
| Modern | `tokens/modern.ts` | Glassmorphism + gradients |
| Aesthetic | `tokens/aesthetic.ts` | Premium atmospheric |

### 4. Tailwind Config Extension

**File**: `apps/mobile/tailwind.config.js`

- Extended color palette (navy, primary, secondary, success, danger, hope, calm)
- Custom font families (Outfit, PlusJakartaSans, JetBrainsMono)
- Custom opacity values for glass effects
- shadcn/ui compatibility

---

## Existing Design System Components

### Core Components (45+)

| Component | Location | Features |
|-----------|----------|----------|
| Button | `components/Button.tsx` | iOS-style, haptics, press animation |
| Card | `components/Card.tsx` | Multiple variants (elevated, interactive, flat) |
| GlassCard | `components/GlassCard.tsx` | Glassmorphism with blur |
| GradientButton | `components/GradientButton.tsx` | Gradient backgrounds |
| Input | `components/Input.tsx` | Form inputs with validation |
| TextArea | `components/TextArea.tsx` | Multi-line text input |
| Modal | `components/Modal.tsx` | Modal presentations |
| BottomSheet | `components/BottomSheet.tsx` | Sheet presentations |
| Toast | `components/Toast.tsx` | Notifications |
| ProgressBar | `components/ProgressBar.tsx` | Linear progress |
| CircularProgress | `components/CircularProgress.tsx` | Ring progress |
| Skeleton | `components/Skeleton.tsx` | Loading placeholders |
| ConfettiCelebration | `components/ConfettiCelebration.tsx` | Celebration effects |
| PullToRefresh | `components/PullToRefresh.tsx` | Custom refresh control |
| SwipeableListItem | `components/SwipeableListItem.tsx` | Swipe actions |
| ParallaxHeader | `components/ParallaxHeader.tsx` | Scroll effects |

### Recovery-Specific Components

| Component | Purpose |
|-----------|---------|
| SobrietyCounter | Clean time display |
| StreakCounter | Streak visualization |
| DailyCheckInCard | Check-in UI |
| JournalEntryCard | Journal preview |
| StepProgressTracker | 12-step progress |
| AchievementBadge | Achievements |
| CrisisFAB | Emergency button |
| BreathingCircle | Mindfulness UI |

### Themed Variants

- `AmberButton` - Warm accent buttons
- `GoldButton` - Premium gold variant
- `TealCard` / `SageCard` / `LavenderCard` - Color-themed cards

---

## Animation System

### Libraries
- **react-native-reanimated** - Primary animation engine
- **expo-haptics** - Tactile feedback

### Animation Tokens

**File**: `apps/mobile/src/design-system/tokens/motion.ts`

```typescript
export const md3Motion = {
  duration: { instant: 100, quick: 200, standard: 300, slow: 500 },
  easing: { standard: [0.4, 0, 0.2, 1], /* ... */ },
  spring: { snappy: { damping: 20, stiffness: 300 }, /* ... */ },
};
```

### Micro-Interactions

**File**: `apps/mobile/src/design-system/tokens/micro-animations.ts`

- Press animations (scale, opacity)
- Hover animations (web)
- Success animations (checkmarks)
- Loading animations (shimmer)
- Breathing animations (mindfulness)

### Primitives

**File**: `apps/mobile/src/design-system/primitives/Action.tsx`

- Motion-enabled pressable primitive
- Built-in scale animation
- Accessible by default

---

## Navigation Structure

### Tab Navigation (Bottom Tabs)
1. **Home** - Dashboard, clean time, daily check-ins
2. **Journal** - Encrypted journal entries
3. **Steps** - 12-step work tracking
4. **Meetings** - Meeting finder, favorites
5. **Profile** - Settings, sponsor connections

### Stack Navigation (per tab)
- HomeStack: Morning/Evening check-ins, Emergency, Progress, Daily Reading, AI Companion
- JournalStack: Editor, Entry list
- StepsStack: Step detail, Step review
- MeetingsStack: Finder, Detail, Favorites, Stats
- ProfileStack: Sponsor, Settings, Shared entries

---

## Current Screen Implementations

### HomeScreen (`features/home/screens/HomeScreen.tsx`)
- **Design**: Modern premium UI (already upgraded)
- **Features**: 
  - Pull-to-refresh
  - Animated hero with progress ring
  - Intention pills
  - Quick action shortcuts
  - Skeleton loading states
- **Tokens Used**: `ds` token system exclusively

### Other Screens
- Most screens use StyleSheet + design system components
- Mix of Tailwind classes and StyleSheet
- Some legacy components in `components/ui/`

---

## What's Already Implemented

### ✅ Complete and Production-Ready

1. **Design System Infrastructure**
   - Token system with TypeScript types
   - 45+ reusable components
   - Animation presets and hooks
   - Accessibility utilities (WCAG AAA)

2. **Theming**
   - Dark mode (OLED-optimized)
   - Light mode support
   - Multiple theme variants
   - Runtime theme switching capability

3. **Motion System**
   - Micro-interactions
   - Screen transitions
   - Celebration animations
   - Haptic feedback integration

4. **Primitives**
   - Action primitive with motion
   - Accessible base components

5. **Platform Support**
   - iOS (full features)
   - Android (graceful fallbacks)
   - Web (limited but functional)

---

## What's Missing / Needs Attention

### ⚠️ Inconsistencies

1. **Dual Button Implementations**
   - `design-system/components/Button.tsx` - iOS-style, motion-enabled
   - `components/ui/Button.tsx` - shadcn-style, Tailwind-based
   - **Action**: Consolidate or clarify usage

2. **Dual Card Implementations**
   - `design-system/components/Card.tsx` - Motion-enabled
   - `components/ui/Card.tsx` - shadcn-style
   - `design-system/components/GlassCard.tsx` - Glassmorphism
   - **Action**: Standardize on feature-based approach

3. **Mixed Styling Approaches**
   - Some screens use `ds` tokens exclusively
   - Some use Tailwind classes
   - Some use StyleSheet
   - **Action**: Establish primary pattern

### 🔧 Missing Features

1. **Typography System**
   - Text component exists but not fully integrated
   - No comprehensive typography scale usage

2. **Layout Primitives**
   - No Stack, Row, Column primitives
   - Spacing handled ad-hoc

3. **Form System**
   - Input exists but no comprehensive form primitives
   - No validation UI components

---

## Conflicts with New Design System

### Potential Issues

1. **Naming Collisions**
   - `Button` exists in both `design-system` and `components/ui`
   - `Card` similarly duplicated
   - **Mitigation**: Use barrel exports with clear naming

2. **Styling Philosophy Differences**
   - Existing: Token-based with StyleSheet
   - shadcn: Tailwind class-based
   - **Mitigation**: Choose primary approach, wrap others

3. **Animation Approaches**
   - Existing: Reanimated hooks
   - Some components use React Animated API
   - **Mitigation**: Standardize on Reanimated

---

## Recommended Migration Path

### Phase 1: Consolidation (Immediate)

1. **Establish Primary Design System Entry Point**
   ```typescript
   // Use design-system/index.ts as single source
   import { Button, Card, GlassCard } from '@/design-system';
   ```

2. **Deprecate shadcn-style Components**
   - Move `components/ui/` to legacy support
   - Redirect imports to design-system

3. **Standardize on `ds` Token System**
   - Already used in HomeScreen
   - Type-safe, comprehensive
   - Apple-inspired design language

### Phase 2: Component Alignment (Short-term)

1. **Audit Existing Screens**
   - Identify components using `components/ui/`
   - Migrate to `design-system` equivalents

2. **Create Migration Guide**
   - Map shadcn → design-system components
   - Document prop differences

### Phase 3: Enhancement (Medium-term)

1. **Add Missing Primitives**
   - Layout primitives (Stack, Row, Column)
   - Enhanced typography system
   - Form validation components

2. **Expand Animation System**
   - Page transition presets
   - List animation helpers
   - Advanced micro-interactions

---

## Files Requiring Significant Changes

### High Impact
| File | Current State | Recommended Action |
|------|---------------|-------------------|
| `components/ui/Button.tsx` | shadcn-style | Deprecate, redirect to design-system |
| `components/ui/Card.tsx` | shadcn-style | Deprecate, redirect to design-system |
| `features/auth/screens/LoginScreen.tsx` | Legacy styling | Upgrade to design-system |
| `features/auth/screens/SignUpScreen.tsx` | Legacy styling | Upgrade to design-system |

### Medium Impact
| File | Current State | Recommended Action |
|------|---------------|-------------------|
| `features/journal/screens/JournalListScreen.tsx` | Mixed styling | Standardize on design-system |
| `features/meetings/screens/MeetingFinderScreen.tsx` | Mixed styling | Standardize on design-system |
| `features/steps/screens/StepsOverviewScreen.tsx` | Mixed styling | Standardize on design-system |

### Low Impact (Can Extend)
| File | Current State | Recommended Action |
|------|---------------|-------------------|
| `features/home/screens/HomeScreen.tsx` | Already using design-system | Minor refinements |
| `design-system/components/*.tsx` | Well-structured | Add features as needed |

---

## Files That Can Be Extended

### Design System Components (Ready for Enhancement)

1. **Button Variants**
   - Add more size variants
   - Add icon-only variant
   - Add loading states

2. **Card Variants**
   - Expand glassmorphism options
   - Add more elevation levels
   - Add image card variant

3. **Input Components**
   - Add search input
   - Add chip input
   - Add rich text editor

4. **Feedback Components**
   - Add snackbar
   - Add banner
   - Add badge variants

---

## Key Recommendations

### 1. Use `ds` Token System as Primary

The `ds` token system in `design-system/tokens/ds.ts` is:
- Type-safe
- Comprehensive
- Already used in HomeScreen
- Apple-inspired (fits iOS ecosystem)

### 2. Consolidate Component Imports

```typescript
// ✅ Recommended: Single import source
import { Button, Card, GlassCard, useTheme } from '@/design-system';

// ❌ Avoid: Multiple sources
import { Button } from '@/components/ui/Button';
import { Card } from '@/design-system/components/Card';
```

### 3. Leverage Existing Animation System

The existing animation system is robust:
- `useMotionPress` for press effects
- `MotionTransitions` for screen animations
- Micro-animation presets

### 4. Maintain Accessibility Standards

Existing accessibility system:
- WCAG AAA compliant
- Screen reader support
- Proper focus management
- Touch target sizing

---

## Summary

The project has a **mature, production-ready design system** already in place. The main work is:

1. **Consolidation** - Unify the dual component systems
2. **Migration** - Move remaining screens to design-system
3. **Enhancement** - Add missing primitives and features

The existing architecture is solid and well-architected. New design system work should build upon rather than replace the current foundation.

---

## Statistics

| Metric | Count |
|--------|-------|
| Total TypeScript/TSX Files | 207 |
| Design System Components | 45+ |
| Design System Token Files | 15 |
| UI Components (shadcn) | 20 |
| Features | 14 |
| Screens | 30+ |
| Animation Presets | 10+ |
