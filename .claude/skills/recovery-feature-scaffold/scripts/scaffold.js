#!/usr/bin/env node
/**
 * Feature Scaffold Script for Steps to Recovery
 *
 * Usage: node scaffold.js <FeatureName>
 * Example: node scaffold.js GratitudeList
 */

const fs = require('fs');
const path = require('path');

const featureName = process.argv[2];
if (!featureName) {
  console.error('Usage: node scaffold.js <FeatureName>');
  console.error('Example: node scaffold.js GratitudeList');
  process.exit(1);
}

const config = {
  featureName,
  tableName: toSnakeCase(featureName),
  featureDir: toKebabCase(featureName),
  camelCase: toCamelCase(featureName),
  pascalCase: featureName,
};

const paths = {
  mobileSrc: path.resolve(__dirname, '../../../../apps/mobile/src'),
  supabaseMigrations: path.resolve(__dirname, '../../../../supabase'),
  featureBase: path.resolve(__dirname, '../../../../apps/mobile/src/features'),
};

console.log(`🚀 Scaffolding feature: ${config.pascalCase}`);
console.log(`   Table: ${config.tableName}`);

const featurePath = path.join(paths.featureBase, config.featureDir);
fs.mkdirSync(featurePath, { recursive: true });
fs.mkdirSync(path.join(featurePath, 'hooks'), { recursive: true });
fs.mkdirSync(path.join(featurePath, 'screens'), { recursive: true });
fs.mkdirSync(path.join(featurePath, 'components'), { recursive: true });
fs.mkdirSync(path.join(featurePath, '__tests__'), { recursive: true });

const migrationNum = getMigrationNumber(paths);

const files = [
  { path: path.join(featurePath, 'types.ts'), content: generateTypes(config) },
  {
    path: path.join(featurePath, 'hooks', `use${config.pascalCase}.ts`),
    content: generateHooks(config),
  },
  {
    path: path.join(featurePath, 'screens', `${config.pascalCase}ListScreen.tsx`),
    content: generateListScreen(config),
  },
  {
    path: path.join(featurePath, 'screens', `${config.pascalCase}DetailScreen.tsx`),
    content: generateDetailScreen(config),
  },
  {
    path: path.join(featurePath, 'components', `${config.pascalCase}Card.tsx`),
    content: generateCardComponent(config),
  },
  {
    path: path.join(featurePath, '__tests__', `${config.camelCase}.test.ts`),
    content: generateTests(config),
  },
  {
    path: path.join(
      paths.mobileSrc,
      'lib/database/migrations',
      `${migrationNum}_add_${config.tableName}.sql`,
    ),
    content: generateSQLiteMigration(config),
  },
  {
    path: path.join(paths.supabaseMigrations, `${migrationNum}_add_${config.tableName}.sql`),
    content: generateSupabaseMigration(config),
  },
  {
    path: path.join(featurePath, 'NAVIGATION_SNIPPET.txt'),
    content: generateNavigationSnippet(config),
  },
];

files.forEach((file) => {
  fs.mkdirSync(path.dirname(file.path), { recursive: true });
  fs.writeFileSync(file.path, file.content);
  console.log(`   Created: ${path.relative(process.cwd(), file.path)}`);
});

console.log('\n✅ Feature scaffolded successfully!');
console.log('\nNext steps:');
console.log('1. Deploy Supabase migration: npx supabase db push');
console.log('2. Add navigation routes from NAVIGATION_SNIPPET.txt');
console.log('3. Run app to apply SQLite migration');

function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, '');
}

function toKebabCase(str) {
  return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`).replace(/^-/, '');
}

function toCamelCase(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function getMigrationNumber(paths) {
  const migrationsDir = path.join(paths.mobileSrc, 'lib/database/migrations');
  if (!fs.existsSync(migrationsDir)) return '001';

  const files = fs.readdirSync(migrationsDir);
  const numbers = files
    .map((f) => parseInt(f.match(/^(\d+)/)?.[1] || '0'))
    .filter((n) => !isNaN(n));

  const max = Math.max(0, ...numbers);
  return String(max + 1).padStart(3, '0');
}

function generateTypes(config) {
  return `export interface ${config.pascalCase}Item {
  id: string;
  user_id: string;
  encrypted_content: string;
  created_at: string;
  updated_at: string;
}

export interface Create${config.pascalCase}Input {
  content: string;
}

export interface Update${config.pascalCase}Input {
  id: string;
  content?: string;
}
`;
}

function generateHooks(config) {
  return `import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDatabase } from '../../contexts/DatabaseContext';
