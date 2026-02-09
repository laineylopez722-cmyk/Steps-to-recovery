# Recovery Companion - Coding Standards
## Enforced Patterns & Anti-Patterns

---

## TypeScript Standards

### Strict Mode (Mandatory)

The project uses `"strict": true` in `tsconfig.json`. Never compromise on type safety.

```typescript
// ✅ CORRECT: Explicit types
interface JournalEntry {
  id: string;
  type: 'freeform' | 'step-work' | 'meeting-reflection' | 'daily-checkin';
  content: string;
  moodBefore?: number;
  moodAfter?: number;
  cravingLevel?: number;
  emotionTags: string[];
  stepNumber?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ✅ CORRECT: Typed function parameters and returns
async function createEntry(
  entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>
): Promise<JournalEntry> {
  // implementation
}

// ❌ WRONG: Using 'any'
function processData(data: any): any {
  return data.something;
}

// ❌ WRONG: Implicit any
function handleEntry(entry) {
  return entry.content;
}
```

### Type Unions Over Enums

Prefer union types for better tree-shaking and TypeScript inference.

```typescript
// ✅ CORRECT: Union types
type JournalType = 'freeform' | 'step-work' | 'meeting-reflection' | 'daily-checkin';
type ProgramType = '12-step-aa' | '12-step-na' | 'smart' | 'custom';
type MilestoneType = 'time-based' | 'step-completion' | 'personal' | 'meeting';

// ❌ AVOID: Enums (larger bundle, less flexible)
enum JournalType {
  Freeform = 'freeform',
  StepWork = 'step-work',
  // ...
}
```

### Null Handling

Use explicit null checks, never use non-null assertion unless absolutely certain.

```typescript
// ✅ CORRECT: Safe null handling
const entry = await getEntry(id);
if (!entry) {
  return null;
}
const content = await decrypt(entry.content);

// ✅ CORRECT: Optional chaining
const mood = entry?.moodBefore ?? 5;

// ❌ WRONG: Non-null assertion (can crash)
const entry = await getEntry(id);
const content = entry!.content; // Dangerous!
```

---

## NativeWind (Tailwind) Patterns

### Component Styling

Always use NativeWind `className` for styling. Never use `StyleSheet.create()`.

```tsx
// ✅ CORRECT: NativeWind className
import { View, Text, TouchableOpacity } from 'react-native';

export function JournalCard({ entry }: { entry: JournalEntry }) {
  return (
    <View className="bg-slate-800 rounded-xl p-4 mb-3">
      <Text className="text-lg font-semibold text-white mb-2">
        {entry.title}
      </Text>
      <Text className="text-slate-400 text-sm">
        {formatDate(entry.createdAt)}
      </Text>
      <View className="flex-row flex-wrap gap-2 mt-3">
        {entry.emotionTags.map(tag => (
          <View key={tag} className="bg-purple-600/20 px-3 py-1 rounded-full">
            <Text className="text-purple-400 text-xs">{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ❌ WRONG: StyleSheet
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  // ... more styles
});
```

### Responsive Design

Use NativeWind's responsive prefixes for different screen sizes.

```tsx
// ✅ CORRECT: Responsive classes
<View className="p-4 md:p-6 lg:p-8">
  <Text className="text-2xl md:text-3xl lg:text-4xl font-bold">
    Dashboard
  </Text>
</View>
```

### Dark Mode Support

The app uses dark mode by default. Use appropriate color classes.

```tsx
// ✅ CORRECT: Dark-mode appropriate colors
<View className="bg-slate-900">
  <Text className="text-white">Primary text</Text>
  <Text className="text-slate-400">Secondary text</Text>
  <Text className="text-slate-500">Muted text</Text>
</View>

// ✅ CORRECT: Color with opacity
<View className="bg-purple-600/20 border border-purple-500/30">
  <Text className="text-purple-400">Accent element</Text>
</View>

// ❌ WRONG: Light-mode colors in dark app
<View className="bg-white">
  <Text className="text-gray-900">This doesn't fit the theme</Text>
</View>
```

### Color Palette (Design Tokens)

