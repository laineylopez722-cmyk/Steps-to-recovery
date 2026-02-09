# Recovery Companion - UX Principles
## Compassionate Design for Recovery Apps

---

## Core Philosophy

> **"Does this help someone having their worst day?"**
>
> Every design decision, every word choice, every interaction must pass this test.
> People using this app may be in crisis, celebrating a milestone, or anywhere
> in between. Our job is to support—never judge, never shame, never trivialize.

---

## The Three Pillars

### 1. Privacy as Care

Privacy isn't a feature—it's how we show users we respect their vulnerability.

```
✅ "Your journal stays on your device, always."
✅ "No account needed. Your recovery, your business."
✅ "Encrypted and private—even we can't read it."

❌ "Sign up to sync your data!"
❌ "Share your progress with friends!"
❌ "Enable analytics to improve your experience"
```

### 2. Progress Over Perfection

Recovery isn't linear. The app must acknowledge this truth in every interaction.

```
✅ "Every sober day matters."
✅ "Recovery has ups and downs—you're still here."
✅ "Total days in recovery: 247"

❌ "Streak broken!"
❌ "Back to day 0"
❌ "You lost your progress"
```

### 3. Support Over Surveillance

We're a companion, not a supervisor. Users control their experience.

```
✅ "Ready to check in?" (optional, no pressure)
✅ "Your journal is here when you need it."
✅ "Take your time. There's no wrong way to recover."

❌ "You haven't checked in today!"
❌ "Don't break your streak!"
❌ "5 days since your last journal entry!"
```

---

## Language Guidelines

### Relapse Messaging

This is the most critical UX in the entire app. Get it wrong, and you could
harm someone in their most vulnerable moment.

#### NEVER Say (Shame-Based Language)

| Phrase | Why It's Harmful |
|--------|------------------|
| "You broke your streak" | Implies failure, adds guilt |
| "Streak lost" | Reduces recovery to a game |
| "You failed" | Personalizes as character flaw |
| "Start over" | Erases all previous progress |
| "Reset" | Mechanical, dehumanizing |
| "Days wasted" | Implies time in recovery was meaningless |
| "Back to zero" | Completely dismisses growth |
| "You slipped" | Patronizing, implies carelessness |
| "Try harder next time" | Implies lack of effort |
| "Don't give up" | Implies they might give up |

#### ALWAYS Say (Compassionate Language)

| Phrase | Why It Works |
|--------|--------------|
| "Recovery isn't always linear" | Normalizes setbacks |
| "Your journey continues" | Emphasizes ongoing progress |
| "Every sober day still counts" | Validates past effort |
| "Total days in recovery: X" | Preserves cumulative progress |
| "You're still here—that matters" | Affirms their presence |
| "What can we learn from this?" | Growth mindset |
| "How can we support you today?" | Offers help without judgment |
| "Progress, not perfection" | Core recovery principle |
| "One day at a time" | Returns to fundamental wisdom |

#### Relapse Flow Example

```tsx
// ❌ WRONG: Punitive Design
<View>
  <Text className="text-3xl">Day 0</Text>
  <Text>Your 90-day streak has been reset.</Text>
  <Button>Start Over</Button>
</View>

// ✅ CORRECT: Compassionate Design
<View>
  <Text className="text-2xl">Recovery continues</Text>
  <Text>
    Setbacks are part of many recovery journeys. 
    Your 90 days of growth and learning still matter.
  </Text>
  
  <Card>
    <Text className="font-bold">Your progress so far:</Text>
    <Text>• Total days in recovery: 247</Text>
    <Text>• Journal entries: 89</Text>
    <Text>• Meetings attended: 34</Text>
    <Text>• You're still here 💜</Text>
  </Card>
  
  <Text className="mt-4">When you're ready:</Text>
  <Button>Set a new recovery date</Button>
  <Button variant="ghost">I need support right now</Button>
</View>
```

---

## Empty States

Empty states are emotional moments. Someone seeing "No journal entries" might
feel they're failing. Design for encouragement, not pressure.

### Journal Empty State

