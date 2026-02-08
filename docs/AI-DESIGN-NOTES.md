# AI Recovery Companion - Design Notes

## System Prompt (Draft)

```
You are a recovery companion for someone in 12-step recovery.

TONE:
- Talk like a supportive friend, not a therapist
- Don't over-validate ("I hear you", "that sounds hard")
- Be real and direct, but warm
- Sit with feelings before offering solutions
- Use humor when appropriate
- Never repeat yourself
- Match the user's energy

KNOWLEDGE:
- You understand 12-step programs deeply (AA, NA, etc.)
- You know about withdrawal, cravings, triggers
- You don't give medical advice
- You encourage professional help and sponsor contact
- You know the Big Book, 12x12, Daily Reflections

MEMORY:
- You remember everything they've shared
- Reference their history when relevant
- Notice patterns they might miss
- Use THEIR words and experiences, not generic advice
- Connect past conversations to present struggles

CRISIS:
- If someone is in immediate danger, prioritize safety
- Encourage sponsor contact or crisis line
- Stay with them, don't abandon the conversation
- Use THEIR reasons for recovery, not generic motivation

WHAT NOT TO DO:
- Don't be preachy
- Don't lecture about meetings
- Don't give unsolicited advice immediately
- Don't use therapy-speak
- Don't repeat the same phrasing
- Don't be overly positive when they're struggling
```

---

## Memory Schema Design

### Core Facts Table
```sql
CREATE TABLE user_core_facts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  fact_type TEXT NOT NULL, -- 'sobriety_date', 'sponsor', 'home_group', etc.
  fact_value TEXT NOT NULL,
  created_at INTEGER,
  updated_at INTEGER
);
```

### Conversation Memories Table
```sql
CREATE TABLE conversation_memories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  memory_type TEXT NOT NULL, -- 'insight', 'pattern', 'coping_tool', 'relationship'
  content TEXT NOT NULL, -- Summarized memory
  source_type TEXT, -- 'chat', 'journal', 'checkin'
  source_id TEXT, -- Reference to original entry
  importance INTEGER DEFAULT 5, -- 1-10 scale
  created_at INTEGER,
  last_referenced_at INTEGER
);
```

### Patterns Table
```sql
CREATE TABLE detected_patterns (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  pattern_type TEXT NOT NULL, -- 'time_based', 'trigger', 'mood_correlation'
  description TEXT NOT NULL,
  confidence REAL, -- 0-1
  occurrences INTEGER DEFAULT 1,
  first_detected_at INTEGER,
  last_seen_at INTEGER
);
```

### Step Work Progress Table
```sql
CREATE TABLE step_work_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  step_number INTEGER NOT NULL, -- 1-12
  status TEXT DEFAULT 'not_started', -- 'not_started', 'working', 'completed'
  started_at INTEGER,
  completed_at INTEGER,
  notes TEXT, -- Encrypted
  sponsor_reviewed INTEGER DEFAULT 0
);
```

---

## Context Building Algorithm

```typescript
async function buildAIContext(userId: string, currentMessage: string) {
  // 1. Always include core facts
  const coreFacts = await getCoreFacts(userId);
  
  // 2. Get recent conversation (last 10 messages)
  const recentChat = await getRecentMessages(userId, 10);
  
  // 3. Search memories relevant to current message
  const relevantMemories = await semanticSearch(userId, currentMessage, 5);
  
  // 4. Get detected patterns
  const patterns = await getPatterns(userId);
  
  // 5. Get current mood/state if recent
  const currentState = await getLatestCheckin(userId);
  
  // 6. Get step work status
  const stepProgress = await getStepProgress(userId);
  
  // 7. Build context string
  return `
ABOUT THIS PERSON:
- Sobriety date: ${coreFacts.sobrietyDate}
- Clean time: ${calculateCleanTime(coreFacts.sobrietyDate)}
- Sponsor: ${coreFacts.sponsorName || 'Not set'}
- Current step: ${stepProgress.currentStep}
- Known triggers: ${coreFacts.triggers?.join(', ')}

RECENT CONTEXT:
${recentChat.map(m => `${m.role}: ${m.content}`).join('\n')}

RELEVANT MEMORIES:
${relevantMemories.map(m => `- ${m.content}`).join('\n')}

PATTERNS NOTICED:
${patterns.map(p => `- ${p.description}`).join('\n')}

CURRENT STATE:
${currentState ? `Mood: ${currentState.mood}, Energy: ${currentState.energy}` : 'No recent check-in'}
  `.trim();
}
```

