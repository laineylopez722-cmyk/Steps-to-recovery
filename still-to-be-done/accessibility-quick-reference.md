# Accessibility Quick Reference

Quick copy-paste patterns for adding accessibility to React Native components.

---

## Buttons & Interactive Elements

```typescript
// Standard button
<Pressable 
  onPress={handleAction}
  accessibilityLabel="Save changes"
  accessibilityRole="button"
  accessibilityHint="Saves your edits to the journal entry"
  accessibilityState={{ disabled: isLoading }}
>
  <Text>Save</Text>
</Pressable>

// Button with loading state
<Button
  onPress={handleSubmit}
  disabled={!isValid || isPending}
  loading={isPending}
  accessibilityLabel="Submit form"
  accessibilityRole="button"
  accessibilityHint="Submit your answers"
  accessibilityState={{ 
    disabled: !isValid || isPending,
    busy: isPending 
  }}
>
  Submit
</Button>

// Link/Navigation
<TouchableOpacity 
  onPress={navigateToDetails}
  accessibilityLabel="View journal entry from January 5th"
  accessibilityRole="button"
  accessibilityHint="Opens the full journal entry"
>
  <Text>January 5, 2026</Text>
</TouchableOpacity>
```

---

## Text Inputs

```typescript
// Single-line input
<TextInput
  value={title}
  onChangeText={setTitle}
  placeholder="Entry title"
  accessibilityLabel="Journal entry title"
  accessibilityHint="Give your entry a descriptive title"
  accessibilityRole="none" // or omit for TextInput
/>

// Multi-line textarea
<TextArea
  value={body}
  onChangeText={setBody}
  placeholder="Write your thoughts..."
  accessibilityLabel="Journal entry content"
  accessibilityHint="Write your thoughts and feelings"
/>

// With character count
<TextArea
  value={text}
  onChangeText={setText}
  maxLength={500}
  showCharacterCount
  accessibilityLabel="Reflection text"
  accessibilityHint={`Enter your reflection, maximum 500 characters. ${text.length} of 500 used.`}
/>
```

---

## Sliders & Adjustable Controls

```typescript
// Mood slider (1-5)
const moodLabels = ['Very Sad', 'Sad', 'Neutral', 'Good', 'Great'];

<Slider
  value={mood}
  onValueChange={setMood}
  minimumValue={1}
  maximumValue={5}
  step={1}
  accessibilityLabel={`Mood level: ${moodLabels[mood - 1]}`}
  accessibilityRole="adjustable"
  accessibilityHint="Swipe up or down to adjust your mood from 1 to 5"
/>

// Craving level (0-10)
<Slider
  value={craving}
  onValueChange={setCraving}
  minimumValue={0}
  maximumValue={10}
  step={1}
  accessibilityLabel={`Craving level: ${craving} out of 10`}
  accessibilityRole="adjustable"
  accessibilityHint="Swipe up or down to adjust your craving level"
/>
```

---

## Headers & Sections

```typescript
// Page title
<Text 
  style={styles.title}
  accessibilityRole="header"
  accessibilityLabel="Good Morning"
>
  Good Morning
</Text>

// Section header
<View 
  accessibilityRole="header"
  accessibilityLabel="Daily Check-In Section"
>
  <Text style={styles.sectionTitle}>Daily Check-In</Text>
  <Text style={styles.subtitle}>Answer these questions</Text>
</View>

// Combined header with metadata
<View 
  accessibilityRole="header"
  accessibilityLabel="Personal Inventory, Questions 1 through 10"
>
  <Text>Personal Inventory</Text>
  <Text>Questions 1-10</Text>
</View>
```

---

## Decorative Elements

```typescript
// Decorative icons (don't announce)
<MaterialIcons 
  name="lock" 
  size={20} 
  color={theme.colors.success}
  accessible={false}
/>

// Decorative emoji
<Text accessible={false}>✨</Text>

// Decorative images
<Image 
  source={pattern} 
  style={styles.background}
  accessible={false}
/>

// Decorative view (background, separator, etc.)
<View style={styles.decorativePattern} accessible={false} />
```

---

## Alerts & Warnings

```typescript
// Error/Warning alert
<View 
  style={styles.warningBox}
  accessibilityRole="alert"
  accessibilityLabel="High craving warning"
>
  <Icon name="warning" accessible={false} />
  <Text>Consider reaching out to your sponsor</Text>
</View>

// Success message
<View 
  accessibilityRole="alert"
  accessibilityLabel="Entry saved successfully"
>
  <Icon name="check" accessible={false} />
  <Text>Entry saved!</Text>
</View>

// Modal announcement
<Modal visible={showModal}>
  <View 
    accessibilityRole="alert"
    accessibilityLabel="Morning check-in completed successfully"
  >
    <Text>Great Start!</Text>
    <Text>Have a wonderful day</Text>
  </View>
</Modal>
```

---

## Lists & Cards

