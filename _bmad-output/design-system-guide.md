# Design System & Accessibility Guide

_Token-driven, theme-aware design system for Steps-to-Recovery. Apple-inspired aesthetic with WCAG AAA compliance._

---

## Design System Architecture

### Provider Setup
```
App.tsx → DsProvider → useColorScheme() → createDs(isDark) → DsContext
```

### Core Hooks

| Hook | Purpose | Usage |
|------|---------|-------|
| `useDs()` | Access full DS object (colors, spacing, typography) | Dynamic values in render |
| `useDsIsDark()` | Boolean dark mode check | Conditional logic |
| `useThemedStyles(factory)` | Theme-aware StyleSheet creation | All component styles |
| `useAnimation` | Animation helpers | Motion patterns |
| `useMotionPress` | Press interaction animations | Button/card feedback |

### Theming Pattern
```typescript
// ✅ CORRECT: Define factory at MODULE level (stable reference)
const createStyles = (ds: DS) => StyleSheet.create({
  container: {
    backgroundColor: ds.semantic.surface.app,
    padding: ds.space[4],         // 16px (4px grid)
    borderRadius: ds.radius.lg,
  },
  title: {
    ...ds.type.titleMd,
    color: ds.semantic.text.primary,
  },
});

// In component:
export function MyComponent(): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.container}>...</View>;
}

// ❌ WRONG: Factory inside component (new ref every render)
export function MyComponent() {
  const styles = useThemedStyles((ds) => StyleSheet.create({...})); // BAD
}
```

---

## Spacing System (4px Grid)

| Token | Value | Common Use |
|-------|-------|-----------|
| `space[1]` | 4px | Tight gaps |
| `space[2]` | 8px | Icon gaps, small padding |
| `space[3]` | 12px | Card inner padding |
| `space[4]` | 16px | Standard padding |
| `space[5]` | 20px | Section gaps |
| `space[6]` | 24px | Card padding |
| `space[8]` | 32px | Section spacing |
| `space[10]` | 40px | Large gaps |
| `space[12]` | 48px | Screen padding |
| `space[16]` | 64px | Hero spacing |
| `space[20]` | 80px | Major sections |

**Rule**: Never hardcode spacing values. Always use `ds.space[n]`.

---

## Typography Scale (1.25x)

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `type.displayLg` | 48px | 700 | Hero numbers |
| `type.displayMd` | 40px | 700 | Page titles |
| `type.displaySm` | 34px | 600 | Section titles |
| `type.titleLg` | 28px | 600 | Card titles |
| `type.titleMd` | 22px | 600 | Subtitles |
| `type.titleSm` | 18px | 500 | List headers |
| `type.bodyLg` | 17px | 400 | Primary body |
| `type.bodyMd` | 15px | 400 | Standard body |
| `type.bodySm` | 13px | 400 | Secondary text |
| `type.caption` | 11px | 400 | Captions, labels |

**Note**: Larger sizes use negative letter-spacing for premium feel.

---

## Color System

### Dark Theme (Default)
- Background: Deep dark (`#0A0A0A` - `#1A1A1A` range)
- Surface: Elevated darks with subtle warmth
- Accent: Sage green primary, warm amber secondary
- Text: High contrast whites/grays

### Light Theme
- Background: Warm cream `#F5F5F0`
- Surface: Pure white `#FFFFFF`
- Card: Soft cream `#F0F0EB`
- Text: Deep sage `#2C3E2C`
- Accent: Dark amber `#D4880A`
- Shadows: Warm-tinted `rgba(60,80,60,*)`

### Semantic Colors (Use These!)
```typescript
ds.semantic.text.primary     // Main text
ds.semantic.text.secondary   // Supporting text
ds.semantic.text.tertiary    // Muted text
ds.semantic.surface.app      // App background
ds.semantic.surface.card     // Card background
ds.semantic.surface.elevated // Elevated surface
ds.semantic.intent.primary.solid   // Primary button bg
ds.semantic.intent.primary.onSolid // Primary button text
ds.semantic.intent.alert.solid     // Error/danger
ds.semantic.intent.success.solid   // Success states
```

