# Design System Migration Guide

## Overview

The Steps to Recovery design system has been consolidated and enhanced with a complete Material Design 3 implementation featuring warm, supportive aesthetics.

### What's New

- **Unified Token System**: Single source of truth for colors, typography, spacing, motion
- **Material Design 3 Core Components**: Button, Card, Input, Progress with full accessibility
- **Recovery-Specific Components**: StreakCounter, DailyCheckInCard, JournalEntryCard, StepProgressTracker, AchievementBadge, CrisisFAB
- **Complete Accessibility System**: WCAG AAA compliance, reduced motion support, screen reader optimization
- **Animation Infrastructure**: Reanimated 3 worklets with reduced-motion fallbacks

---

## Quick Start

### Import Components

```typescript
// Core components
import { MD3Button, MD3Card, MD3Input, MD3LinearProgress } from '@/design-system/components';

// Recovery components
import {
  StreakCounter,
  DailyCheckInCard,
  JournalEntryCard,
  StepProgressTracker,
  AchievementBadge,
  CrisisFAB,
} from '@/design-system/components';

// Or from recovery sub-path
import { StreakCounter } from '@/design-system/components/recovery';

// Tokens
import { tokens, useTheme } from '@/design-system/tokens';

// Accessibility
import { useReducedMotion, useA11yAnnouncer } from '@/design-system/accessibility';

// Animations
import { useMotionPress, useConfetti } from '@/design-system/animations';
```

---

## Migration from Legacy Components

### Button Migration

**Before (Legacy):**

```tsx
import { Button } from '@/components/ui/Button';

<Button variant="primary" onPress={handlePress}>
  Save Entry
</Button>;
```

**After (MD3):**

```tsx
import { MD3Button } from '@/design-system/components';

<MD3Button variant="filled" onPress={handlePress} accessibilityLabel="Save journal entry">
  Save Entry
</MD3Button>;
```

### Card Migration

**Before (Legacy):**

```tsx
import { Card } from '@/components/ui/Card';

<Card className="p-4 rounded-lg">
  <Text>Content</Text>
</Card>;
```

**After (MD3):**

```tsx
import { MD3Card, MD3CardContent } from '@/design-system/components';

<MD3Card elevation={2}>
  <MD3CardContent>
    <Text>Content</Text>
  </MD3CardContent>
</MD3Card>;
```

---

## Component Usage Guide

### StreakCounter

```tsx
import { StreakCounter } from '@/design-system/components/recovery';

<StreakCounter
  days={30}
  hours={5}
  minutes={23}
  lastResetDate="2026-01-15"
  nextMilestone={60}
  onPress={() => navigation.navigate('StreakHistory')}
/>;
```

### DailyCheckInCard

```tsx
import { DailyCheckInCard } from '@/design-system/components/recovery';

<DailyCheckInCard
  date={new Date()}
  morningStatus="completed"
  eveningStatus="pending"
  morningIntention="Stay present today"
  eveningReflection=""
  cravingLevel={3}
  onPress={() => openCheckInFlow()}
/>;
```

### JournalEntryCard

```tsx
import { JournalEntryCard } from '@/design-system/components/recovery';

<JournalEntryCard
  id="entry-123"
  title="Grateful for support"
  date={new Date('2026-02-10')}
  mood="grateful"
  tags={['Gratitude', 'Family']}
  cravingLevel={2}
  sharedWithSponsor={true}
  sponsorAvatar="https://..."
  onPress={() => openEntry('entry-123')}
/>;
```

### StepProgressTracker

```tsx
import { StepProgressTracker } from '@/design-system/components/recovery';

<StepProgressTracker
  steps={[
    { number: 1, status: 'completed', title: 'Honesty' },
    { number: 2, status: 'current', title: 'Hope' },
    { number: 3, status: 'not_started', title: 'Faith' },
    // ...
  ]}
  currentStep={2}
  onStepPress={(step) => navigateToStep(step)}
/>;
```

### AchievementBadge

```tsx
import { AchievementBadge } from '@/design-system/components/recovery';

<AchievementBadge
  name="30 Day Milestone"
  description="One month of continuous recovery"
  icon="trophy"
  unlocked={true}
  unlockedDate={new Date('2026-02-10')}
  onUnlockAnimationComplete={() => playSound()}
/>;
```

### CrisisFAB

```tsx
import { CrisisFAB } from '@/design-system/components/recovery';

// In your root layout or screen
<CrisisFAB onPress={() => openEmergencyKit()} extended={true} label="Safety Kit" />;
```

**Critical**: CrisisFAB must be placed at the root level to be accessible from all screens.

---

## Theme Usage

### Using the Theme Hook

```tsx
import { useTheme } from '@/design-system/tokens';

function MyComponent() {
  const { theme, isDark, toggleTheme } = useTheme('light');

  return (
    <View style={{ backgroundColor: theme.surface }}>
      <Text style={{ color: theme.onSurface }}>Hello World</Text>
      <Button onPress={toggleTheme} title="Toggle Theme" />
    </View>
  );
}
```