```typescript
// List container
<FlatList
  data={entries}
  renderItem={renderItem}
  accessibilityRole="list"
  accessibilityLabel="Journal entries list"
/>

// Interactive card/list item
<TouchableOpacity
  onPress={() => handlePress(item)}
  accessibilityLabel={`Journal entry from ${formatDate(item.date)}`}
  accessibilityRole="button"
  accessibilityHint="Tap to view and edit this entry"
  accessibilityState={{ selected: item.id === selectedId }}
>
  <Card>
    <Text>{item.title}</Text>
    <Text>{item.date}</Text>
  </Card>
</TouchableOpacity>

// Non-interactive card (informational)
<Card 
  accessibilityRole="text"
  accessibilityLabel={`This morning's intention: ${intention}`}
>
  <Text>This morning's intention:</Text>
  <Text>{intention}</Text>
</Card>
```

---

## Complex Components

```typescript
// Tag with remove button
<View style={styles.tagWrapper}>
  <Badge>{tag}</Badge>
  <TouchableOpacity
    onPress={() => handleRemoveTag(tag)}
    accessibilityLabel={`Remove ${tag} tag`}
    accessibilityRole="button"
    accessibilityHint="Removes this tag from the entry"
  >
    <Icon name="close" accessible={false} />
  </TouchableOpacity>
</View>

// Progress indicator with label
<View 
  accessibilityLabel={`Step 1 progress: ${answeredCount} of ${totalQuestions} questions answered, ${percent}% complete`}
>
  <Text>{answeredCount}/{totalQuestions}</Text>
  <ProgressBar progress={percent / 100} />
</View>

// Form with multiple fields
<View accessibilityRole="form">
  <TextInput 
    accessibilityLabel="First name"
    accessibilityRequired={true}
  />
  <TextInput 
    accessibilityLabel="Email address"
    accessibilityRequired={true}
  />
  <Button accessibilityLabel="Submit registration" />
</View>
```

---

## State Management

```typescript
// Loading state
<Button
  loading={isLoading}
  accessibilityLabel="Save entry"
  accessibilityState={{ busy: isLoading }}
/>

// Disabled state
<Button
  disabled={!isValid}
  accessibilityLabel="Submit"
  accessibilityState={{ disabled: !isValid }}
/>

// Selected/Checked state
<Pressable
  onPress={toggleSelection}
  accessibilityRole="checkbox"
  accessibilityLabel="Enable notifications"
  accessibilityState={{ checked: isSelected }}
/>

// Expanded/Collapsed state
<Pressable
  onPress={toggleExpanded}
  accessibilityRole="button"
  accessibilityLabel="Step 1 details"
  accessibilityState={{ expanded: isExpanded }}
  accessibilityHint={isExpanded ? "Collapse details" : "Expand details"}
/>
```

---

## Screen Containers

```typescript
// Main screen container
<SafeAreaView 
  style={styles.container}
  accessible={false} // Let children be accessible
>
  <ScrollView
    accessibilityRole="scrollbar"
    accessibilityLabel="Home screen content"
  >
    {/* Content */}
  </ScrollView>
</SafeAreaView>

// Modal overlay (don't announce background)
<Modal visible={showModal}>
  <View style={styles.overlay} accessible={false}>
    <View 
      style={styles.modalContent}
      accessibilityRole="alert"
      accessibilityLabel="Confirmation dialog"
    >
      {/* Modal content */}
    </View>
  </View>
</Modal>
```

---

## Testing

```typescript
// Test accessibility in Jest
import { render } from '@testing-library/react-native';

test('button has correct accessibility', () => {
  const { getByRole } = render(<MyButton />);
  
  const button = getByRole('button', { name: 'Save entry' });
  expect(button).toHaveProp('accessibilityHint', 'Saves your journal entry');
  expect(button).toHaveProp('accessibilityState', { disabled: false });
});
```

---

## Common Roles

- `button` - Pressable/TouchableOpacity for actions
- `header` - Section titles, page headers
- `text` - Static text content
- `adjustable` - Sliders, pickers
- `image` - Meaningful images
- `imagebutton` - Images that are clickable
- `link` - Navigation links
- `search` - Search inputs
- `checkbox` - Toggle/checkbox
- `radio` - Radio buttons
- `switch` - Toggle switches
- `alert` - Warnings, errors, success messages
- `none` - Disable default behavior (use sparingly)

---

## Best Practices

1. **Always provide labels** for interactive elements
2. **Hints are optional** but helpful for non-obvious actions
3. **Mark decorative elements** as `accessible={false}`
4. **Use proper roles** so screen readers announce correctly
5. **Track states** (disabled, loading, selected)
6. **Be concise** but descriptive in labels
7. **Test with VoiceOver/TalkBack** before shipping

---

## Resources

- [React Native Accessibility Docs](https://reactnative.dev/docs/accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [iOS VoiceOver Guide](https://support.apple.com/guide/iphone/turn-on-and-practice-voiceover-iph3e2e415f/ios)
- [Android TalkBack Guide](https://support.google.com/accessibility/android/answer/6283677)