```tsx
// Primary backgrounds
className="bg-slate-900"    // Main background
className="bg-slate-800"    // Card background
className="bg-slate-700"    // Elevated elements

// Text colors
className="text-white"      // Primary text
className="text-slate-300"  // Secondary text
className="text-slate-400"  // Muted text
className="text-slate-500"  // Disabled text

// Accent colors
className="bg-purple-600"   // Primary action
className="bg-emerald-500"  // Success/positive
className="bg-amber-500"    // Warning
className="bg-red-500"      // Danger/crisis

// Mood colors (consistent across app)
const moodColors = {
  1: 'bg-red-500',      // Very low
  2: 'bg-red-400',
  3: 'bg-orange-500',
  4: 'bg-orange-400',
  5: 'bg-yellow-500',   // Neutral
  6: 'bg-lime-400',
  7: 'bg-green-400',
  8: 'bg-emerald-400',
  9: 'bg-teal-400',
  10: 'bg-cyan-400',    // Excellent
};
```

---

## Zustand Store Patterns

### Store Structure

Each store should follow this pattern:

```typescript
// lib/store/journalStore.ts
import { create } from 'zustand';
import { db } from '@/lib/db';
import { encrypt, decrypt } from '@/lib/encryption';

// 1. Define the interface
interface JournalState {
  // State
  entries: JournalEntry[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  
  // Actions
  loadEntries: () => Promise<void>;
  addEntry: (entry: CreateJournalEntry) => Promise<void>;
  updateEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  clearError: () => void;
}

// 2. Create the store
export const useJournalStore = create<JournalState>((set, get) => ({
  // Initial state
  entries: [],
  isLoading: false,
  error: null,
  searchQuery: '',

  // Actions with error handling
  loadEntries: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const rawEntries = await db.select().from(journalEntries);
      
      // Decrypt content for each entry
      const decryptedEntries = await Promise.all(
        rawEntries.map(async (entry) => ({
          ...entry,
          content: await decrypt(entry.content),
        }))
      );
      
      set({ entries: decryptedEntries, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load entries',
        isLoading: false 
      });
    }
  },

  addEntry: async (entry) => {
    try {
      set({ isLoading: true, error: null });
      
      const id = generateId();
      const now = new Date();
      const encryptedContent = await encrypt(entry.content);
      
      const newEntry: JournalEntry = {
        id,
        ...entry,
        content: encryptedContent,
        createdAt: now,
        updatedAt: now,
      };
      
      await db.insert(journalEntries).values(newEntry);
      
      // Optimistic update with decrypted content for display
      set((state) => ({
        entries: [{ ...newEntry, content: entry.content }, ...state.entries],
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add entry',
        isLoading: false 
      });
    }
  },

  // ... other actions follow same pattern

  setSearchQuery: (query) => set({ searchQuery: query }),
  clearError: () => set({ error: null }),
}));
```

### Store Usage in Components

```tsx
// ✅ CORRECT: Select only what you need
function JournalList() {
  const entries = useJournalStore((state) => state.entries);
  const isLoading = useJournalStore((state) => state.isLoading);
  const loadEntries = useJournalStore((state) => state.loadEntries);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  if (isLoading) return <LoadingState />;

  return (
    <FlatList
      data={entries}
      renderItem={({ item }) => <JournalCard entry={item} />}
      keyExtractor={(item) => item.id}
    />
  );
}

// ❌ WRONG: Subscribing to entire store (causes unnecessary re-renders)
function JournalList() {
  const store = useJournalStore(); // Bad: re-renders on ANY state change
  // ...
}
```

### Multiple Stores Pattern

Keep stores focused on single domains:

```typescript
// ✅ CORRECT: Separate stores for separate concerns
useProfileStore     // Sobriety profile, date, program type
useJournalStore     // Journal entries
useCheckinStore     // Daily check-ins
useMeetingStore     // Meeting logs
useVaultStore       // Motivation vault items
useCapsuleStore     // Time capsules
useSettingsStore    // App settings
useAuthStore        // Authentication state

// ❌ WRONG: One giant store
useAppStore({
  profile: {...},
  journal: {...},
  checkins: {...},
  meetings: {...},
  // ... everything in one place
});
```