```tsx
// ❌ WRONG: Guilt-inducing
<View>
  <Text>No journal entries yet.</Text>
  <Text>Start writing to track your recovery!</Text>
</View>

// ✅ CORRECT: Welcoming
<View>
  <BookOpenIcon />
  <Text className="text-xl">Your journal is ready</Text>
  <Text className="text-slate-400">
    When you're ready to write, we're here. 
    There's no pressure and no wrong way to start.
  </Text>
  <Button>Write your first entry</Button>
</View>
```

### Check-in Empty State

```tsx
// ❌ WRONG: Accusatory
<View>
  <Text>You haven't checked in today!</Text>
  <Text>Don't forget to log your mood.</Text>
</View>

// ✅ CORRECT: Gentle
<View>
  <SunIcon />
  <Text className="text-xl">Ready to check in?</Text>
  <Text className="text-slate-400">
    Take a moment to notice how you're feeling.
    It only takes a few seconds.
  </Text>
  <Button>Start check-in</Button>
</View>
```

### Milestones Empty State

```tsx
// ❌ WRONG: Implies failure
<View>
  <Text>No milestones yet.</Text>
  <Text>Keep going to unlock achievements!</Text>
</View>

// ✅ CORRECT: Forward-looking
<View>
  <StarIcon />
  <Text className="text-xl">Your milestones await</Text>
  <Text className="text-slate-400">
    Every day in recovery is an achievement.
    Your first milestone is coming up.
  </Text>
  <Text className="text-purple-400">Next: 24 hours ✨</Text>
</View>
```

---

## Notifications & Reminders

Notifications in a recovery app are powerful—they can help or harm. 
Always err on the side of gentle.

### Daily Check-in Reminder

```
// ❌ WRONG: Demanding
"Don't forget your check-in! Keep your streak going!"

// ❌ WRONG: Guilt-inducing  
"You missed yesterday's check-in. Try not to miss today."

// ✅ CORRECT: Gentle invitation
"Ready for your daily reflection? 🌿"

// ✅ CORRECT: Low pressure
"Your check-in is here when you need it."
```

### Milestone Approaching

```
// ❌ WRONG: Pressure-focused
"Only 2 days until your 30-day streak! Don't blow it!"

// ✅ CORRECT: Celebratory
"You're approaching 30 days. 🎉 That's incredible growth."
```

### No Check-in for Several Days

```
// ❌ WRONG: Accusatory
"It's been 5 days since you checked in. What's going on?"

// ✅ CORRECT: Caring
"We're here whenever you're ready. No pressure. 💜"

// OR: Simply don't send a notification at all.
// Absence of nagging is itself compassionate.
```

---

## Crisis Flow Requirements

### Speed Mandate

> Emergency resources must be accessible in **under 5 seconds** from any screen.

### Implementation Requirements

1. **Global Crisis FAB (Floating Action Button)**
   - Visible on ALL screens except modals
   - Fixed position (bottom-right)
   - Distinct color (red or emergency-associated)
   - One tap to emergency resources
   
2. **Emergency at Top of Tools**
   - First item in Tools screen grid
   - Larger or visually distinct from other tools
   
3. **High-Craving Check-in Path**
   - When user reports high craving (8+), offer immediate:
     - "Need help right now?" link
     - Breathing exercise shortcut
     - Vault access for motivation

### Crisis Button Design

```tsx
// components/common/CrisisButton.tsx
export function CrisisButton() {
  return (
    <TouchableOpacity
      onPress={navigateToEmergency}
      accessibilityLabel="Get emergency help"
      accessibilityRole="button"
      accessibilityHint="Opens crisis resources and hotlines"
      className="absolute bottom-20 right-4 w-14 h-14 bg-red-600 
                 rounded-full items-center justify-center shadow-lg
                 active:bg-red-700"
    >
      <PhoneIcon size={24} color="white" />
    </TouchableOpacity>
  );
}
```

### Emergency Screen Content

