# Accessibility Requirements

## Target Standard

**WCAG AAA** - The highest accessibility standard, required because users may be in crisis or vulnerable states.

## Required Props for ALL Interactive Components

```typescript
<Button
  onPress={handleSave}
  accessibilityLabel="Save journal entry"        // What it is
  accessibilityRole="button"                     // Semantic role
  accessibilityState={{ disabled: isLoading }}  // Dynamic state
  accessibilityHint="Double tap to save"        // How to use (optional)
>
  Save
</Button>
```

## Touch Target Sizes

```typescript
const styles = StyleSheet.create({
  button: {
    minHeight: 48,  // Minimum 48x48dp for all interactive elements
    minWidth: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
```

## Color Contrast Requirements

| Element            | Ratio Required | Example            |
| ------------------ | -------------- | ------------------ |
| Body text          | 7:1 (AAA)      | #1a1a1a on #ffffff |
| Large text (18pt+) | 4.5:1          | #4a4a4a on #ffffff |
| Icons/Graphics     | 3:1            | Distinguishable    |

```typescript
// Use design system colors - already validated
import { colors } from '@/design-system/tokens/colors';

// Never rely on color alone - always provide backup indicators
<Badge
  color={isComplete ? 'success' : 'neutral'}
  icon={isComplete ? 'checkmark' : 'pending'}  // Icon backup
  label={isComplete ? 'Complete' : 'In Progress'}  // Text backup
/>
```

## Screen Reader Support

```typescript
// Group related content for screen readers
<View accessible={true} accessibilityLabel="Clean time: 45 days, 3 hours, 12 minutes">
  <Text>45</Text>
  <Text>days</Text>
  <Text>3 hours 12 minutes</Text>
</View>
```

## Accessibility Checklist

- [ ] All interactive elements have `accessibilityLabel`
- [ ] All interactive elements have `accessibilityRole`
- [ ] Dynamic states use `accessibilityState`
- [ ] Minimum touch target: 48x48dp
- [ ] Color contrast ratio: 7:1 (AAA)
- [ ] Never rely on color alone for information
- [ ] Support screen readers (TalkBack, VoiceOver)
- [ ] Support font scaling (up to 200%)
- [ ] Test with VoiceOver (iOS) and TalkBack (Android)