---

## Database Patterns (expo-sqlite)

### Query Patterns

```typescript
// lib/db/client.ts
import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';

const DB_NAME = 'recovery_companion.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  
  db = await SQLite.openDatabaseAsync(DB_NAME);
  
  // Run migrations
  await runMigrations(db);
  
  return db;
}

// ✅ CORRECT: Parameterized queries (prevent SQL injection)
export async function getEntryById(id: string): Promise<JournalEntry | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<JournalEntry>(
    'SELECT * FROM journal_entries WHERE id = ?',
    [id]
  );
  return result;
}

// ✅ CORRECT: Transactions for multiple operations
export async function createEntryWithTags(
  entry: JournalEntry,
  tags: string[]
): Promise<void> {
  const db = await getDatabase();
  
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO journal_entries (id, type, content, created_at) VALUES (?, ?, ?, ?)',
      [entry.id, entry.type, entry.content, entry.createdAt.toISOString()]
    );
    
    for (const tag of tags) {
      await db.runAsync(
        'INSERT INTO emotion_tags (id, entry_id, tag) VALUES (?, ?, ?)',
        [generateId(), entry.id, tag]
      );
    }
  });
}

// ❌ WRONG: String interpolation (SQL injection risk)
async function unsafeQuery(userInput: string) {
  const result = await db.getAllAsync(
    `SELECT * FROM entries WHERE content LIKE '%${userInput}%'` // DANGEROUS!
  );
}
```

### Migration Pattern

```typescript
// lib/db/migrations.ts
interface Migration {
  version: number;
  up: (db: SQLite.SQLiteDatabase) => Promise<void>;
}

const migrations: Migration[] = [
  {
    version: 1,
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS journal_entries (
          id TEXT PRIMARY KEY NOT NULL,
          type TEXT NOT NULL,
          content TEXT NOT NULL,
          mood_before INTEGER,
          mood_after INTEGER,
          craving_level INTEGER,
          step_number INTEGER,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_journal_created 
        ON journal_entries(created_at);
        
        CREATE INDEX IF NOT EXISTS idx_journal_type 
        ON journal_entries(type);
      `);
    },
  },
  // Add new migrations here
];

export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  // Create migrations table if not exists
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL
    )
  `);
  
  // Get current version
  const current = await db.getFirstAsync<{ version: number }>(
    'SELECT MAX(version) as version FROM migrations'
  );
  const currentVersion = current?.version ?? 0;
  
  // Run pending migrations
  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      await migration.up(db);
      await db.runAsync(
        'INSERT INTO migrations (version, applied_at) VALUES (?, ?)',
        [migration.version, new Date().toISOString()]
      );
    }
  }
}
```

---

## Encryption Patterns

### Core Encryption Functions

```typescript
// lib/encryption/index.ts
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const KEY_ALIAS = 'encryption_key';

// Get or create encryption key
export async function getEncryptionKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(KEY_ALIAS, {
    requireAuthentication: true,
  });
  
  if (!key) {
    // Generate new key
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    key = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    await SecureStore.setItemAsync(KEY_ALIAS, key, {
      requireAuthentication: true,
    });
  }
  
  return key;
}

// ✅ CORRECT: AES-256 encryption (production-ready)
export async function encrypt(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  // Implementation using proper AES-256-GCM
  // Returns base64-encoded ciphertext
}

export async function decrypt(ciphertext: string): Promise<string> {
  const key = await getEncryptionKey();
  // Implementation using proper AES-256-GCM
  // Returns original plaintext
}
```

### When to Encrypt

```typescript
// ✅ ENCRYPT: User-generated sensitive content
await encrypt(journalEntry.content);
await encrypt(dailyCheckin.gratitude);
await encrypt(meetingLog.keyTakeaways);
await encrypt(vaultItem.content);
await encrypt(timeCapsule.message);
await encrypt(relapseRecord.reflection);

// ❌ DO NOT ENCRYPT: Numeric/non-sensitive data
// These are stored as plain values
journalEntry.moodBefore;      // Just a number 1-10
dailyCheckin.cravingLevel;    // Just a number 0-10
milestone.achievedAt;         // Just a date
appSettings.checkInTime;      // Just a time string
```