import { useSyncQueue } from '../../contexts/SyncContext';
import { encryptContent, decryptContent } from '../../utils/encryption';
import { generateUUID } from '../../utils/uuid';
import type { ${config.pascalCase}Item, Create${config.pascalCase}Input, Update${config.pascalCase}Input } from '../types';

const FEATURE_KEY = '${config.tableName}';

export function use${config.pascalCase}Items() {
  const { db, userId } = useDatabase();
  
  return useQuery({
    queryKey: [FEATURE_KEY],
    queryFn: async () => {
      if (!db || !userId) throw new Error('Not initialized');
      
      const items = await db.getAllAsync<${config.pascalCase}Item>(
        'SELECT * FROM ${config.tableName} WHERE user_id = ? ORDER BY created_at DESC',
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

export function useCreate${config.pascalCase}() {
  const { db, userId } = useDatabase();
  const queryClient = useQueryClient();
  const { enqueueSync } = useSyncQueue();
  
  return useMutation({
    mutationFn: async (input: Create${config.pascalCase}Input) => {
      if (!db || !userId) throw new Error('Not initialized');
      
      const id = generateUUID();
      const now = Date.now();
      const encrypted = await encryptContent(input.content);
      
      await db.runAsync(
        'INSERT INTO ${config.tableName} (id, user_id, encrypted_content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        id, userId, encrypted, now, now
      );
      
      const item: ${config.pascalCase}Item = {
        id, user_id: userId, encrypted_content: encrypted,
        created_at: now.toString(), updated_at: now.toString(),
      };
      
      await enqueueSync('${config.tableName}', id, 'INSERT', item);
      return item;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [FEATURE_KEY] }),
  });
}

export function useUpdate${config.pascalCase}() {
  const { db } = useDatabase();
  const queryClient = useQueryClient();
  const { enqueueSync } = useSyncQueue();
  
  return useMutation({
    mutationFn: async (input: Update${config.pascalCase}Input) => {
      if (!db) throw new Error('Not initialized');
      
      const now = Date.now();
      const encrypted = input.content ? await encryptContent(input.content) : undefined;
      
      await db.runAsync(
        'UPDATE ${config.tableName} SET encrypted_content = COALESCE(?, encrypted_content), updated_at = ? WHERE id = ?',
        encrypted, now, input.id
      );
      
      await enqueueSync('${config.tableName}', input.id, 'UPDATE', { id: input.id });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [FEATURE_KEY] }),
  });
}

export function useDelete${config.pascalCase}() {
  const { db } = useDatabase();
  const queryClient = useQueryClient();
  const { enqueueSync } = useSyncQueue();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (!db) throw new Error('Not initialized');
      await db.runAsync('DELETE FROM ${config.tableName} WHERE id = ?', id);
      await enqueueSync('${config.tableName}', id, 'DELETE');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [FEATURE_KEY] }),
  });
}
`;
}

function generateListScreen(config) {
  return `import React from 'react';
