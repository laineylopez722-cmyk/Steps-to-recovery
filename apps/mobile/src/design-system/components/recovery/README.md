# Recovery Components

Specialized UI components for 12-step recovery companion apps, built with React Native, TypeScript, and React Native Reanimated.

## Components

### 1. StreakCounter

Displays clean time with a circular progress indicator and milestone celebrations.

```tsx
import { StreakCounter } from './index';

<StreakCounter
  data={{
    days: 30,
    hours: 12,
    minutes: 45,
    lastResetDate: new Date('2026-01-12'),
    nextMilestone: 60,
  }}
  onPress={() => {}}
  onShowHistory={() => {}}
/>;
```

**Features:**

- 120dp circular display with progress ring
- Milestone celebration animations (pulse + scale)
- Context card with last reset date and next milestone
- Ring animation on milestone hit
- Haptic feedback on interactions

### 2. StreakHistoryGraph

30-day bar chart showing daily check-in activity.

```tsx
import { StreakHistoryGraph } from './index';

<StreakHistoryGraph history={dailyActivityData} onDayPress={(day) => {}} />;
```

**Features:**

- 30 small bars representing daily activity
- Color coding: Both check-ins (green), One (amber), None (gray)
- Trend indicator
- Tap any bar for day summary

### 3. DailyCheckInCard

Two-section layout for morning and evening check-ins.

```tsx
import { DailyCheckInCard } from './index';

<DailyCheckInCard
  date={new Date()}
  checkInData={{
    morning: { completed: true, time: '7:30 AM', intention: '...' },
    evening: { completed: false, cravingIntensity: 3 },
  }}
  onMorningPress={() => {}}
  onEveningPress={() => {}}
/>;
```

**Features:**

- 160dp height with two-section layout
- States: Incomplete → One done → Both done
- CTA badge: "Complete today"
- Celebration animation on completion
- Progress indication

### 4. JournalEntryCard

Displays journal entry summary with mood, tags, and sharing status.

```tsx
import { JournalEntryCard } from './index';

<JournalEntryCard
  entry={{
    id: '1',
    title: 'Grateful for support',
    date: new Date(),
    mood: 'great',
    tags: ['Gratitude', 'Family'],
    hasCraving: true,
    cravingIntensity: 4,
    isSharedWithSponsor: true,
  }}
  onPress={(entry) => {}}
  onSharePress={(entry) => {}}
/>;
```

**Features:**

- 120dp height with split layout
- Large mood emoji display
- Tag chips
- Craving intensity bar
- Swipe right share preview
- Sponsor sharing indicator

### 5. StepProgressTracker

Horizontal progress tracker for the 12-step recovery program.

```tsx
import { StepProgressTracker } from './index';

<StepProgressTracker steps={steps} currentStep={4} onStepPress={(step) => {}} />;
```

**Features:**

- 12 step nodes in horizontal scroll view
- 44dp circular nodes
- States: completed (checkmark), current (outlined), not-started (gray)
- Connection lines between steps
- Header with progress percentage
- Current step indicator

### 6. AchievementBadge

Displays recovery achievements with unlock animations.

```tsx
import { AchievementBadge } from './index';

<AchievementBadge
  achievement={{
    id: '1',
    name: '30 Day Milestone',
    description: 'A full month!',
    icon: 'trophy',
    unlocked: true,
    unlockedDate: new Date(),
    color: '#F4B942',
  }}
  onPress={(achievement) => {}}
  showConfetti={true}
/>;
```

**Features:**

- 96dp square badge with 24dp radius
- Locked state: grayscale 50% opacity
- Unlock animation: Scale bounce + rotate + confetti
- Haptic feedback sequence
- Icon support (award, trophy, star, zap, heart, target, flame)

### 7. CrisisFAB

Emergency Floating Action Button - always accessible for crisis situations.

```tsx
import { CrisisFAB, CompactCrisisButton } from './index';

// Standard FAB (for screen overlay)
<CrisisFAB
  onPress={() => {}}
  extended={true} // or false for compact
/>

// Compact version (for inline use)
<CompactCrisisButton
  onPress={() => {}}
  label="Get Help Now"
/>
```

**Features:**

- 56dp standard or 96dp extended sizes
- Secondary amber color
- Always accessible, never hidden
- Subtle pulse animation on mount
- High z-index for top-level access
- Critical: Accessible in <100ms

## Design Tokens

### Colors

- **Primary**: #6B9B8D (Warm sage green)
- **Secondary**: #D4A574 (Warm amber)
- **Tertiary**: #E8A89A (Soft coral)
- **Success**: #7CB869
- **Warning**: #F4B942
- **Error**: #E07856

### Dimensions

- Streak Counter: 120dp
- Daily Check-In: 160dp height
- Journal Entry: 120dp height
- Step Node: 44dp
- Achievement Badge: 96dp
- Crisis FAB: 56dp / 96dp
- Touch Target Min: 48dp

### Animation Durations

- Standard: 200ms
- Emphasized: 500ms
- Milestone: 1200ms

## Accessibility

All components support:

- **WCAG AAA compliance**
- **Screen reader optimization** with comprehensive labels
- **Reduced motion support** (respects system settings)
- **48x48dp minimum touch targets**
- **High contrast mode support**
- **Dark mode support**

## Usage Example

```tsx
import {
  StreakCounter,
  DailyCheckInCard,
  JournalEntryCard,
  StepProgressTracker,
  AchievementBadge,
  CrisisFAB,
} from './components/recovery';

function HomeScreen() {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView>
        <StreakCounter data={streakData} />
        <DailyCheckInCard date={new Date()} checkInData={checkInData} />
        <StepProgressTracker steps={steps} currentStep={4} />
      </ScrollView>
      <CrisisFAB onPress={openCrisisKit} extended />
    </View>
  );
}
```

## Dependencies

- `react-native-reanimated` - Animations
- `expo-haptics` - Haptic feedback
- `lucide-react-native` - Icons
- `react-native-svg` - SVG support
- `nativewind` - Styling

## Testing

See `__tests__/RecoveryComponents.example.tsx` for comprehensive usage examples.