---

## Accessibility Requirements

### Every Interactive Element

```tsx
// ✅ CORRECT: Full accessibility props
<TouchableOpacity
  onPress={handlePress}
  accessibilityLabel="Add new journal entry"
  accessibilityRole="button"
  accessibilityHint="Opens the journal entry creation form"
  accessibilityState={{ disabled: isLoading }}
>
  <PlusIcon size={24} color="white" />
</TouchableOpacity>

// ✅ CORRECT: Text input accessibility
<TextInput
  value={content}
  onChangeText={setContent}
  accessibilityLabel="Journal entry content"
  accessibilityHint="Write your thoughts here"
  placeholder="What's on your mind?"
  multiline
/>

// ✅ CORRECT: Slider accessibility
<Slider
  value={mood}
  onValueChange={setMood}
  minimumValue={1}
  maximumValue={10}
  accessibilityLabel={`Mood level: ${mood} out of 10`}
  accessibilityRole="adjustable"
  accessibilityActions={[
    { name: 'increment', label: 'Increase mood' },
    { name: 'decrement', label: 'Decrease mood' },
  ]}
/>
```

### Screen Reader Announcements

```tsx
// For important state changes
import { AccessibilityInfo } from 'react-native';

// ✅ Announce important changes
const handleSave = async () => {
  await saveEntry();
  AccessibilityInfo.announceForAccessibility('Journal entry saved successfully');
};

// ✅ Announce errors
const handleError = (error: string) => {
  AccessibilityInfo.announceForAccessibility(`Error: ${error}`);
};
```

### Grouping Related Elements

```tsx
// ✅ CORRECT: Group related content
<View 
  accessible={true}
  accessibilityLabel={`Journal entry from ${formatDate(entry.createdAt)}. Mood: ${entry.mood}. ${entry.preview}`}
>
  <Text>{formatDate(entry.createdAt)}</Text>
  <Text>{entry.preview}</Text>
  <MoodIndicator mood={entry.mood} />
</View>
```

---

## Component Patterns

### Functional Components with TypeScript

```tsx
// ✅ CORRECT: Typed props interface
interface JournalCardProps {
  entry: JournalEntry;
  onPress?: () => void;
  onLongPress?: () => void;
  showMood?: boolean;
}

export function JournalCard({ 
  entry, 
  onPress, 
  onLongPress,
  showMood = true 
}: JournalCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityLabel={`Journal entry: ${entry.preview}`}
      accessibilityRole="button"
      className="bg-slate-800 rounded-xl p-4 mb-3"
    >
      {/* Component content */}
    </TouchableOpacity>
  );
}
```

### Custom Hooks Pattern

```typescript
// lib/hooks/useSobriety.ts
import { useMemo } from 'react';
import { useProfileStore } from '@/lib/store/profileStore';

interface SobrietyInfo {
  days: number;
  hours: number;
  minutes: number;
  totalDays: number;
  nextMilestone: Milestone | null;
  daysToNextMilestone: number;
}

export function useSobriety(): SobrietyInfo {
  const profile = useProfileStore((state) => state.profile);
  const relapses = useProfileStore((state) => state.relapses);
  
  return useMemo(() => {
    if (!profile?.sobrietyDate) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        totalDays: 0,
        nextMilestone: null,
        daysToNextMilestone: 0,
      };
    }
    
    const now = new Date();
    const sobrietyDate = new Date(profile.sobrietyDate);
    const diff = now.getTime() - sobrietyDate.getTime();
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    // Calculate total days across all sobriety periods
    const totalDays = calculateTotalSoberDays(profile.sobrietyDate, relapses);
    
    // Find next milestone
    const { nextMilestone, daysToNextMilestone } = findNextMilestone(days);
    
    return {
      days,
      hours,
      minutes,
      totalDays,
      nextMilestone,
      daysToNextMilestone,
    };
  }, [profile, relapses]);
}
```

---

## Error Handling

### Try-Catch Pattern

