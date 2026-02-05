# Competitor Analysis - 12 Step Companion
**Site**: https://12-step-companion.vercel.app/  
**Analyzed**: 2026-02-06  
**Purpose**: Extract learnings and identify feature gaps

---

## 🎯 Key Features Observed

### **1. Risk Pattern Detection System** ⭐⭐⭐⭐⭐
**What it is**: AI/ML-driven alerts when user behavior indicates risk
- **Example**: "I noticed you haven't journaled in 3 days"
- **Actions**: Suggested tools, feedback buttons ("This helped" / "Didn't help")
- **Design**: Amber alert cards at top of dashboard
- **Impact**: Proactive intervention vs. reactive support

**Our Status**: ❌ We don't have this
**Priority**: HIGH - This is their differentiator
**Implementation**: 6-8 hours (pattern detection + alert system)

---

### **2. "Recovery Rhythm" - Three Daily Check-ins** ⭐⭐⭐⭐⭐
Structured daily routine with three touchpoints:

#### **a) Set the Tone (Morning)**
- Pick daily intention from presets or custom
- Options: "Stay Clean", "Stay Connected", "Be Gentle with Myself"
- Optional reminder setting
- **Our equivalent**: Morning Intention (✅ we have this)

#### **b) Pulse Check (Midday)**
- Mood slider (Low → Great)
- Craving slider (None → Intense)
- Context tags: Alone, With people, Bored, Stressed, Hungry
- **Our equivalent**: Daily Check-ins (✅ we have this, plus ours is better with JFT)

#### **c) Tiny Inventory (Evening)**
- Yes/No/Close call: "Did I stay clean today?"
- Checkboxes: Meetings, Sponsor, Recovery Friends
- Gratitude prompt (optional)
- Tomorrow improvement prompt (optional)
- **Our equivalent**: Evening Pulse (✅ we have this)

**Comparison**: We have similar features but theirs are more structured/prescriptive

---

### **3. Clean Time Display** ⭐⭐⭐⭐
**What it shows**:
- Large circular progress ring with days
- Breakdown: Weeks, Months, Day streak
- "Streak Intact" badge
- Next milestone countdown (e.g., "30 days")

**Our Status**: ✅ We have clean time counter
**Improvement opportunity**: Add milestone countdown + visual progress ring

---

### **4. Step Progress Visualization** ⭐⭐⭐⭐
**Design**:
- "1/12" large display
- "CURRENT STEP" label
- "STEPS DONE" counter with "Marked complete with your sponsor"
- Visual cards for each step in overview

**Our Status**: ✅ We have steps, but less visual
**Improvement**: Add progress fraction (1/12) to home screen

---

### **5. Today Shortcuts** ⭐⭐⭐⭐
**What it is**: Curated quick actions on home screen
- Step Work - "Continue Step 1"
- Journal - "Capture what actually happened today"
- Emergency - "Open your support plan instantly"
- Insights - "Patterns, triggers, and progress view"

**Our Status**: ✅ Similar - we have quick actions on HomeScreenModern
**Design note**: Theirs use colorful icons + descriptive subtitles

---

### **6. Mood Analytics / Insights** ⭐⭐⭐⭐
**Screen**: "Track your mood patterns and journal activity"
- Empty state: "Start journaling to track your mood and see insights"
- Presumably shows graphs/trends when populated

**Our Status**: ❌ We don't have analytics/insights yet
**Priority**: MEDIUM - Nice to have, not critical for MVP
**Implementation**: 8-10 hours (charts, trend analysis)

---

### **7. Emergency Tab** ⭐⭐⭐⭐
Dedicated emergency section in bottom nav

**Our Status**: ✅ We have Emergency Toolkit (comprehensive)
**Note**: Theirs is more prominent (own nav tab vs. our card-based access)

---

## 🎨 Design Patterns Worth Adopting

### **Visual Hierarchy**
- Large, bold numbers for key metrics (16 days clean)
- Circular progress indicators
- Color-coded badges (Streak Intact = green)
- Collapsible sections for dense content

