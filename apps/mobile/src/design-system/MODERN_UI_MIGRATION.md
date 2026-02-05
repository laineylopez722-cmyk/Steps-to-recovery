# Modern UI 2025 Migration Guide

## What's New

A complete visual refresh with **glassmorphism**, **gradient accents**, and **premium micro-interactions**.

### Before vs After

| Aspect | Before | After (2025) |
|--------|--------|--------------|
| Cards | Solid backgrounds | Glassmorphism with blur |
| Buttons | Solid colors | Gradient with haptics |
| Shadows | Standard iOS | Colored glow effects |
| Typography | System default | Refined scale |
| Backgrounds | Flat navy | Gradient depth |
| Animations | Basic | Spring physics |

## New Components

### 1. GlassCard

Glassmorphism cards with blur backgrounds and optional glow.

```tsx
import { GlassCard } from '../design-system/components/GlassCard';

// Basic usage
<GlassCard>
  <Text>Content</Text>
</GlassCard>

// Heavy blur with glow
<GlassCard intensity="heavy" glow glowColor="#6366F1">
  <Text>Premium content</Text>
</GlassCard>

// Pressable with animation
<GlassCard pressable onPress={handlePress}>
  <Text>Tap me</Text>
</GlassCard>
```

**Props:**
- `intensity`: 'light' | 'medium' | 'heavy'
- `glow`: boolean - Adds colored shadow
- `glowColor`: string - Custom glow color
- `pressable`: boolean - Enables press animation
- `borderGradient`: boolean - Top gradient border

### 2. GradientButton

Premium gradient buttons with haptic feedback.

```tsx
import { GradientButton } from '../design-system/components/GradientButton';

// Primary action
<GradientButton
  title="Sign In"
  variant="primary"
  size="lg"
  fullWidth
  onPress={handleSignIn}
/>

// Ghost/outline style
<GradientButton
  title="Cancel"
  variant="ghost"
  size="md"
  onPress={handleCancel}
/>

// With icon
<GradientButton
  title="Continue"
  icon={<MaterialIcons name="arrow-forward" size={20} color="#FFF" />}
  iconPosition="right"
  onPress={handleContinue}
/>
```

**Variants:** `primary` | `secondary` | `success` | `ghost` | `danger`
**Sizes:** `sm` | `md` | `lg`

## Modern Theme Tokens

Import modern tokens for consistent styling:

```tsx
import { 
  darkAccent, 
  gradients, 
  modernShadows, 
  glass,
  radius,
  spacing,
  typography 
} from '../design-system/tokens/modern';
```

### Color Tokens

```tsx
// Primary accents
darkAccent.primary      // #818CF8 (indigo)
darkAccent.success      // #34D399 (emerald)
darkAccent.warning      // #FBBF24 (amber)
darkAccent.error        // #F87171 (rose)

// Surfaces
darkAccent.background   // #020617 (deep navy)
darkAccent.surface      // #0F172A (navy)
darkAccent.surfaceHigh  // #1E293B (elevated)

// Text
darkAccent.text         // #F8FAFC (white)
darkAccent.textMuted    // #CBD5E1 (gray 300)
darkAccent.textSubtle   // #94A3B8 (gray 400)
```

### Gradient Presets

```tsx
gradients.primary    // Indigo to purple
gradients.success    // Emerald gradient
gradients.aurora     // Blue to pink
gradients.sunset     // Orange to pink
gradients.ocean      // Cyan to indigo
```

### Modern Shadows

```tsx
modernShadows.sm     // Subtle colored shadow
modernShadows.md     // Medium elevation
modernShadows.lg     // Large elevation
modernShadows.glow   // Glow effect
```

## Screen Upgrades

### HomeScreen Modern

Location: `features/home/screens/HomeScreenModern.tsx`

Features:
- Glassmorphism sobriety counter with glow
- Animated time breakdown
- Quick action grid with tiles
- Modern check-in cards
- Floating gradient emergency button

**To use:** Replace `HomeScreen` import with `HomeScreenModern`

### LoginScreen Modern

Location: `features/auth/screens/LoginScreenModern.tsx`

Features:
- Gradient brand logo
- Glass form card
- Modern input styling with icons
- Show/hide password toggle
- Animated error messages

**To use:** Replace `LoginScreen` import with `LoginScreenModern`

## Migration Steps

### Step 1: Update Screen Imports

```tsx
// Before
import { HomeScreen } from './features/home/screens/HomeScreen';

// After
import { HomeScreenModern } from './features/home/screens/HomeScreenModern';
```

### Step 2: Replace Card Components

```tsx
// Before
<Card variant="elevated" style={styles.card}>
  <Text>Content</Text>
</Card>

// After
<GlassCard intensity="medium">
  <Text>Content</Text>
</GlassCard>
```

### Step 3: Replace Buttons

```tsx
// Before
<Button title="Submit" onPress={handleSubmit} />

// After
<GradientButton 
  title="Submit" 
  variant="primary"
  size="lg"
  fullWidth
  onPress={handleSubmit}
/>
```

### Step 4: Update Colors

```tsx
// Before
theme.colors.primary
theme.colors.surface

// After
darkAccent.primary
darkAccent.surface
```

## Design Principles

### 1. Depth & Layering
- Use multiple glass intensities for depth
- Heavy for primary cards, light for secondary
- Add glow to highlight important elements

### 2. Gradient Accents
- Primary actions use gradient buttons
- Brand elements use `gradients.primary`
- Decorative elements use aurora/ocean gradients

### 3. Spacing & Rhythm
- Use `spacing` token for consistent gaps
- 16px (spacing[2]) as base unit
- 24px (spacing[3]) for section gaps

### 4. Typography Hierarchy
- Hero: 48px for counters
- H1: 34px for screen titles
- H3: 22px for card titles
- Body: 15px for content

## Animation Guidelines

### Entrance Animations
```tsx
import Animated, { FadeInUp } from 'react-native-reanimated';

<Animated.View entering={FadeInUp.duration(600)}>
  <GlassCard>
    {/* Stagger children */}
  </GlassCard>
</Animated.View>
```

### Press Feedback
```tsx
// Built into GlassCard with pressable prop
<GlassCard pressable onPress={handlePress}>
  <Text>Press me</Text>
</GlassCard>

// Built into GradientButton
<GradientButton title="Tap" haptic onPress={handlePress} />
```

## Performance Tips

1. **Blur effects**: Use `intensity="light"` for lists, `heavy` for modals
2. **Gradients**: Prefer expo-linear-gradient over CSS gradients
3. **Animations**: Use `layout` prop for list reordering
4. **Shadows**: Disable on Android if performance drops

## Browser/Device Support

- iOS 14+ (full support)
- Android 10+ (glassmorphism via opacity)
- Web (gradients only, no blur)

## Next Steps

1. Review new screens in development mode
2. Gradually migrate existing screens
3. Update navigation transitions
4. Add custom illustrations/icons
5. Test haptics on physical devices

## Files Modified/Created

```
src/design-system/
├── tokens/modern.ts                    # NEW: Modern tokens
├── components/GlassCard.tsx            # NEW: Glassmorphism card
├── components/GradientButton.tsx       # NEW: Gradient button
├── index.ts                            # MOD: New exports
└── MODERN_UI_MIGRATION.md              # NEW: This guide

src/features/home/screens/
└── HomeScreenModern.tsx                # NEW: Modern home

src/features/auth/screens/
└── LoginScreenModern.tsx               # NEW: Modern login
```
