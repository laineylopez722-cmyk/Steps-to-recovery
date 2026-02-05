# Accessibility Issues & WCAG Compliance

**Review Date**: 2026-02-06  
**Target Standard**: WCAG 2.1 AAA (recovery app serving vulnerable users)

---

## Overview

Accessibility is a **CRITICAL GAP** in this app. With only 16 instances of accessibility props across the entire codebase, the app is currently **unusable for screen reader users** and **non-compliant with WCAG** standards.

**Overall Grade**: D (Failing)

**Status**: ❌ NOT READY for production launch

---

## Critical Issues (P0)

### 1. Missing Accessibility Props on Interactive Elements

**Severity**: CRITICAL  
**Impact**: App is unusable for blind/low-vision users  
**WCAG Violations**: 1.3.1, 2.4.4, 4.1.2 (Level A)

**Current State**:
- Found only **16 uses** of `accessibilityLabel/accessibilityRole` in entire codebase
- Estimated **100+** interactive components (buttons, cards, inputs) need props
- **Coverage**: ~5% (failing)

**Examples of Missing Props**:

```typescript
// ❌ BAD: No accessibility props
<TouchableOpacity onPress={handlePress}>
  <Text>Save</Text>
</TouchableOpacity>

// ❌ BAD: Icon button with no label
<TouchableOpacity onPress={onDelete}>
  <Icon name="trash" />
</TouchableOpacity>

// ✅ GOOD: Proper accessibility
<TouchableOpacity
  onPress={handlePress}
  accessibilityLabel="Save journal entry"
  accessibilityRole="button"
  accessibilityHint="Double tap to save your entry"
>
  <Text>Save</Text>
</TouchableOpacity>

// ✅ GOOD: Icon button with description
<TouchableOpacity
  onPress={onDelete}
  accessibilityLabel="Delete entry"
  accessibilityRole="button"
  accessibilityHint="Permanently deletes this journal entry"
>
  <Icon name="trash" />
</TouchableOpacity>
```

**Required Props**:
- `accessibilityLabel` - REQUIRED for all interactive elements
- `accessibilityRole` - REQUIRED (button, link, header, etc.)
- `accessibilityState` - REQUIRED when disabled/selected/checked
- `accessibilityHint` - RECOMMENDED for non-obvious actions

**Action Items**:
- [ ] Audit all Touchable* components (estimate: 100+)
- [ ] Audit all Pressable components (estimate: 50+)
- [ ] Audit all custom Button components
- [ ] Add props systematically (estimate: 20-30 hours)

---

### 2. Touch Target Sizes Not Verified

**Severity**: HIGH  
**Impact**: Difficult to tap buttons, especially for users with motor disabilities  
**WCAG Violations**: 2.5.5 (Level AAA)

**Standard**: Minimum **48x48dp** touch target (iOS HIG, Android Material Design)

**Examples of Potential Issues**:

```typescript
// ❌ BAD: Small touch target
<TouchableOpacity style={{ width: 24, height: 24 }} onPress={onPress}>
  <Icon name="heart" size={24} />
</TouchableOpacity>
// Touch area is only 24x24 (too small!)

// ✅ GOOD: Proper touch target with hitSlop
<TouchableOpacity
  style={{ width: 24, height: 24 }}
  onPress={onPress}
  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
  // Effective touch area: 48x48
>
  <Icon name="heart" size={24} />
</TouchableOpacity>

// ✅ BETTER: Use proper sizing
<TouchableOpacity
  style={{ width: 48, height: 48, justifyContent: 'center', alignItems: 'center' }}
  onPress={onPress}
>
  <Icon name="heart" size={24} />
</TouchableOpacity>
```

**Action Items**:
- [ ] Audit all interactive elements for size
- [ ] Add `hitSlop` to small buttons/icons
- [ ] Ensure spacing between tappable elements (≥8dp)
- [ ] Test with physical device (fingers, not mouse)

---

### 3. Color Contrast Not Verified

**Severity**: HIGH  
**Impact**: Text unreadable for users with low vision or color blindness  
**WCAG Violations**: 1.4.3 (Level AA), 1.4.6 (Level AAA)

