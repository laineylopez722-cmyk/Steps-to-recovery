# CLAUDE-FRONTEND.md

Frontend documentation for Steps to Recovery - React Native, Expo, UI components, and accessibility.

## Stack Overview

| Technology       | Version  | Purpose                   |
| ---------------- | -------- | ------------------------- |
| Expo SDK         | ~54.0.30 | Development framework     |
| React            | 19.1.0   | UI library                |
| React Native     | 0.81.5   | Mobile framework          |
| TypeScript       | ~5.9.2   | Type safety (strict mode) |
| React Navigation | Latest   | Navigation                |
| React Query      | ^5.90.15 | Server state              |
| Zustand          | ^5.0.9   | Client state              |

---

## Feature-Based Architecture

```
apps/mobile/src/
├── features/
│   ├── auth/          # Login, signup, onboarding
│   ├── home/          # Dashboard, clean time, check-ins
│   ├── journal/       # Encrypted journaling
│   ├── steps/         # 12-step work tracking
│   ├── meetings/      # Meeting finder, favorites
│   ├── sponsor/       # Sponsor connections
│   ├── emergency/     # Crisis toolkit
│   ├── settings/      # App settings
│   └── profile/       # User profile
├── components/        # Shared UI components
├── contexts/          # React contexts
├── navigation/        # Navigation setup
├── design-system/     # Design tokens & components
├── adapters/          # Platform abstraction
├── hooks/             # Custom hooks
├── utils/             # Utilities
└── lib/              # Third-party integrations
```

### Feature Structure

Each feature contains:

```
features/[feature]/
├── screens/           # Screen components
├── components/        # Feature-specific components
├── hooks/            # Feature-specific hooks
└── index.ts          # Exports
```

---

## Navigation

**Library**: React Navigation 6.x

### Navigation Structure

```
RootNavigator
├── AuthStack (unauthenticated)
│   ├── LoginScreen
│   ├── SignUpScreen
│   └── OnboardingScreen
│
└── MainTabs (authenticated)
    ├── HomeStack
    │   ├── HomeScreen
    │   ├── MorningIntentionScreen
    │   └── EveningPulseScreen
    ├── JournalStack
    │   ├── JournalListScreen
    │   └── JournalEditorScreen
    ├── StepsStack
    │   ├── StepsOverviewScreen
    │   └── StepDetailScreen
    ├── MeetingsStack
    │   ├── MeetingsMapScreen
    │   └── MeetingDetailScreen
    └── ProfileStack
        ├── ProfileScreen
        └── SettingsScreen
```

### Navigation Types

**File**: `src/navigation/types.ts`

```typescript
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Journal: undefined;
  Steps: undefined;
  Meetings: undefined;
  Profile: undefined;
};
```

---

## Design System

**Location**: `src/design-system/`

### Design Tokens

| Token File      | Purpose                  |
| --------------- | ------------------------ |
| `colors.ts`     | Semantic color system    |
| `typography.ts` | Text styles              |
| `spacing.ts`    | Spacing scale (4px base) |
| `radius.ts`     | Border radius            |
| `shadows.ts`    | Shadow presets           |
| `animations.ts` | Animation timing         |

### Color Usage

```typescript
import { colors } from '../design-system/tokens/colors';

// Semantic colors
colors.primary; // Action, interactive
colors.success; // Positive states
colors.warning; // Caution states
colors.error; // Error states
colors.text.primary; // Main text
colors.text.secondary; // Secondary text
colors.background.primary; // Main background
```

### Typography Usage

```typescript
import { typography } from '../design-system/tokens/typography';

<Text style={typography.heading1}>Title</Text>
<Text style={typography.body}>Content</Text>
<Text style={typography.caption}>Small text</Text>
```

### Spacing Usage

```typescript
import { spacing } from '../design-system/tokens/spacing';

<View style={{ padding: spacing.md, marginTop: spacing.lg }}>
  // spacing.xs = 4, spacing.sm = 8, spacing.md = 16, spacing.lg = 24, spacing.xl = 32
</View>
```

---

## Components

### Shared Components

**Location**: `src/components/`

| Component        | Purpose                      |
| ---------------- | ---------------------------- |
| `Button`         | Primary action button        |
| `Input`          | Text input with validation   |
| `Card`           | Container card               |
| `LoadingSpinner` | Loading indicator            |
| `Slider`         | Range slider (mood, craving) |
| `Badge`          | Status badges                |

### Component Pattern

```typescript
interface ButtonProps {
  onPress: () => void;
  label: string;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
}

export function Button({
  onPress,
  label,
  variant = 'primary',
  disabled = false,
  loading = false,
}: ButtonProps): React.ReactElement {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? <ActivityIndicator /> : <Text>{label}</Text>}
    </TouchableOpacity>
  );
}
```

---

## Accessibility (WCAG AAA)

### Required Props

ALL interactive components MUST include:

```typescript
<TouchableOpacity
  accessibilityLabel="Save journal entry"     // REQUIRED
  accessibilityRole="button"                   // REQUIRED
  accessibilityState={{ disabled: isLoading }} // When applicable
  accessibilityHint="Double tap to save"       // When action non-obvious
>
```

### Touch Targets

**Minimum**: 48x48dp

```typescript
const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 16,
  },
});
```

### Color Contrast

**Required**: 7:1 (AAA standard)

