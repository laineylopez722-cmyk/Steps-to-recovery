# Example: Scaffold Output for "GratitudeList"

This shows exactly what gets generated when running:

```bash
node scaffold.js GratitudeList
```

## Generated Files

### 1. types.ts

```typescript
export interface GratitudeListItem {
  id: string;
  user_id: string;
  encrypted_content: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGratitudeListInput {
  content: string;
}

export interface UpdateGratitudeListInput {
  id: string;
  content?: string;
}
```

### 2. hooks/useGratitudeList.ts

Complete React Query hooks with encryption/decryption:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDatabase } from '../../contexts/DatabaseContext';
import { useSyncQueue } from '../../contexts/SyncContext';
import { encryptContent, decryptContent } from '../../utils/encryption';
import { generateUUID } from '../../utils/uuid';
import type { GratitudeListItem, CreateGratitudeListInput, UpdateGratitudeListInput } from '../types';

const FEATURE_KEY = 'gratitude_list';

export function useGratitudeListItems() {
  const { db, userId } = useDatabase();
  
  return useQuery({
    queryKey: [FEATURE_KEY],
    queryFn: async () => {
      if (!db || !userId) throw new Error('Not initialized');
      
      const items = await db.getAllAsync<GratitudeListItem>(
        'SELECT * FROM gratitude_list WHERE user_id = ? ORDER BY created_at DESC',
        userId
      );
      
      return Promise.all(
        items.map(async (item) => ({
          ...item,
          content: await decryptContent(item.encrypted_content),
        }))
      );
    },
    enabled: !!db && !!userId,
  });
}

export function useCreateGratitudeList() {
  const { db, userId } = useDatabase();
  const queryClient = useQueryClient();
  const { enqueueSync } = useSyncQueue();
  
  return useMutation({
    mutationFn: async (input: CreateGratitudeListInput) => {
      if (!db || !userId) throw new Error('Not initialized');
      
      const id = generateUUID();
      const now = Date.now();
      const encrypted = await encryptContent(input.content);
      
      await db.runAsync(
        'INSERT INTO gratitude_list (id, user_id, encrypted_content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        id, userId, encrypted, now, now
      );
      
      const item: GratitudeListItem = {
        id, user_id: userId, encrypted_content: encrypted,
        created_at: now.toString(), updated_at: now.toString(),
      };
      
      await enqueueSync('gratitude_list', id, 'INSERT', item);
      return item;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [FEATURE_KEY] }),
  });
}

export function useUpdateGratitudeList() {
  const { db } = useDatabase();
  const queryClient = useQueryClient();
  const { enqueueSync } = useSyncQueue();
  
  return useMutation({
    mutationFn: async (input: UpdateGratitudeListInput) => {
      if (!db) throw new Error('Not initialized');
      
      const now = Date.now();
      const encrypted = input.content ? await encryptContent(input.content) : undefined;
      
      await db.runAsync(
        'UPDATE gratitude_list SET encrypted_content = COALESCE(?, encrypted_content), updated_at = ? WHERE id = ?',
        encrypted, now, input.id
      );
      
      await enqueueSync('gratitude_list', input.id, 'UPDATE', { id: input.id });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [FEATURE_KEY] }),
  });
}

export function useDeleteGratitudeList() {
  const { db } = useDatabase();
  const queryClient = useQueryClient();
  const { enqueueSync } = useSyncQueue();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (!db) throw new Error('Not initialized');
      await db.runAsync('DELETE FROM gratitude_list WHERE id = ?', id);
      await enqueueSync('gratitude_list', id, 'DELETE');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [FEATURE_KEY] }),
  });
}
```

### 3. screens/GratitudeListListScreen.tsx

```typescript
import React from 'react';
import { View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useGratitudeListItems, useDeleteGratitudeList } from '../hooks/useGratitudeList';
import { GratitudeListCard } from '../components/GratitudeListCard';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/ui/Button';
import { LoadingScreen } from '../../components/LoadingScreen';
import { Plus } from 'lucide-react-native';