**Standards**:
- **Level AA**: 4.5:1 for normal text, 3:1 for large text
- **Level AAA**: 7:1 for normal text, 4.5:1 for large text (target for recovery app)

**Current State**: No contrast audit found in codebase

**Potential Issues**:

```typescript
// design-system/tokens/colors.ts
const colors = {
  primary: '#8b5cf6',      // Purple - Need to verify contrast
  textSecondary: '#94a3b8', // Light gray - May fail AAA contrast
  error: '#ef4444',        // Red - Need to verify with backgrounds
};

// ❌ POTENTIAL ISSUE: Light text on light background
<Text style={{ color: '#94a3b8', backgroundColor: '#f8fafc' }}>
  Secondary text
</Text>
// Contrast ratio: ~2.5:1 (FAILS WCAG AAA)

// ✅ GOOD: High contrast
<Text style={{ color: '#1e293b', backgroundColor: '#ffffff' }}>
  Primary text
</Text>
// Contrast ratio: ~16:1 (PASSES WCAG AAA)
```

**Tools to Check Contrast**:
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Stark (Figma plugin)
- Color Oracle (simulate color blindness)

**Action Items**:
- [ ] Audit all text + background color combinations
- [ ] Check primary, secondary, error colors against backgrounds
- [ ] Ensure ALL text meets 7:1 contrast (AAA standard)
- [ ] Document color contrast in design system

---

### 4. Form Inputs Missing Proper Labels

**Severity**: HIGH  
**Impact**: Screen readers can't identify form fields  
**WCAG Violations**: 1.3.1, 3.3.2 (Level A)

**Current State**: Input components exist but labeling inconsistent

**Examples**:

```typescript
// ❌ BAD: No label, no accessibility
<TextInput
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
/>

// ✅ GOOD: Proper labeling
<View>
  <Text
    accessibilityRole="text"
    accessibilityLabel="Email address"
  >
    Email
  </Text>
  <TextInput
    placeholder="Enter your email"
    value={email}
    onChangeText={setEmail}
    accessibilityLabel="Email address"
    accessibilityHint="Enter your email for login"
    accessibilityRequired={true}
  />
</View>

// ✅ BETTER: Use design system Input component with built-in labels
<Input
  label="Email"
  value={email}
  onChangeText={setEmail}
  required
  accessibilityHint="Enter your email for login"
/>
```

**Action Items**:
- [ ] Audit all TextInput usages
- [ ] Ensure all have `accessibilityLabel`
- [ ] Add `accessibilityHint` for complex inputs
- [ ] Mark required fields with `accessibilityRequired`

---

## Important Issues (P1)

### 5. No Screen Reader Testing Evidence

**Issue**: No indication that app has been tested with screen readers  
**Impact**: Unknown usability for blind/low-vision users

**Testing Requirements**:
- **iOS**: Test with VoiceOver
- **Android**: Test with TalkBack
- **Web**: Test with NVDA/JAWS

**Test Checklist**:
```markdown
Screen Reader Testing Checklist:

Navigation:
- [ ] Can navigate between screens using screen reader
- [ ] Tab order is logical (top-to-bottom, left-to-right)
- [ ] Focus indicators are visible
- [ ] No focus traps (can escape modals)

Content:
- [ ] All headings are properly announced
- [ ] All buttons have clear labels
- [ ] All form fields have labels
- [ ] Images have alternative text (or marked as decorative)

Interaction:
- [ ] Can activate buttons/links with screen reader
- [ ] Can fill out forms
- [ ] Can dismiss modals/alerts
- [ ] Receive feedback for actions (success/error messages)

Specific Flows:
- [ ] Login flow accessible
- [ ] Create journal entry accessible
- [ ] Complete daily check-in accessible
- [ ] Navigate step work accessible
```

**Action Items**:
- [ ] Test critical flows with VoiceOver (iOS)
- [ ] Test critical flows with TalkBack (Android)
- [ ] Document screen reader testing in TESTING.md
- [ ] Create screen reader testing guide for QA

---

### 6. Dynamic Font Scaling Not Tested

