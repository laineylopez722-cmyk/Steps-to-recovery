# Design Guide - Apple-Inspired UI

## Philosophy

**Premium, not pretty.** Every element should feel considered, not decorated.

**Depth through layers.** No visible borders. Use background color differentiation.

**Generous space.** Let content breathe. Cramped = cheap.

**Motion with purpose.** Spring animations, not linear. Subtle, not flashy.

---

## Colors

### Backgrounds (Dark Mode)
```
Primary:    #000000  (true black)
Secondary:  #0A0A0C  (barely visible lift)
Tertiary:   #141416  (cards)
Quaternary: #1C1C1E  (elevated cards)
Elevated:   #2C2C2E  (interactive elements)
```

### Text Hierarchy
```
Primary:    #FFFFFF (100%)
Secondary:  rgba(255,255,255,0.85)
Tertiary:   rgba(255,255,255,0.55)
Quaternary: rgba(255,255,255,0.35)
```

### Accent
```
Amber:      #F5A623  (primary accent)
Amber Muted: rgba(245,166,35,0.15)
```

---

## Typography

### Scale (1.25 ratio)
```
Display:  48px / 700 / -1 tracking
H1:       34px / 700 / -0.5 tracking
H2:       24px / 600 / -0.3 tracking
H3:       20px / 600 / -0.1 tracking
Body:     17px / 400 / 0 tracking
Body SM:  15px / 400 / 0 tracking
Caption:  13px / 500 / 0.1 tracking
Micro:    11px / 600 / 0.2 tracking
```

### Usage
- **H1:** Screen titles, hero text
- **H2:** Section headers
- **Body:** Primary content
- **Caption:** Secondary info, labels (often uppercase with letter-spacing)

---

## Radius

```
XS:   6px   (small buttons, badges)
SM:   10px  (inputs, small cards)
MD:   14px  (list items, icons)
LG:   20px  (primary cards)
XL:   28px  (hero elements, CTAs)
2XL:  36px  (modals, sheets)
Full: 9999px (circular elements)
```

**Rule:** Larger, more important = larger radius.

---

## Spacing (4px grid)

```
1:  4px
2:  8px
3:  12px
4:  16px
5:  20px
6:  24px
8:  32px
10: 40px
12: 48px
16: 64px
20: 80px
```

### Content Padding
- Screen edges: 24px
- Card internal: 20px
- Between sections: 24-32px

---

## Cards

### Do
- Background differentiation (tertiary on primary)
- Generous internal padding (20px)
- Rounded corners (20px for primary cards)
- Subtle shadow on elevated elements

### Don't
- Visible borders
- Small corner radius (<16px for main cards)
- Cramped internal spacing

### Example
```tsx
<View style={{
  backgroundColor: ds.colors.bgTertiary,
  borderRadius: ds.radius.lg, // 20px
  padding: ds.space[5], // 20px
}}>
```

---

## Buttons

### Primary (Amber)
- Height: 56px
- Radius: 28px (half height = pill)
- Background: Amber (#F5A623)
- Text: Black, 600 weight

### Secondary
- Height: 56px
- Radius: 20px
- Background: bgTertiary
- Text: White, 500 weight

### Touch feedback
- Scale to 0.98 on press (spring animation)
- Background shift on press

---

## Lists

### Grouped Lists (iOS Settings style)
- Container: bgTertiary, radius-lg
- Items: Full width, generous padding
- Dividers: hairlineWidth, start from icon edge
- No border on container

### Item Structure
```
[ Icon (44x44) ] [ Content (flex) ] [ Chevron ]
```

---

## Animation

### Springs (prefer over timing)
```
Snappy: { damping: 20, stiffness: 300 }
Smooth: { damping: 15, stiffness: 150 }
Bouncy: { damping: 10, stiffness: 200 }
```

### Common Animations
- Entry: FadeInDown, 400ms
- Press: Scale 0.98 → 1.0
- Exit: FadeOut, 200ms

---

## Icons

### Sizes
```
SM: 18px (inline, secondary)
MD: 22px (buttons, primary)
LG: 28px (feature icons)
XL: 32px (hero icons)
```

### Colors
- Primary actions: textPrimary
- Secondary: textTertiary
- Disabled: textQuaternary

---

## Touch Targets

Minimum: 44x44 (Apple HIG requirement)

Large/Primary: 56x56

---

## Headers

### Screen Headers
- Back button: Circle (44x44), bgTertiary
- Title: Center or left, 17px, 600 weight
- Action buttons: Icon only, 44x44

### Section Headers
- Caption style, uppercase
- Letter-spacing: 1.5
- Color: textTertiary
- Margin bottom: 12px

---

## Empty States

- Center vertically
- Large icon (48px, textQuaternary)
- Title: H2, textSecondary
- Subtitle: Body, textTertiary, max 280px
- CTA button if actionable

---

## Loading States

- Skeleton screens > spinners
- Subtle pulse animation
- Match layout of loaded content

---

## Shadows (use sparingly)

```
SM: offset 0,2 / opacity 0.15 / radius 4
MD: offset 0,4 / opacity 0.2 / radius 12
LG: offset 0,8 / opacity 0.3 / radius 24
```

Only use on elevated elements (modals, FABs, primary CTAs).

---

## Checklist

Before shipping any screen:

- [ ] No visible borders on cards
- [ ] Radius ≥16px on main containers
- [ ] Touch targets ≥44px
- [ ] Text hierarchy clear
- [ ] Spacing generous
- [ ] Animations spring-based
- [ ] Empty state designed
- [ ] Loading state designed
