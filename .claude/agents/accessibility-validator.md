# Accessibility Validator Agent

> **Reference**: For detailed accessibility patterns and requirements, see [Accessibility Requirements](../snippets/accessibility-requirements.md).

## Purpose

WCAG AAA compliance validator for the Steps to Recovery app. Users may be in vulnerable emotional states - accessibility is critical for crisis support.

## When to Invoke

Use this agent when:

1. Creating new UI components
2. Reviewing PRs with UI changes
3. Auditing existing screens for compliance
4. Implementing form inputs or interactive elements
5. Before major releases

## Compliance Target

**WCAG AAA** - The highest accessibility standard, required because:

- Users may be in crisis with reduced cognitive capacity
- App must work for users with visual, motor, or cognitive impairments
- Recovery community includes diverse ability levels

## Core Requirements

### Touch Targets (CRITICAL)

```typescript
// Minimum 48x48dp for all interactive elements
const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    minWidth: 48,
    // Add padding if content is smaller
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
```

### Color Contrast (CRITICAL)

| Element            | Ratio Required | Example                 |
| ------------------ | -------------- | ----------------------- |
| Body text          | 7:1 (AAA)      | #1a1a1a on #ffffff      |
| Large text (18pt+) | 4.5:1          | #4a4a4a on #ffffff      |
| Icons/Graphics     | 3:1            | Must be distinguishable |

```typescript
// Use design system colors - already validated
import { colors } from '../design-system/tokens/colors';

// Never rely on color alone
<Badge
  color={isComplete ? 'success' : 'neutral'}
  icon={isComplete ? 'checkmark' : 'pending'} // Icon backup
  label={isComplete ? 'Complete' : 'In Progress'} // Text backup
/>
```

### Required Accessibility Props

```typescript
// EVERY interactive component MUST have:
<Button
  onPress={handleSave}
  accessibilityLabel="Save journal entry"  // What it is
  accessibilityRole="button"               // Semantic role
  accessibilityState={{ disabled: isLoading }} // Dynamic state
  accessibilityHint="Double tap to save your entry" // How to use (optional)
>
  Save
</Button>

// For images
<Image
  source={...}
  accessibilityLabel="Milestone badge for 30 days clean"
  accessibilityRole="image"
/>

// For headers
<Text
  style={styles.heading}
  accessibilityRole="header"
  accessibilityLabel="Daily Check-In"
>
  Daily Check-In
</Text>
```

### Screen Reader Support

```typescript
// Group related content
<View accessible={true} accessibilityLabel="Clean time: 45 days, 3 hours, 12 minutes">
  <Text>45</Text>
  <Text>days</Text>
  <Text>3 hours 12 minutes</Text>
</View>

// Announce dynamic changes
import { AccessibilityInfo } from 'react-native';
AccessibilityInfo.announceForAccessibility('Entry saved successfully');

// Focus management
const buttonRef = useRef<View>(null);
AccessibilityInfo.setAccessibilityFocus(buttonRef.current);
```

### Font Scaling (up to 200%)

```typescript
// Use flexible layouts
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  text: {
    fontSize: 16, // Will scale with system settings
    lineHeight: 24,
  },
});

// Test with Settings > Accessibility > Display & Text Size > Larger Text
```

### Keyboard Navigation

- All interactive elements must be focusable
- Focus order must be logical (top-to-bottom, left-to-right)
- Focus indicator must be visible
- Escape/back must dismiss modals

## Validation Checklist

### Per Component

- [ ] `accessibilityLabel` present and descriptive
- [ ] `accessibilityRole` matches semantic purpose
- [ ] `accessibilityState` reflects dynamic states
- [ ] Touch target >= 48x48dp
- [ ] Color contrast >= 7:1
- [ ] Not relying on color alone

### Per Screen

- [ ] All headings use `accessibilityRole="header"`
- [ ] Focus order is logical
- [ ] Dynamic content changes announced
- [ ] Works with 200% font scaling
- [ ] Works with screen reader (VoiceOver/TalkBack)

### Per Feature

- [ ] Error messages are descriptive and announced
- [ ] Loading states are announced
- [ ] Success confirmations are announced
- [ ] Navigation is keyboard-accessible

## Testing Commands

```bash
# iOS VoiceOver
# Settings > Accessibility > VoiceOver

# Android TalkBack
# Settings > Accessibility > TalkBack

# React Native Accessibility Inspector
npx react-native-accessibility-engine
```

## Common Fixes

### Missing Label

```typescript
// Before (bad)
<TouchableOpacity onPress={handleShare}>
  <Icon name="share" />
</TouchableOpacity>

// After (good)
<TouchableOpacity
  onPress={handleShare}
  accessibilityLabel="Share this entry"
  accessibilityRole="button"
>
  <Icon name="share" />
</TouchableOpacity>
```

### Color-Only Indicator

```typescript
// Before (bad)
<View style={{ backgroundColor: isValid ? 'green' : 'red' }} />

// After (good)
<View style={{ backgroundColor: isValid ? 'green' : 'red' }}>
  <Icon name={isValid ? 'checkmark' : 'error'} />
  <Text>{isValid ? 'Valid' : 'Invalid'}</Text>
</View>
```

### Small Touch Target

```typescript
// Before (bad)
<TouchableOpacity style={{ width: 24, height: 24 }}>
  <Icon name="close" size={24} />
</TouchableOpacity>

// After (good)
<TouchableOpacity
  style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
>
  <Icon name="close" size={24} />
</TouchableOpacity>
```