**Issue**: No evidence of testing with large font sizes  
**Impact**: Text may overflow or be cut off for users who need larger fonts  
**WCAG Violations**: 1.4.4 (Level AA)

**Standard**: Support up to **200% font scaling**

**Testing**:
```typescript
// iOS: Settings > Accessibility > Display & Text Size > Larger Text
// Android: Settings > Display > Font size

// Test these scenarios:
// 1. Normal font size (default)
// 2. 150% font size
// 3. 200% font size (maximum required)
```

**Potential Issues**:
```typescript
// ❌ BAD: Fixed height can cause text cutoff
<View style={{ height: 60 }}>
  <Text>This text may be cut off at large font sizes</Text>
</View>

// ✅ GOOD: Allow dynamic sizing
<View style={{ paddingVertical: 12 }}>
  <Text>This text will expand with font size</Text>
</View>
```

**Action Items**:
- [ ] Test app with 200% font scaling
- [ ] Identify layouts that break
- [ ] Remove fixed heights where possible
- [ ] Use `numberOfLines` + `ellipsizeMode` for multi-line text

---

### 7. Modal/Alert Accessibility

**Issue**: Modals may not be properly announced to screen readers  
**Impact**: Users may not know a modal has appeared

**Requirements**:
- Modal opening should be announced
- Focus should move to modal content
- User should be able to dismiss modal
- Focus should return to trigger element after close

**Example**:
```typescript
// ✅ GOOD: Accessible modal
<Modal
  visible={isVisible}
  onRequestClose={onClose}
  accessibilityViewIsModal={true}  // REQUIRED for screen readers
>
  <View
    accessibilityRole="dialog"
    accessibilityLabel="Confirm delete"
  >
    <Text>Are you sure you want to delete this entry?</Text>
    <Button onPress={onConfirm} accessibilityLabel="Confirm deletion">
      Delete
    </Button>
    <Button onPress={onClose} accessibilityLabel="Cancel deletion">
      Cancel
    </Button>
  </View>
</Modal>
```

**Action Items**:
- [ ] Audit all Modal usages
- [ ] Add `accessibilityViewIsModal={true}`
- [ ] Add `accessibilityRole="dialog"` to modal content
- [ ] Test focus management with screen reader

---

### 8. List Items Missing Semantic Roles

**Issue**: List items not properly announced as list items  
**Impact**: Screen reader users don't know they're in a list

**Example**:
```typescript
// ❌ BAD: No semantic meaning
<FlatList
  data={entries}
  renderItem={({ item }) => (
    <TouchableOpacity onPress={() => onPress(item.id)}>
      <Text>{item.title}</Text>
    </TouchableOpacity>
  )}
/>

// ✅ GOOD: Proper list semantics
<FlatList
  data={entries}
  accessibilityRole="list"
  renderItem={({ item, index }) => (
    <TouchableOpacity
      onPress={() => onPress(item.id)}
      accessibilityRole="button"
      accessibilityLabel={`Journal entry: ${item.title}`}
      accessibilityHint={`Entry ${index + 1} of ${entries.length}`}
    >
      <Text>{item.title}</Text>
    </TouchableOpacity>
  )}
/>
```

**Action Items**:
- [ ] Add `accessibilityRole="list"` to FlatList/ScrollView
- [ ] Add proper labels to list items
- [ ] Include position info ("item 3 of 10")

---

## Medium-Priority Issues (P2)

### 9. No Keyboard Navigation Support (Web)

**Issue**: Web version may not support keyboard-only navigation  
**Impact**: Users who can't use a mouse are locked out

**Requirements** (Web Only):
- Tab key navigates between focusable elements
- Enter/Space activates buttons
- Escape closes modals
- Arrow keys navigate lists (optional but nice)

**Action Items**:
- [ ] Test web version with keyboard only (no mouse)
- [ ] Ensure logical tab order
- [ ] Add keyboard shortcuts (optional)

---

### 10. Loading States Not Announced

**Issue**: Loading indicators may be invisible to screen readers  
**Impact**: Users don't know the app is working