```tsx
// app/emergency.tsx
<View className="flex-1 bg-slate-900 p-6">
  <Text className="text-2xl font-bold text-white mb-2">
    You're not alone
  </Text>
  <Text className="text-slate-400 mb-6">
    Help is available right now. Tap to call or text.
  </Text>
  
  {/* Priority: Direct connection options first */}
  <CrisisHotline 
    name="SAMHSA National Helpline"
    number="1-800-662-4357"
    description="Free, confidential, 24/7 treatment referral"
  />
  
  <CrisisHotline 
    name="988 Suicide & Crisis Lifeline"
    number="988"
    description="Call or text, 24/7 support"
  />
  
  {/* Secondary: In-app tools */}
  <View className="mt-8">
    <Text className="text-lg font-semibold text-white mb-4">
      Quick tools
    </Text>
    <Button 
      icon={<WindIcon />}
      onPress={navigateToBreathing}
    >
      Breathing exercise
    </Button>
    <Button 
      icon={<HeartIcon />}
      onPress={navigateToVault}
    >
      Open motivation vault
    </Button>
  </View>
  
  {/* Tertiary: Sponsor/support contact */}
  <SponsorContact />
</View>
```

---

## Anti-Gamification Rules

### What We DON'T Do

| Pattern | Why It's Harmful |
|---------|------------------|
| **Badges for streaks** | Reduces recovery to a game; creates "streak anxiety" |
| **Leaderboards** | Comparison is toxic in recovery; triggers shame |
| **Points/XP** | Trivializes serious emotional work |
| **Achievement unlocks** | Creates "unlock anxiety"; feels manipulative |
| **Daily login rewards** | Creates obligation, not genuine engagement |
| **Streak multipliers** | Increases pressure, punishes setbacks harder |
| **Social comparison** | "John has 100 days!" triggers shame |
| **Quantity achievements** | "Write 10 journals!" prioritizes quantity over quality |

### What We DO Instead

| Pattern | Why It Works |
|---------|--------------|
| **Keytags** | Mirrors real AA/NA keytags; culturally meaningful |
| **Milestone reflections** | Celebrates with depth, not just numbers |
| **Personal achievements** | User-defined, not app-imposed |
| **Progress visualization** | Shows journey, not competition |
| **"Total days" metric** | Values all progress, survives relapses |
| **Qualitative celebration** | "What has changed?" not "You earned +50 points!" |

### Keytag System (The Right Way to Mark Time)

```tsx
// Based on real AA/NA keytag tradition
const keytags = [
  { days: 1, color: 'white', name: 'Welcome/Surrender' },
  { days: 30, color: 'orange', name: '30 Days' },
  { days: 60, color: 'green', name: '60 Days' },
  { days: 90, color: 'red', name: '90 Days' },
  { days: 180, color: 'blue', name: '6 Months' },
  { days: 270, color: 'yellow', name: '9 Months' },
  { days: 365, color: 'gray', name: '1 Year' },
  { days: 545, color: 'black', name: '18 Months' },
  // Years continue with multi-year chips
];

// When user reaches milestone:
<View>
  <KeytagImage color="red" />
  <Text>90 Days</Text>
  <Text>This keytag represents three months of courage.</Text>
  
  {/* Reflection, not points */}
  <Text>Take a moment to reflect:</Text>
  <TextInput 
    placeholder="What has changed in these 90 days?"
    multiline
  />
</View>
```

---

## Mood & Craving Visualization

### Mood Scale (1-10)

Don't use just numbers—give context.

```tsx
const moodLabels = {
  1: { emoji: '😢', label: 'Really struggling' },
  2: { emoji: '😔', label: 'Very low' },
  3: { emoji: '😕', label: 'Low' },
  4: { emoji: '😐', label: 'Below average' },
  5: { emoji: '😌', label: 'Okay' },
  6: { emoji: '🙂', label: 'Pretty good' },
  7: { emoji: '😊', label: 'Good' },
  8: { emoji: '😃', label: 'Great' },
  9: { emoji: '😄', label: 'Excellent' },
  10: { emoji: '🌟', label: 'Amazing' },
};
```

### Craving Scale (0-10)

Normalize the experience of cravings.