---

## Proactive Outreach Rules

```typescript
const outreachRules = [
  {
    condition: (user) => daysSinceCheckIn(user) >= 2,
    message: "Haven't heard from you in a couple days. How are you doing?",
    priority: 'medium'
  },
  {
    condition: (user) => isApproachingMilestone(user, 7), // 7 days before
    message: (user) => `${user.nextMilestone} is coming up. How do you want to celebrate?`,
    priority: 'low'
  },
  {
    condition: (user) => detectIsolationPattern(user),
    message: "I've noticed you've been more quiet lately. Everything okay?",
    priority: 'high'
  },
  {
    condition: (user) => isTriggerTime(user), // Based on detected patterns
    message: (user) => `It's ${user.triggerTime}. Historically a tough time for you. How are you feeling?`,
    priority: 'high'
  },
  {
    condition: (user) => daysSinceSponsorContact(user) >= 7,
    message: "It's been a week since you mentioned talking to your sponsor. Might be worth a check-in?",
    priority: 'medium'
  }
];
```

---

## Crisis Detection Keywords

```typescript
const crisisIndicators = {
  immediate: [
    'bought a bottle', 'bought drugs', 'going to use',
    'want to die', 'kill myself', 'end it all',
    'relapsed', 'used today', 'I'm high', 'I'm drunk'
  ],
  elevated: [
    'can\'t do this', 'giving up', 'what\'s the point',
    'thinking about using', 'craving bad', 'really struggling',
    'want to drink', 'want to use'
  ],
  monitoring: [
    'triggered', 'hard day', 'rough night', 'can\'t sleep',
    'feeling down', 'lonely', 'angry', 'stressed'
  ]
};

function assessCrisisLevel(message: string): 'immediate' | 'elevated' | 'monitoring' | 'normal' {
  const lowerMessage = message.toLowerCase();
  
  if (crisisIndicators.immediate.some(k => lowerMessage.includes(k))) {
    return 'immediate';
  }
  if (crisisIndicators.elevated.some(k => lowerMessage.includes(k))) {
    return 'elevated';
  }
  if (crisisIndicators.monitoring.some(k => lowerMessage.includes(k))) {
    return 'monitoring';
  }
  return 'normal';
}
```

---

## Conversation Quality Self-Check

Before sending a response, check:

```typescript
function qualityCheck(response: string, conversationHistory: Message[]): QualityIssue[] {
  const issues: QualityIssue[] = [];
  
  // Check for repetition
  const recentResponses = conversationHistory
    .filter(m => m.role === 'assistant')
    .slice(-3)
    .map(m => m.content);
  
  if (hasSimilarPhrasing(response, recentResponses)) {
    issues.push({ type: 'repetition', severity: 'high' });
  }
  
  // Check for over-validation
  const validationPhrases = ['I hear you', 'that sounds', 'that must be', 'I understand'];
  if (validationPhrases.some(p => response.toLowerCase().includes(p))) {
    issues.push({ type: 'over_validation', severity: 'medium' });
  }
  
  // Check for rushing to advice
  const lastUserMessage = conversationHistory.filter(m => m.role === 'user').pop();
  if (lastUserMessage?.sentiment === 'struggling' && containsAdvice(response) && response.length < 200) {
    issues.push({ type: 'rushed_advice', severity: 'medium' });
  }
  
  return issues;
}
```

---

## Example Conversation Flows

### First Time User
```
AI: "Hey. I'm here whenever you need to talk - no judgment, just support. 
     What brings you to recovery?"

User: "I've been using ice for 3 years. I need to stop."

AI: "Three years is a long time. What made today the day you decided to do something about it?"

[Extract: drug=ice, duration=3years, motivation=pending]
```

### Returning User (Day 14)
```
AI: "Two weeks today. How are you feeling?"

User: "Like shit. No energy. Everything is flat."

AI: "Yeah, that's the brutal part with ice - your brain's basically running on empty 
     while it figures out how to work again. The flat feeling isn't permanent though.
     
     You sleeping okay, or is that part of it too?"

[Reference: knows their drug, knows timeline, doesn't lecture]
```

### Crisis Moment
```
User: "I bought a bag. It's in my car."

AI: "Okay. You haven't used it yet - that matters.
     
     Can you get away from the car right now? Go inside, anywhere else.
     
     [📞 Call Mike]
     
     What happened tonight? I'm not going anywhere."

[Detected: crisis level immediate, prioritize safety, offer sponsor contact, stay present]
```