import { View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { use${config.pascalCase}Items, useDelete${config.pascalCase} } from '../hooks/use${config.pascalCase}';
import { ${config.pascalCase}Card } from '../components/${config.pascalCase}Card';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/ui/Button';
import { LoadingScreen } from '../../components/LoadingScreen';
import { Plus } from 'lucide-react-native';

export function ${config.pascalCase}ListScreen(): React.ReactElement {
  const navigation = useNavigation();
  const { data: items, isLoading } = use${config.pascalCase}Items();
  const deleteMutation = useDelete${config.pascalCase}();

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4"
        renderItem={({ item }) => (
          <${config.pascalCase}Card
            item={item}
            onPress={() => navigation.navigate('${config.pascalCase}Detail', { id: item.id })}
            onDelete={() => deleteMutation.mutate(item.id)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="FileText"
            title="No ${config.pascalCase} Items"
            description="Get started by creating your first item."
          />
        }
      />
      
      <View className="absolute bottom-6 right-6">
        <Button
          onPress={() => navigation.navigate('${config.pascalCase}Detail', { id: 'new' })}
          className="w-14 h-14 rounded-full bg-violet-600 items-center justify-center"
          accessibilityLabel="Create new item"
        >
          <Plus size={24} color="white" />
        </Button>
      </View>
    </SafeAreaView>
  );
}
`;
}

function generateDetailScreen(config) {
  return `import React, { useState, useEffect } from 'react';
import { View, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { use${config.pascalCase}Items, useCreate${config.pascalCase}, useUpdate${config.pascalCase} } from '../hooks/use${config.pascalCase}';
import { Button } from '../../components/ui/Button';

export function ${config.pascalCase}DetailScreen(): React.ReactElement {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params as { id: string };
  const isNew = id === 'new';
  
  const { data: items } = use${config.pascalCase}Items();
  const createMutation = useCreate${config.pascalCase}();
  const updateMutation = useUpdate${config.pascalCase}();
  
  const [content, setContent] = useState('');
  const existingItem = items?.find(item => item.id === id);
  
  useEffect(() => {
    if (existingItem) setContent(existingItem.content);
  }, [existingItem]);
  
  const handleSave = async () => {
    if (!content.trim()) return;
    if (isNew) {
      await createMutation.mutateAsync({ content });
    } else {
      await updateMutation.mutateAsync({ id, content });
    }
    navigation.goBack();
  };
  
  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView className="flex-1 p-4">
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Enter your content..."
          placeholderTextColor="#64748b"
          multiline
          className="text-white text-base min-h-[200px] p-4 bg-slate-800 rounded-lg"
          textAlignVertical="top"
        />
      </ScrollView>
      
      <View className="p-4 border-t border-slate-800">
        <Button
          onPress={handleSave}
          disabled={!content.trim() || createMutation.isPending || updateMutation.isPending}
          className="bg-violet-600"
        >
          {isNew ? 'Create' : 'Save'}
        </Button>
      </View>
    </SafeAreaView>
  );
}
`;
}

function generateCardComponent(config) {
  return `import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Trash2 } from 'lucide-react-native';

interface ${config.pascalCase}CardProps {
  item: { id: string; content: string; created_at: string };
  onPress: () => void;
  onDelete: () => void;
}

export function ${config.pascalCase}Card({ item, onPress, onDelete }: ${config.pascalCase}CardProps): React.ReactElement {
  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };
  
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-slate-800 rounded-xl p-4 mb-3 flex-row items-center"
      activeOpacity={0.7}
    >
      <View className="flex-1">
        <Text className="text-white text-base" numberOfLines={2}>
          {item.content}
        </Text>
        <Text className="text-slate-400 text-xs mt-1">
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      
      <TouchableOpacity onPress={handleDelete} className="p-2 ml-2" accessibilityLabel="Delete item">
        <Trash2 size={20} color="#ef4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
`;
}

function generateTests(config) {
  return `import { encryptContent, decryptContent, generateEncryptionKey } from '../../utils/encryption';

describe('${config.pascalCase}', () => {
  beforeEach(async () => {
    await generateEncryptionKey();
  });

  it('should encrypt and decrypt roundtrip', async () => {
    const content = 'Sensitive ${config.pascalCase} content';
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
`;
}

function generateSQLiteMigration(config) {
  return `-- SQLite migration for ${config.pascalCase}
CREATE TABLE IF NOT EXISTS ${config.tableName} (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  encrypted_content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_${config.tableName}_user ON ${config.tableName}(user_id);
CREATE INDEX IF NOT EXISTS idx_${config.tableName}_created ON ${config.tableName}(created_at DESC);
`;
}

function generateSupabaseMigration(config) {
  return `-- Supabase migration for ${config.pascalCase}
CREATE TABLE IF NOT EXISTS public.${config.tableName} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.${config.tableName} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own ${config.tableName}"
  ON public.${config.tableName} FOR ALL
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_${config.tableName}_updated_at
  BEFORE UPDATE ON public.${config.tableName}
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_${config.tableName}_user_id ON public.${config.tableName}(user_id);
`;
}

function generateNavigationSnippet(config) {
  return `// Add to src/navigation/AppNavigator.tsx:

import { ${config.pascalCase}ListScreen } from '../features/${config.featureDir}/screens/${config.pascalCase}ListScreen';
import { ${config.pascalCase}DetailScreen } from '../features/${config.featureDir}/screens/${config.pascalCase}DetailScreen';

<Stack.Screen
  name="${config.pascalCase}List"
  component={${config.pascalCase}ListScreen}
  options={{ title: '${config.pascalCase}' }}
/>
<Stack.Screen
  name="${config.pascalCase}Detail"
  component={${config.pascalCase}DetailScreen}
  options={{ title: 'Edit ${config.pascalCase}' }}
/>

// Add to src/navigation/types.ts:
export type RootStackParamList = {
  ${config.pascalCase}List: undefined;
  ${config.pascalCase}Detail: { id: string };
};
`;
}