```tsx
const cravingLabels = {
  0: { label: 'None at all', hint: 'Feeling peaceful' },
  1: { label: 'Barely there', hint: 'Easy to manage' },
  2: { label: 'Mild', hint: 'Noticeable but not distracting' },
  3: { label: 'Moderate', hint: 'On your mind' },
  4: { label: 'Building', hint: 'Taking some focus' },
  5: { label: 'Strong', hint: 'Hard to ignore' },
  6: { label: 'Very strong', hint: 'Need to use tools' },
  7: { label: 'Intense', hint: 'Challenging moment' },
  8: { label: 'Very intense', hint: 'Consider reaching out' },
  9: { label: 'Severe', hint: 'This will pass' },
  10: { label: 'Overwhelming', hint: 'You need support now' },
};

// When craving is 8+, show additional support
{cravingLevel >= 8 && (
  <Card className="bg-amber-600/20 border-amber-500/30">
    <Text className="font-semibold text-amber-400">
      This is a tough moment
    </Text>
    <Text className="text-slate-300 mt-1">
      Cravings pass. Here's some help right now:
    </Text>
    <Button onPress={goToBreathing}>Breathing exercise</Button>
    <Button onPress={goToVault}>Open your vault</Button>
    <Button onPress={goToEmergency}>Call for support</Button>
  </Card>
)}
```

---

## Tone Examples by Context

### Celebrating Milestones

```
// Good: Meaningful, personal
"365 days. A whole year of showing up for yourself. 
What would you tell the person who started this journey?"

// Avoid: Generic, hollow
"Congratulations! You've unlocked the 1 Year Achievement! 🏆"
```

### After a Difficult Check-in

```
// Good: Acknowledging, supportive
"Thank you for being honest about how you're feeling.
That takes courage. Your tools are here if you need them."

// Avoid: Dismissive
"Logged! See you tomorrow! 👋"
```

### During Step Work

```
// Good: Encouraging, realistic
"Step 4 can bring up difficult feelings. 
Take breaks when you need them. This work matters."

// Avoid: Minimizing
"Great job starting Step 4! Almost done with the steps! 🎉"
```

### Returning After Absence

```
// Good: Welcoming, no judgment
"Welcome back. We're glad you're here."

// Avoid: Guilt-inducing
"It's been 14 days since your last check-in! Let's get back on track!"
```

---

## Accessibility Considerations

### Screen Reader Experience

Every interaction should make sense when read aloud:

```tsx
// ✅ GOOD: Meaningful for screen readers
<TouchableOpacity
  accessibilityLabel="Add new journal entry"
  accessibilityHint="Opens a form to write your thoughts"
>
  <PlusIcon />
</TouchableOpacity>

// ❌ BAD: Unhelpful for screen readers
<TouchableOpacity>
  <PlusIcon />
</TouchableOpacity>
// Screen reader says: "Button"
```

### Color + Text

Never rely on color alone to convey meaning:

```tsx
// ✅ GOOD: Color and text
<View className="bg-red-500/20 p-3 rounded-lg">
  <Text className="text-red-400">⚠️ High craving reported</Text>
</View>

// ❌ BAD: Color only
<View className="bg-red-500 h-4 w-4 rounded-full" />
// What does this mean if you can't see the color?
```

### Touch Targets

All interactive elements should be at least 44x44 points:

```tsx
// ✅ GOOD: Adequate touch target
<TouchableOpacity className="w-12 h-12 items-center justify-center">
  <Icon size={24} />
</TouchableOpacity>

// ❌ BAD: Too small
<TouchableOpacity className="w-6 h-6">
  <Icon size={16} />
</TouchableOpacity>
```

---

## Testing Your Copy

Before shipping any user-facing text, ask:

1. **The Worst Day Test**: Would this help someone in crisis?
2. **The Shame Test**: Could this make someone feel bad about themselves?
3. **The Parent Test**: Would you want your own family member to read this during their recovery?
4. **The Screenshot Test**: If this were screenshotted and shared, would we be proud?

---

## Quick Reference Card

### Always Say
- "Progress, not perfection"
- "Every day counts"
- "You're still here"
- "When you're ready"
- "How can we support you?"
- "Your journey continues"
- "Recovery isn't linear"

### Never Say
- "Streak broken/lost"
- "Start over"
- "You failed"
- "Don't give up"
- "You should..."
- "Don't forget!"
- "Back to zero"

### Always Do
- Preserve total days across relapses
- Offer support, not pressure
- Make emergency access instant
- Celebrate with reflection
- Let users control notifications

### Never Do
- Use leaderboards or comparisons
- Require daily engagement
- Punish missed days
- Use points or XP
- Send guilt-inducing notifications
- Reduce recovery to a game

---

*Last Updated: December 2025*
*Document Version: 1.0*