**Rule**: Never use hex colors directly. Always use `ds.semantic.*` or `ds.colors.*`.

---

## Accessibility (WCAG AAA)

### Required Props on ALL Interactive Elements

```typescript
// ✅ REQUIRED on every touchable/pressable
<Button
  onPress={handleSave}
  accessibilityLabel="Save journal entry"
  accessibilityRole="button"
  accessibilityState={{ disabled: isLoading }}
  accessibilityHint="Saves your entry and syncs to cloud"
>
  Save
</Button>
```

| Prop | Required | When |
|------|----------|------|
| `accessibilityLabel` | Always | All interactive elements |
| `accessibilityRole` | Always | button, link, header, text, etc. |
| `accessibilityState` | When applicable | disabled, checked, busy, selected |
| `accessibilityHint` | When non-obvious | Complex or ambiguous actions |

### Touch Targets
- **Minimum**: 48×48dp (`MIN_TOUCH_TARGET = 48` in accessibility utils)
- **Recommended**: 52-56dp for comfortable touch (buttons)
- **Layout touch target**: 44dp in design system (`semantic.layout.touchTarget`)
- Support scaling up to 2.0× for reduced-vision users

### Contrast Requirements
| Content | Minimum Ratio |
|---------|--------------|
| Normal text (<18pt) | 7:1 (AAA) |
| Large text (≥18pt or ≥14pt bold) | 4.5:1 (AAA) |
| UI components | 3:1 (AA) |

### Text Scaling
- `MAX_TEXT_SCALE = 2.0` (200%)
- Use `scaleSize(baseSize, textScale)` for dynamic sizing
- No opacity for text readability — use `textQuaternary` token instead

### Accessibility Utilities
```typescript
import { calculateContrastRatio, validateContrast, isTouchTargetValid, formatAnnouncement } from '@/design-system/accessibility';
```

---

## Component Patterns

### Button
- `accessibilityLabel?`, `accessibilityRole?`, `accessibilityHint?`
- Passes a11y props to inner Pressable
- Supports variants via `class-variance-authority`

### ListItem
- Auto-generates `accessibilityLabel` from `label + value` if not provided
- Sets `accessibilityRole="button"` if `onPress` prop exists
- Touch target enforced via minHeight

### Card
- Optional `accessibilityRole`, `accessibilityLabel`, `accessibilityHint`
- Interactive cards get role="button"

### Tab Bar
- `tabBarAccessibilityLabel` on all tabs (mandatory)
- Haptic feedback: `Haptics.selectionAsync()` on tab press
- Labels shown: `tabBarShowLabel: true`

---

## Haptic Feedback

| Action | Haptic Type |
|--------|------------|
| Tab press | `Haptics.selectionAsync()` |
| Button press | `hapticImpact()` |
| Success/milestone | `Haptics.notificationAsync(SUCCESS)` |
| Error | `Haptics.notificationAsync(ERROR)` |

---

## Utility: cn() Helper

```typescript
import { cn } from '@/lib/utils';

// Conditional Tailwind classes (clsx + twMerge)
<View className={cn('flex-1 p-4', isActive && 'bg-primary', className)} />
```

---

## Anti-Patterns

| ❌ NEVER | ✅ INSTEAD |
|----------|-----------|
| `color: '#FFFFFF'` | `color: ds.semantic.text.primary` |
| `margin: 15` | `margin: ds.space[4]` (16px) |
| `fontSize: 16` | `...ds.type.bodyMd` |
| `borderRadius: 8` | `borderRadius: ds.radius.md` |
| StyleSheet in render | `useThemedStyles(createStyles)` at module level |
| ScrollView for long lists | FlatList + React.memo |
| Skip accessibilityLabel | Always add label + role |
| Opacity for text dimming | Use semantic color tokens |