| Element            | Required Ratio |
| ------------------ | -------------- |
| Body text          | 7:1            |
| Large text (18pt+) | 4.5:1          |
| Icons/Graphics     | 3:1            |

### Screen Reader Testing

```bash
# iOS VoiceOver
Settings > Accessibility > VoiceOver

# Android TalkBack
Settings > Accessibility > TalkBack
```

### Font Scaling

Support up to 200% font scaling:

- Use flexible layouts (flex)
- Avoid fixed heights for text containers
- Test with system font size at maximum

---

## State Management

### React Query (Server State)

**File**: `src/features/[feature]/hooks/use[Feature].ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useJournalEntries() {
  const { db } = useDatabase();

  return useQuery({
    queryKey: ['journal-entries'],
    queryFn: async () => {
      const entries = await db.getAllAsync<JournalEntry>(
        'SELECT * FROM journal_entries ORDER BY created_at DESC',
      );
      return Promise.all(entries.map(decryptEntry));
    },
    enabled: !!db,
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
  });
}
```

### Query Keys

| Key                         | Data                |
| --------------------------- | ------------------- |
| `['journal-entries']`       | All journal entries |
| `['journal-entries', id]`   | Single entry        |
| `['daily-checkins', date]`  | Check-ins by date   |
| `['step-work', stepNumber]` | Step work by step   |
| `['achievements']`          | User achievements   |

### Zustand (Client State)

**File**: `packages/shared/store/[feature]Store.ts`

```typescript
import { create } from 'zustand';

interface SettingsState {
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  darkMode: false,
  setDarkMode: (enabled) => set({ darkMode: enabled }),
}));
```

---

## Offline-First Patterns

### Storage Adapters

**Location**: `src/adapters/storage/`

| Platform | Storage              | File           |
| -------- | -------------------- | -------------- |
| Mobile   | SQLite (expo-sqlite) | `sqlite.ts`    |
| Web      | IndexedDB            | `indexeddb.ts` |

### Database Context

**File**: `src/contexts/DatabaseContext.tsx`

```typescript
const { db } = useDatabase();

// Query
const entries = await db.getAllAsync<Entry>('SELECT * FROM entries');

// Insert
await db.runAsync('INSERT INTO entries (id, content) VALUES (?, ?)', [id, encryptedContent]);
```

### Offline Data Flow

```
User Action → Encrypt → Store in SQLite → Add to Sync Queue → Sync when online
              ↓
         Decrypt ← Read from SQLite (source of truth)
```

---

## Platform Adapters

### Secure Storage

**Location**: `src/adapters/secureStorage/`

| Platform | Implementation                           |
| -------- | ---------------------------------------- |
| Mobile   | expo-secure-store (Keychain/Keystore)    |
| Web      | IndexedDB (encrypted with session token) |

```typescript
import { secureStorage } from '../adapters/secureStorage';

// Store encryption key
await secureStorage.setItemAsync('encryption_key', key);

// Retrieve encryption key
const key = await secureStorage.getItemAsync('encryption_key');
```

### Network Detection

| Platform | Method                            |
| -------- | --------------------------------- |
| Mobile   | `@react-native-community/netinfo` |
| Web      | `navigator.onLine` + events       |

---

## Contexts

### AuthContext

**File**: `src/contexts/AuthContext.tsx`

```typescript
const { user, signIn, signOut, isLoading } = useAuth();
```

### DatabaseContext

**File**: `src/contexts/DatabaseContext.tsx`

```typescript
const { db, isReady } = useDatabase();
```

### SyncContext

**File**: `src/contexts/SyncContext.tsx`

```typescript
const { sync, isSyncing, lastSyncTime, isOnline } = useSync();
```

---

## Testing

### Component Tests

```bash
# Run all tests
npm test

# Watch mode
cd apps/mobile && npm run test:watch

# Coverage
cd apps/mobile && npm run test:coverage
```

### Test Pattern

```typescript
import { render, fireEvent } from '@testing-library/react-native';

describe('Button', () => {
  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button label="Save" onPress={onPress} />
    );

    fireEvent.press(getByText('Save'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

---

## Performance

### Cold Start Target

**< 2 seconds** - Critical for crisis access during cravings

### FlatList Optimization

```typescript
<FlatList
  data={entries}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
  initialNumToRender={10}
  getItemLayout={getItemLayout}  // If fixed height
/>

const renderItem = useCallback(({ item }) => (
  <MemoizedCard entry={item} />
), []);
```

### Memoization

```typescript
// Expensive component
const MemoizedCard = React.memo(EntryCard);

// Expensive callback
const handleSave = useCallback(() => {
  // ...
}, [dependencies]);

// Expensive computation
const sortedEntries = useMemo(() => entries.sort((a, b) => b.createdAt - a.createdAt), [entries]);
```

---

## Commands

```bash
# Start development server
npm run mobile
# OR: cd apps/mobile && npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Type check
cd apps/mobile && npx tsc --noEmit

# Run tests
npm test
```

---

## Anti-Patterns to Avoid

- **ScrollView with many items** → Use FlatList
- **Inline functions in render** → Extract and memoize
- **Missing accessibility props** → Always include label, role, state
- **Direct console.log** → Use logger utility
- **AsyncStorage for secrets** → Use SecureStore
- **Type `any`** → Use explicit types or `unknown`