### Using Tokens Directly

```tsx
import { tokens } from '@/design-system/tokens';

// Colors
const primaryColor = tokens.semantics.primary.main;
const surfaceColor = tokens.semantics.surface.main;

// Motion
const duration = tokens.motion.durations.normal;
const easing = tokens.motion.easings.standard;

// Reduced motion
const isReducedMotion = useReducedMotion();
const motion = isReducedMotion ? tokens.motion.reducedMotion : tokens.motion;
```

---

## Accessibility Best Practices

### Always Include Accessibility Props

```tsx
<MD3Button
  onPress={handleSave}
  accessibilityLabel="Save journal entry"
  accessibilityRole="button"
  accessibilityState={{ disabled: isLoading }}
  accessibilityHint="Double tap to save your journal entry"
>
  Save
</MD3Button>
```

### Use Reduced Motion Hook

```tsx
import { useReducedMotion } from '@/design-system/accessibility';

function AnimatedComponent() {
  const reducedMotion = useReducedMotion();

  return (
    <Animated.View entering={reducedMotion ? FadeIn : BounceIn}>{/* Content */}</Animated.View>
  );
}
```

### Screen Reader Announcements

```tsx
import { useA11yAnnouncer } from '@/design-system/accessibility';

function MyComponent() {
  const { announce } = useA11yAnnouncer();

  const handleSave = async () => {
    await saveEntry();
    announce('Journal entry saved and encrypted', 'success');
  };

  return <Button onPress={handleSave} title="Save" />;
}
```

---

## Animation Guidelines

### Use Built-in Hooks

```tsx
import { useMotionPress, useConfetti } from '@/design-system/animations';

function CelebrationButton() {
  const { animatedStyle, handlers } = useMotionPress();
  const { triggerConfetti } = useConfetti();

  const handlePress = () => {
    triggerConfetti({ count: 20, colors: ['#D4A574', '#E8A89A'] });
  };

  return (
    <Animated.View style={animatedStyle}>
      <MD3Button {...handlers} onPress={handlePress}>
        Celebrate
      </MD3Button>
    </Animated.View>
  );
}
```

### Crisis-First Animation Rules

1. Emergency components must respond in <100ms
2. No decorative animations on CrisisFAB
3. Always respect reduced motion settings
4. Use instant transitions for crisis flows

---

## File Structure

```
apps/mobile/src/design-system/
├── tokens/              # Design tokens
│   ├── primitives.ts    # Raw color values
│   ├── semantics.ts     # MD3 color roles
│   ├── themes.ts        # Light/Dark/HighContrast
│   └── motion.ts        # Animation specs
├── components/
│   ├── core/            # MD3 base components
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Input/
│   │   └── Progress/
│   ├── recovery/        # Recovery-specific
│   │   ├── StreakCounter/
│   │   ├── DailyCheckInCard/
│   │   ├── JournalEntryCard/
│   │   ├── StepProgressTracker/
│   │   ├── AchievementBadge/
│   │   └── CrisisFAB/
│   └── index.ts         # Barrel export
├── accessibility/       # A11y utilities
│   ├── hooks/
│   ├── components/
│   └── constants/
├── animations/          # Animation system
│   ├── hooks/
│   ├── presets/
│   └── components/
└── index.ts             # Main export
```

---

## Verification Checklist

Before deploying with new components:

- [ ] All components use theme tokens (no hardcoded colors)
- [ ] All interactive elements have accessibilityLabel
- [ ] All animations respect reduced motion
- [ ] Touch targets are minimum 48x48dp
- [ ] Contrast ratios meet WCAG AAA (7:1)
- [ ] CrisisFAB is accessible from all screens
- [ ] Screen reader announcements work correctly
- [ ] High contrast mode tested
- [ ] Dark mode tested
- [ ] Large text mode (200%) tested

---

## Troubleshooting

### TypeScript Errors

If you see `Cannot find module '@/design-system/components'`:

- Ensure your `tsconfig.json` includes the path alias
- Run `npx tsc --noEmit` to check for errors

### Animation Not Working

- Check that `react-native-reanimated` is properly configured in `babel.config.js`
- Verify reduced motion isn't enabled

### Theme Not Applied

- Wrap your app with `ThemeProvider`
- Check that you're using the correct theme name

### Accessibility Issues

- Use the Accessibility Inspector in Android Studio
- Test with TalkBack enabled
- Verify all `accessibilityLabel` props are descriptive

---

## Support

For questions or issues with the design system:

1. Check this migration guide
2. Review component documentation in source
3. Consult the enhanced design plan: `docs/ENHANCED-DESIGN-PLAN.md`
4. Review existing architecture: `docs/EXISTING-ARCHITECTURE.md`
