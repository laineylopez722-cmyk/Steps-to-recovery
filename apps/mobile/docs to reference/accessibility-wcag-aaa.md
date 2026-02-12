# Accessibility Standards — Steps to Recovery (WCAG AAA)

> WCAG AAA compliance for a recovery app serving vulnerable users.

## Why AAA (Not AA)

Users of this app may be:
- In emotional distress or crisis
- Under the influence of substances
- Experiencing tremors or motor impairment
- In low-light environments
- Using assistive technology

**Every interaction must be accessible without exception.**

## Required Props on ALL Interactive Elements

```typescript
<Pressable
  onPress={handleAction}
  accessibilityLabel="Save journal entry"    // REQUIRED: What it does
  accessibilityRole="button"                  // REQUIRED: Semantic role
  accessibilityState={{ disabled: isLoading }} // REQUIRED when stateful
  accessibilityHint="Saves and encrypts your entry" // When non-obvious
  style={({ pressed }) => [
    styles.button,
    { minHeight: 48, minWidth: 48 },         // REQUIRED: Touch target
  ]}
/>
```

## Standards

### Touch Targets
- **Minimum**: 48×48dp (44×44pt on iOS)
- **Recommended**: 56×56dp for primary actions
- **Spacing**: 8dp minimum between targets

### Color Contrast
- **Text**: 7:1 ratio (AAA standard)
- **Large text** (≥18pt): 4.5:1 ratio
- **Non-text elements**: 3:1 ratio
- **Tool**: Use design system tokens — they're pre-validated

### Font Scaling
- Support up to 200% scaling
- Test with large text: Settings > Accessibility > Larger Text
- Use relative units (not fixed pixel sizes)
- Ensure no content is clipped at 200%

### Screen Reader Support
| Platform | Tool | Test Command |
|----------|------|-------------|
| iOS | VoiceOver | Settings > Accessibility > VoiceOver |
| Android | TalkBack | Settings > Accessibility > TalkBack |
| Web | NVDA/JAWS | Install screen reader |

### Required Semantic Roles
| Element | accessibilityRole |
|---------|-------------------|
| Button | "button" |
| Link | "link" |
| Header text | "header" |
| Image | "image" |
| Text input | "none" (default) or "search" |
| Checkbox | "checkbox" |
| Switch | "switch" |
| Tab | "tab" |
| Alert | "alert" |
| Progress bar | "progressbar" |

### States to Communicate
| State | accessibilityState |
|-------|-------------------|
| Disabled | `{ disabled: true }` |
| Loading | `{ busy: true }` |
| Selected | `{ selected: true }` |
| Checked | `{ checked: true }` |
| Expanded | `{ expanded: true }` |

## Crisis-Specific Accessibility

### Emergency Button
```typescript
<Pressable
  onPress={handleSOS}
  accessibilityLabel="Emergency help — tap for immediate crisis support"
  accessibilityRole="button"
  accessibilityHint="Opens crisis resources including hotline numbers"
  style={{
    minHeight: 64,      // Extra large target
    minWidth: '80%',    // Wide touch area
    backgroundColor: tokens.colors.error,
  }}
>
  <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' }}>
    Get Help Now
  </Text>
</Pressable>
```

### Live Regions for Updates
```typescript
// Announce dynamic content changes
<View accessibilityLiveRegion="polite">
  <Text>Clean time: {days} days</Text>
</View>

// Urgent announcements
<View accessibilityLiveRegion="assertive">
  <Text>Crisis support is available</Text>
</View>
```

## Design System Accessibility Components

Located in `src/design-system/components/accessibility/`:
- `ScreenReaderText` — Visually hidden, screen reader only
- `AccessibleButton` — Pre-configured accessible button
- `LiveRegion` — Dynamic content announcer
- `SkipLink` — Skip to main content (web)
- `AccessibleList` — Accessible list with position announcements

## Testing Checklist

- [ ] VoiceOver navigation (iOS): All elements reachable and labeled
- [ ] TalkBack navigation (Android): All elements reachable and labeled
- [ ] 200% font scaling: No content clipped or overlapping
- [ ] High contrast mode: All text readable
- [ ] Touch targets: All ≥48×48dp
- [ ] Color contrast: All text ≥7:1 ratio
- [ ] Focus order: Logical tab/swipe order
- [ ] Error messages: Announced to screen reader
- [ ] Loading states: Announced with `busy: true`
- [ ] Animations: Respect `prefers-reduced-motion`