**Example**:
```typescript
// ❌ BAD: Silent loading
{isLoading && <ActivityIndicator />}

// ✅ GOOD: Announced loading
{isLoading && (
  <View accessibilityLiveRegion="polite">
    <ActivityIndicator />
    <Text accessibilityLabel="Loading journal entries">
      Loading...
    </Text>
  </View>
)}
```

**Action Items**:
- [ ] Add `accessibilityLiveRegion` to loading states
- [ ] Announce when loading completes
- [ ] Announce errors

---

### 11. Error Messages Not Accessible

**Issue**: Error messages may not be properly announced  
**Impact**: Users miss important feedback

**Example**:
```typescript
// ❌ BAD: Silent error
{error && <Text style={{ color: 'red' }}>{error}</Text>}

// ✅ GOOD: Announced error
{error && (
  <View
    accessibilityLiveRegion="assertive"  // Immediate announcement
    accessibilityRole="alert"
  >
    <Text style={{ color: '#dc2626' }}>
      {error}
    </Text>
  </View>
)}
```

**Action Items**:
- [ ] Audit all error displays
- [ ] Add `accessibilityLiveRegion="assertive"` to errors
- [ ] Add `accessibilityRole="alert"`

---

## Accessibility Testing Checklist

### Automated Testing:
- [ ] Install `eslint-plugin-jsx-a11y` (web)
- [ ] Install `eslint-plugin-react-native-a11y` (mobile)
- [ ] Run accessibility linter
- [ ] Fix all violations

### Manual Testing:
- [ ] Test with VoiceOver (iOS)
- [ ] Test with TalkBack (Android)
- [ ] Test with 200% font scaling
- [ ] Test with high contrast mode
- [ ] Test with keyboard only (web)
- [ ] Test in bright sunlight (contrast check)

### User Testing:
- [ ] Recruit users with disabilities
- [ ] Observe real usage patterns
- [ ] Collect feedback
- [ ] Iterate based on findings

---

## Priority Roadmap

### Week 1 (Critical):
1. Add accessibility props to all buttons (estimate: 10-15 hours)
2. Verify touch target sizes (estimate: 5-6 hours)
3. Basic screen reader testing (estimate: 4-5 hours)
**Total**: 19-26 hours

### Week 2 (Important):
1. Audit color contrast (estimate: 3-4 hours)
2. Fix form input labels (estimate: 4-5 hours)
3. Test with 200% font scaling (estimate: 3-4 hours)
4. Fix modal accessibility (estimate: 3-4 hours)
**Total**: 13-17 hours

### Week 3 (Polish):
1. Add loading/error announcements (estimate: 2-3 hours)
2. Fix list semantics (estimate: 2-3 hours)
3. Keyboard navigation (web) (estimate: 4-5 hours)
4. User testing with disabilities (estimate: 8-10 hours)
**Total**: 16-21 hours

**Overall Estimate**: 48-64 hours (~1.5-2 weeks of focused work)

---

## Resources

### Tools:
- **React Native**: `@react-native-community/eslint-plugin-a11y`
- **Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Screen Reader**: VoiceOver (iOS), TalkBack (Android)
- **Font Scaling**: Device settings

### Documentation:
- **React Native A11y**: https://reactnative.dev/docs/accessibility
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **iOS HIG**: https://developer.apple.com/design/human-interface-guidelines/accessibility
- **Android A11y**: https://developer.android.com/guide/topics/ui/accessibility

---

## Severity Assessment

**Critical Issues (Launch Blockers)**:
1. Missing accessibility props (100+ components)
2. Touch target sizes not verified
3. Color contrast not verified
4. Form inputs missing labels

**Impact**: App is currently **UNUSABLE** for users with disabilities.

**Recommendation**: **BLOCK PRODUCTION LAUNCH** until at least P0 issues are addressed. This is not just a legal requirement (ADA, Section 508) but a **moral imperative** for an app serving people in recovery who may already be vulnerable.

---

**Bottom Line**: Accessibility is a **CRITICAL FAILURE** in this app. With only ~5% of interactive elements properly labeled and no screen reader testing, the app is not ready for launch. Minimum **48-64 hours** of focused accessibility work required before production release.
