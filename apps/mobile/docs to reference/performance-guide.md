# React Native Performance Guide — Steps to Recovery

> Performance budgets, optimization patterns, and monitoring.

## Performance Budgets

| Metric | Target | Critical |
|--------|--------|----------|
| Cold start | < 2 seconds | Emergency access during cravings |
| TTI (Time to Interactive) | < 3 seconds | Users in crisis need fast access |
| Frame rate | 60 FPS | Smooth animations |
| Bundle size | < 2 MB (JS) | Download speed |
| Memory usage | < 200 MB | Low-end devices |
| SQLite query | < 50ms | Responsive UI |

## Optimization Patterns

### 1. List Rendering with FlashList
```typescript
import { FlashList } from '@shopify/flash-list';

// ✅ Use FlashList for >10 items
<FlashList
  data={entries}
  renderItem={renderEntry}
  estimatedItemSize={100}
  keyExtractor={(item) => item.id}
/>

// ❌ Never use ScrollView for dynamic lists
```

### 2. Image Optimization with expo-image
```typescript
import { Image } from 'expo-image';

<Image
  source={imageUrl}
  placeholder={{ blurhash: '...' }}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
/>
```

### 3. Lazy Loading Screens
```typescript
import { lazy, Suspense } from 'react';

const AICompanionScreen = lazy(() => import('@/features/ai-companion/screens/AIScreen'));
```

### 4. Database Transaction Batching
```typescript
// ✅ Batch operations in transactions
await db.withExclusiveTransactionAsync(async () => {
  for (const entry of entries) {
    await db.runAsync('INSERT INTO ...', [entry.id, entry.data]);
  }
});

// ❌ Don't run individual inserts
for (const entry of entries) {
  await db.runAsync('INSERT INTO ...', [entry.id, entry.data]);
}
```

### 5. React Query Optimization
```typescript
// Stale time prevents refetching too often
useQuery({
  queryKey: ['journal-entries'],
  queryFn: fetchEntries,
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 30 * 60 * 1000,   // 30 minutes garbage collection
});
```

### 6. Memoization (React 19)
React 19 with React Compiler handles memoization automatically.
Only manually memoize for:
- Expensive computations
- Components receiving new objects/arrays as props
- Callbacks passed to optimized lists

### 7. Animation Performance
```typescript
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

// ✅ Reanimated runs on UI thread
const offset = useSharedValue(0);
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateY: withSpring(offset.value) }],
}));

// ❌ Never use Animated API from react-native for complex animations
```

### 8. Reduce Re-renders
- Split large components into smaller focused components
- Use Zustand selectors: `const count = useStore((s) => s.count)`
- Avoid inline objects/functions in render

## Monitoring

### Sentry Integration
```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  profilesSampleRate: 0.1,
});
```

### Performance Marks
```typescript
import { logger } from '@/utils/logger';

const start = performance.now();
await heavyOperation();
logger.info('Operation time', { ms: performance.now() - start });
```