export function GratitudeListListScreen(): React.ReactElement {
  const navigation = useNavigation();
  const { data: items, isLoading } = useGratitudeListItems();
  const deleteMutation = useDeleteGratitudeList();

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4"
        renderItem={({ item }) => (
          <GratitudeListCard
            item={item}
            onPress={() => navigation.navigate('GratitudeListDetail', { id: item.id })}
            onDelete={() => deleteMutation.mutate(item.id)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="FileText"
            title="No GratitudeList Items"
            description="Get started by creating your first item."
          />
        }
      />
      
      <View className="absolute bottom-6 right-6">
        <Button
          onPress={() => navigation.navigate('GratitudeListDetail', { id: 'new' })}
          className="w-14 h-14 rounded-full bg-violet-600 items-center justify-center"
          accessibilityLabel="Create new item"
        >
          <Plus size={24} color="white" />
        </Button>
      </View>
    </SafeAreaView>
  );
}
```

### 4. screens/GratitudeListDetailScreen.tsx

Edit/create screen with text input.

### 5. components/GratitudeListCard.tsx

List item component with swipe-to-delete.

### 6. __tests__/gratitudeList.test.ts

```typescript
import { encryptContent, decryptContent, generateEncryptionKey } from '../../utils/encryption';

describe('GratitudeList', () => {
  beforeEach(async () => {
    await generateEncryptionKey();
  });

  it('should encrypt and decrypt roundtrip', async () => {
    const content = 'Sensitive GratitudeList content';
    const encrypted = await encryptContent(content);
    const decrypted = await decryptContent(encrypted);
    
    expect(encrypted).not.toBe(content);
    expect(decrypted).toBe(content);
  });

  it('should produce unique ciphertexts for same content', async () => {
    const content = 'Test';
    const encrypted1 = await encryptContent(content);
    const encrypted2 = await encryptContent(content);
    
    expect(encrypted1).not.toBe(encrypted2);
  });
});
```

### 7. SQLite Migration (XXX_add_gratitude_list.sql)

```sql
CREATE TABLE IF NOT EXISTS gratitude_list (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  encrypted_content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gratitude_list_user ON gratitude_list(user_id);
CREATE INDEX IF NOT EXISTS idx_gratitude_list_created ON gratitude_list(created_at DESC);
```

### 8. Supabase Migration (XXX_add_gratitude_list.sql)

```sql
CREATE TABLE IF NOT EXISTS public.gratitude_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.gratitude_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own gratitude_list"
  ON public.gratitude_list FOR ALL
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_gratitude_list_updated_at
  BEFORE UPDATE ON public.gratitude_list
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_gratitude_list_user_id ON public.gratitude_list(user_id);
```

### 9. NAVIGATION_SNIPPET.txt

```typescript
// Add to src/navigation/AppNavigator.tsx:

import { GratitudeListListScreen } from '../features/gratitude-list/screens/GratitudeListListScreen';
import { GratitudeListDetailScreen } from '../features/gratitude-list/screens/GratitudeListDetailScreen';

<Stack.Screen
  name="GratitudeListList"
  component={GratitudeListListScreen}
  options={{ title: 'GratitudeList' }}
/>
<Stack.Screen
  name="GratitudeListDetail"
  component={GratitudeListDetailScreen}
  options={{ title: 'Edit GratitudeList' }}
/>

// Add to src/navigation/types.ts:
export type RootStackParamList = {
  GratitudeListList: undefined;
  GratitudeListDetail: { id: string };
};
```

## What You Get

| Aspect | Status |
|--------|--------|
| Database Schema | ✅ SQLite + Supabase + RLS |
| Encryption | ✅ Auto-encrypt/decrypt |
| Offline Sync | ✅ Queue integration |
| React Query | ✅ Caching + mutations |
| Navigation | ✅ Screens + snippets |
| Tests | ✅ Encryption tests |

## Time Saved

| Task | Manual | With Scaffold |
|------|--------|---------------|
| Create types | 5 min | ✓ Auto |
| Write SQL migrations | 15 min | ✓ Auto |
| Create hooks | 30 min | ✓ Auto |
| Build screens | 30 min | ✓ Auto |
| Add navigation | 10 min | ✓ Snippet |
| Write tests | 15 min | ✓ Auto |
| **Total** | **105 min** | **< 1 sec** |