### **Color Scheme**
- Dark blue/navy background (#1a1f2e)
- Teal/cyan for primary actions (#00d4aa)
- Amber for warnings/alerts
- Purple accents
- High contrast, WCAG AAA compliant

### **Micro-Copy**
- Encouraging, non-judgmental tone
- "Every day clean is a victory worth celebrating"
- Action-oriented button labels
- Descriptive subtitles on shortcuts

### **Empty States**
- Friendly emoji (😊)
- Clear call-to-action
- Encouraging copy (not just "No data")

---

## 📊 Feature Comparison Matrix

| Feature | Them | Us | Winner |
|---------|------|----|----|
| Risk Detection | ✅ AI-driven alerts | ❌ None | **Them** |
| Daily Check-ins | ✅ 3 structured | ✅ Morning/Evening + JFT | **Tie** |
| Clean Time | ✅ Visual + milestones | ✅ Counter | **Them** (more visual) |
| Step Work | ✅ 12 steps | ✅ 12 steps + 380 questions | **Us** (more content) |
| Journal | ✅ Basic | ✅ Encrypted, tags, mood | **Us** (more features) |
| Emergency | ✅ Dedicated tab | ✅ Comprehensive toolkit | **Us** (more tools) |
| Sponsor Sharing | ❌ Not visible | ✅ Full feature | **Us** |
| Meeting Check-ins | ❌ Not visible | ✅ Full gamification | **Us** |
| JFT Daily Reading | ❌ Not visible | ✅ Full feature | **Us** |
| Safe Dial | ❌ Not visible | ✅ Building now | **Us** |
| Analytics/Insights | ✅ Mood tracking | ❌ None yet | **Them** |
| Accessibility | ❓ Unknown | ✅ 238+ components | **Likely Us** |

**Overall**: We have more features, but they have better risk detection + analytics

---

## 🚀 Quick Wins to Adopt

### **1. Risk Pattern Alerts** (6-8 hours)
Detect when user hasn't:
- Journaled in 3+ days
- Checked in for 2+ days
- Attended meeting in 7+ days
- Contacted sponsor in 5+ days

Show amber alert card with:
- Pattern description
- Suggested action (with link)
- Feedback buttons

**Priority**: HIGH - This is a killer feature

---

### **2. Visual Clean Time Enhancements** (2 hours)
Add to HomeScreenModern:
- Circular progress ring
- Next milestone countdown
- "Streak Intact" badge

**Priority**: MEDIUM - Visual appeal

---

### **3. Mood Analytics Dashboard** (8-10 hours)
Create Insights screen showing:
- Mood trends (line chart)
- Craving patterns (bar chart)
- Journal frequency (calendar heatmap)
- Correlation insights (e.g., "Mood improves after meetings")

**Priority**: MEDIUM - Post-MVP

---

### **4. Step Progress Visual** (1 hour)
Add "1/12 CURRENT STEP" badge to home screen

**Priority**: LOW - Easy win

---

## ❌ What NOT to Copy

### **1. Risk Detection Spam**
- Their alerts repeat 3 times on screen (redundant)
- Could be annoying if triggered too frequently

**Our approach**: One alert max, dismissible

### **2. Overly Prescriptive Flow**
- Their "Recovery Rhythm" forces a specific structure
- Some users might prefer flexibility

**Our approach**: Offer structure but allow customization

### **3. Missing Sponsor Features**
- They don't seem to have sponsor connection/sharing
- This is our competitive advantage

---

## 💡 Unique Features We Have (They Don't)

1. ✅ **Sponsor Sharing** - Full encrypted entry sharing
2. ✅ **Meeting Check-ins** - 90-in-90 gamification
3. ✅ **JFT Daily Reading** - Spiritual content
4. ✅ **Safe Dial** - Crisis intervention for risky contacts
5. ✅ **Comprehensive Accessibility** - WCAG AA compliant
6. ✅ **End-to-End Encryption** - Privacy-first

**Positioning**: We're more feature-rich and privacy-focused

---

## 🎯 Recommended Action Items

### **Tier 1 (Add to Current Sprint)**:
1. **Risk Pattern Detection** - 6-8 hours - HIGH VALUE
   - Detect inactivity patterns
   - Show proactive alerts
   - Suggest interventions

### **Tier 2 (Post-MVP)**:
2. **Mood Analytics Dashboard** - 8-10 hours
3. **Visual Clean Time Enhancements** - 2 hours
4. **Step Progress Badge** - 1 hour

### **Tier 3 (Future)**:
5. **ML-powered risk prediction** - 20+ hours (requires data)

---

## 🏆 Competitive Positioning

**Their Strength**: Risk detection + analytics  
**Our Strength**: Feature breadth + privacy + sponsor connection

**Market Position**:
- **Them**: "Smart recovery companion with AI insights"
- **Us**: "Comprehensive recovery toolkit with sponsor support"

**Target Users**:
- **Them**: Solo recovery, data-driven users
- **Us**: Users with sponsors, privacy-conscious, feature-rich experience

---

## 📝 Design Inspiration to Adopt

1. **Circular progress indicators** - More visually engaging than bars
2. **Amber alert cards** - Clear warning color (not red = panic, not green = safe)
3. **Collapsible sections** - Reduces scroll fatigue
4. **Large metric displays** - Makes numbers feel important
5. **Empty state emojis** - Friendly, not sterile
6. **Action subtitles** - "Continue Step 1" is better than just "Steps"

---

## ✅ Final Verdict

**What to build immediately**:
- Risk Pattern Detection (game-changer)

**What to save for later**:
- Analytics dashboard (nice to have)
- Visual enhancements (polish)

**What to ignore**:
- Repetitive alerts
- Overly prescriptive flows

**Our competitive advantage remains**:
- Sponsor sharing
- Meeting gamification  
- Safe Dial protection
- Privacy-first encryption
- Comprehensive accessibility

**We're building a better product.** Their risk detection is the one feature we should absolutely add. Everything else, we're ahead. 💪
