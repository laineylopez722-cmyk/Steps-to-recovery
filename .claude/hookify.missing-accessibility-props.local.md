---
name: missing-accessibility-props
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.(tsx|jsx)$
  - field: new_text
    operator: regex_match
    pattern: <(Button|Pressable|TouchableOpacity|TextInput)[^>]*>(?!.*accessibilityLabel)
---

♿ **Accessibility: Missing WCAG AAA Props**

Interactive component is missing required accessibility attributes for screen readers.

**Why this is critical:**

- Users in recovery may have visual or motor impairments
- WCAG AAA compliance is mandatory for this app
- VoiceOver (iOS) and TalkBack (Android) require proper labels
- Touch targets must be ≥48x48dp with proper semantics

**What to do - EVERY interactive component needs:**

```typescript
// ✅ CORRECT
<Button
  onPress={handleSave}
  accessibilityLabel="Save journal entry"
  accessibilityRole="button"
  accessibilityState={{ disabled: isLoading }}
  accessibilityHint="Saves your entry to the device"
>
  Save
</Button>

<Pressable
  onPress={handleDelete}
  accessibilityLabel="Delete this entry"
  accessibilityRole="button"
  accessibilityState={{ disabled: !canDelete }}
>
  <Icon name="trash" />
</Pressable>

<TextInput
  placeholder="Journal entry..."
  accessibilityLabel="Journal entry text input"
  accessibilityRole="text"
  accessibilityHint="Type your thoughts and reflections"
/>
```

**Required fields:**

- `accessibilityLabel` - What is this? (required)
- `accessibilityRole` - button, text, header, etc. (required)
- `accessibilityState` - { disabled, checked, busy } (when applicable)
- `accessibilityHint` - How to use? (when action is non-obvious)

See CLAUDE.md "Accessibility Requirements" section.
