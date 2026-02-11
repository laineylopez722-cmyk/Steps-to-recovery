# Steps to Recovery — Design System

## Design Philosophy

**Core principle**: Calm confidence. Not flashy, not boring. Every element earns its place.

**References**: Apple Health, Oura Ring, Calm, Headspace, Arc Browser

---

## Foundation

### Grid System

- **Base unit**: 4px
- **Spacing scale**: 4, 8, 12, 16, 24, 32, 48, 64, 80
- **Content margins**: 20px (mobile)
- **Component gaps**: 12px (tight), 16px (default), 24px (loose)

### Typography Scale

Based on 1.25 ratio (Major Third)

| Name    | Size | Weight | Line Height | Use               |
| ------- | ---- | ------ | ----------- | ----------------- |
| display | 40px | 600    | 48px        | Hero numbers      |
| h1      | 32px | 600    | 40px        | Screen titles     |
| h2      | 24px | 600    | 32px        | Section headers   |
| h3      | 20px | 600    | 28px        | Card titles       |
| body    | 17px | 400    | 26px        | Main content      |
| body-sm | 15px | 400    | 22px        | Secondary content |
| caption | 13px | 500    | 18px        | Labels, metadata  |
| micro   | 11px | 600    | 14px        | Badges, tags      |

**Font**: System default (SF Pro on iOS, Roboto on Android)

### Color Palette

**Background layers** (dark mode):

```
bg-primary:    #000000  — True black base
bg-secondary:  #0C0C0E  — Elevated surfaces
bg-tertiary:   #161618  — Cards, modals
bg-quaternary: #1C1C1E  — Hover states
```

**Text hierarchy**:

```
text-primary:   #FFFFFF           — Headlines, key content
text-secondary: rgba(255,255,255,0.72)  — Body text
text-tertiary:  rgba(255,255,255,0.48)  — Captions, hints
text-quaternary: rgba(255,255,255,0.32) — Disabled, placeholders
```

**Accent colors** (muted, sophisticated):

```
accent-warm:   #E8A855  — Primary actions, progress (warm gold)
accent-calm:   #6B9EBF  — Information, links (muted blue)
accent-growth: #7BA873  — Success, completion (sage green)
accent-alert:  #C97B7B  — Warnings, cravings (dusty rose)
```

**Semantic**:

```
success: #7BA873
warning: #D4A853
error:   #C97B7B
info:    #6B9EBF
```

### Borders & Dividers

```
border-subtle:  rgba(255,255,255,0.06)  — Card edges
border-default: rgba(255,255,255,0.10)  — Input borders
border-strong:  rgba(255,255,255,0.16)  — Focus states
divider:        rgba(255,255,255,0.08)  — Section dividers
```

### Shadows (minimal, subtle)

```
shadow-sm: 0 1px 2px rgba(0,0,0,0.3)    — Slight lift
shadow-md: 0 4px 12px rgba(0,0,0,0.4)   — Cards
shadow-lg: 0 8px 24px rgba(0,0,0,0.5)   — Modals
```

### Border Radius

```
radius-sm:   8px   — Small buttons, tags
radius-md:   12px  — Inputs, small cards
radius-lg:   16px  — Cards, containers
radius-xl:   24px  — Large cards, sheets
radius-full: 9999px — Pills, avatars
```

---

## Components

### Buttons

**Primary** (warm gold):

- Height: 52px
- Padding: 0 24px
- Radius: 12px
- Background: accent-warm
- Text: #000000, 17px, weight 600

**Secondary** (outlined):

- Same dimensions
- Background: transparent
- Border: 1.5px border-default
- Text: text-primary

**Tertiary** (text only):

- No background
- Text: accent-calm

### Inputs

**Text Input**:

- Min height: 52px
- Padding: 16px
- Background: bg-tertiary
- Border: 1px border-subtle (2px accent on focus)
- Radius: 12px
- Text: 17px

**Large Text Area** (journaling):

- No visible border
- Background: transparent
- Just text on bg-secondary
- Placeholder: text-quaternary

### Cards

**Standard Card**:

- Background: bg-tertiary
- Border: 1px border-subtle
- Radius: 16px
- Padding: 16px
- No shadow (flat design)

**Interactive Card** (tappable):

- Same as above
- Active state: bg-quaternary

**Elevated Card** (important):

- Background: bg-tertiary
- Shadow: shadow-md
- Radius: 16px

### Lists

**List Item**:

- Height: 60px (single line) or auto
- Padding: 16px 20px
- Divider: 1px divider, inset 20px from left
- Icon: 24px, text-secondary
- Chevron: 16px, text-quaternary

### Progress Indicators

**Linear Progress**:

- Height: 4px
- Background: bg-quaternary
- Fill: accent-warm
- Radius: 2px

**Circular Progress**:

- Stroke: 6px
- Track: rgba(255,255,255,0.08)
- Fill: accent-warm
- Animated endpoint

### Badges

**Status Badge**:

- Height: 24px
- Padding: 0 10px
- Radius: 12px
- Background: color at 12% opacity
- Text: micro size, matching color

---

## Screen Layouts

### Standard Screen

```
SafeAreaView
├── Header (56px)
│   ├── Back button (44px touch target)
│   ├── Title (centered, h3)
│   └── Action button (optional)
├── ScrollView
│   ├── Content (20px horizontal padding)
│   └── Bottom safe area (80px)
└── Fixed bottom (optional)
    └── Primary action button
```

### Home Screen

```
SafeAreaView
├── Header
│   ├── Date + Greeting
│   └── Profile button
├── Hero Section (centered)
│   ├── Visual element (candle/ring)
│   ├── Day count (display size)
│   └── Label (caption)
├── Section
│   ├── Section header
│   └── Task cards (vertical list)
└── Bottom padding
```

### Journal/Input Screen

```
SafeAreaView
├── Header
│   ├── Close button (X)
│   ├── Title/emoji (centered)
│   └── Done button
├── Content (no scroll bars visible)
│   ├── Large title
│   ├── Date
│   ├── Text area (full width, no borders)
│   └── Additional inputs
└── Keyboard avoiding
```

---

## Motion

### Timing

- **Quick**: 150ms — Micro-interactions
- **Standard**: 250ms — Transitions
- **Slow**: 400ms — Page transitions

### Easing

- **Default**: cubic-bezier(0.4, 0, 0.2, 1)
- **Enter**: cubic-bezier(0, 0, 0.2, 1)
- **Exit**: cubic-bezier(0.4, 0, 1, 1)

### Patterns

- Cards: Fade in + slight Y translate (8px)
- Modals: Fade + scale from 0.95
- Lists: Staggered fade (50ms delay per item)

---

## Iconography

- **Style**: SF Symbols / Feather Icons
- **Sizes**: 16px (inline), 20px (list), 24px (standalone)
- **Stroke**: 1.5px
- **Color**: Inherit from text color

---

## Accessibility

- Minimum touch target: 44×44px
- Color contrast: 4.5:1 minimum
- Focus indicators: 2px accent-warm border
- Reduce motion support

---

## Anti-patterns (What NOT to do)

❌ Random padding values (use the scale)
❌ Multiple border radius values per component
❌ Emojis as primary UI elements
❌ Gradients on everything
❌ Shadow on every element
❌ More than 3 levels of text hierarchy per screen
❌ Animated everything
❌ Colorful for the sake of colorful