```typescript
// ✅ CORRECT: Comprehensive error handling
async function saveEntry(entry: CreateJournalEntry): Promise<Result<JournalEntry>> {
  try {
    // Validate input
    if (!entry.content.trim()) {
      return { success: false, error: 'Entry content cannot be empty' };
    }
    
    // Encrypt content
    const encryptedContent = await encrypt(entry.content);
    
    // Save to database
    const newEntry = await db.insert(journalEntries).values({
      id: generateId(),
      ...entry,
      content: encryptedContent,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    return { success: true, data: newEntry };
    
  } catch (error) {
    console.error('Failed to save entry:', error);
    
    // Return user-friendly error
    if (error instanceof EncryptionError) {
      return { success: false, error: 'Unable to secure your entry. Please try again.' };
    }
    
    if (error instanceof DatabaseError) {
      return { success: false, error: 'Unable to save. Please check your storage.' };
    }
    
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}

// Result type for type-safe error handling
type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string };
```

### Error Boundary

```tsx
// components/common/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <View className="flex-1 items-center justify-center bg-slate-900 p-6">
          <Text className="text-2xl font-bold text-white mb-4">
            Something went wrong
          </Text>
          <Text className="text-slate-400 text-center mb-6">
            We're sorry, but something unexpected happened. Your data is safe.
          </Text>
          <TouchableOpacity
            onPress={this.handleReset}
            className="bg-purple-600 px-6 py-3 rounded-lg"
            accessibilityLabel="Try again"
            accessibilityRole="button"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
```

---

## Testing Patterns

### Unit Test Structure

```typescript
// __tests__/lib/encryption.test.ts
import { encrypt, decrypt } from '@/lib/encryption';

describe('Encryption', () => {
  describe('encrypt', () => {
    it('should encrypt plaintext to different ciphertext', async () => {
      const plaintext = 'My private journal entry';
      const ciphertext = await encrypt(plaintext);
      
      expect(ciphertext).not.toBe(plaintext);
      expect(ciphertext).toBeTruthy();
    });
    
    it('should produce different ciphertext for same input', async () => {
      const plaintext = 'Test content';
      const cipher1 = await encrypt(plaintext);
      const cipher2 = await encrypt(plaintext);
      
      // Due to random IV, same plaintext should produce different ciphertext
      expect(cipher1).not.toBe(cipher2);
    });
  });
  
  describe('decrypt', () => {
    it('should decrypt ciphertext back to original plaintext', async () => {
      const original = 'My secret thoughts';
      const encrypted = await encrypt(original);
      const decrypted = await decrypt(encrypted);
      
      expect(decrypted).toBe(original);
    });
    
    it('should handle empty strings', async () => {
      const encrypted = await encrypt('');
      const decrypted = await decrypt(encrypted);
      
      expect(decrypted).toBe('');
    });
    
    it('should handle unicode characters', async () => {
      const original = 'Recovery is possible 🌟 一日一日';
      const encrypted = await encrypt(original);
      const decrypted = await decrypt(encrypted);
      
      expect(decrypted).toBe(original);
    });
  });
});
```

---

## File Naming Conventions

```
Components:     PascalCase.tsx     (SobrietyCounter.tsx)
Hooks:          camelCase.ts       (useSobriety.ts)
Stores:         camelCase.ts       (journalStore.ts)
Utils:          camelCase.ts       (formatDate.ts)
Constants:      camelCase.ts       (milestones.ts)
Types:          camelCase.ts       (types.ts)
Tests:          *.test.ts          (encryption.test.ts)
```

---

## Import Order

```typescript
// 1. React/React Native
import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';

// 2. Third-party libraries
import { useRouter } from 'expo-router';
import { Calendar } from 'lucide-react-native';

// 3. Internal - absolute imports
import { useJournalStore } from '@/lib/store/journalStore';
import { encrypt, decrypt } from '@/lib/encryption';
import { Button, Card } from '@/components/ui';

// 4. Internal - relative imports
import { JournalCard } from './JournalCard';

// 5. Types (often at the bottom)
import type { JournalEntry } from '@/lib/types';
```

---

*Last Updated: December 2025*
*Document Version: 1.0*

