# Performance Optimization Guide

This document outlines the performance optimizations implemented in the Recovery Companion app and best practices for maintaining optimal performance.

## Performance Targets

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| App Launch (cold) | < 2s | < 4s |
| App Launch (warm) | < 500ms | < 1s |
| Screen Transition | < 300ms | < 500ms |
| List Scroll | 60 FPS | > 30 FPS |
| Database Query | < 50ms | < 200ms |
| Memory Usage | < 150MB | < 300MB |

## Database Optimizations

### Indexes

The following indexes are created for optimal query performance:

```sql
-- Core tables
idx_journal_created      -- Journal entries by date
idx_journal_type         -- Journal entries by type
idx_checkin_date         -- Daily check-ins lookup
idx_milestone_achieved   -- Milestones by achievement date
idx_meeting_logs_attended -- Meeting logs by attendance date

-- V2 tables
idx_step_answers_composite -- Step work answers (step + question)
idx_phone_logs_contact     -- Phone calls by contact
idx_contacts_last_contacted -- Contacts by last contact date
```

### WAL Mode

SQLite is configured with Write-Ahead Logging (WAL) for:
- Better concurrent read/write performance
- Improved crash recovery
- Reduced lock contention

### Query Best Practices

1. **Use prepared statements** - All queries use parameterized statements
2. **Limit result sets** - Use LIMIT for lists that show recent items
3. **Batch operations** - Use transactions for multiple writes
4. **Index-aware queries** - Ensure WHERE clauses use indexed columns

## React Native Optimizations

### Component Memoization

Use `React.memo()` for components that:
- Receive the same props frequently
- Are expensive to render
- Appear in lists

```typescript
const MemoizedCard = React.memo(function Card({ title, content }) {
  return (
    <View>
      <Text>{title}</Text>
      <Text>{content}</Text>
    </View>
  );
});
```

### List Rendering

For long lists, use FlatList with:

```typescript
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
  // Performance props
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
  getItemLayout={getItemLayout} // If items have fixed height
/>
```

### useCallback and useMemo

```typescript
// Memoize callbacks passed to child components
const handlePress = useCallback(() => {
  doSomething(id);
}, [id]);

// Memoize expensive computations
const sortedData = useMemo(() => {
  return data.sort((a, b) => b.date - a.date);
}, [data]);
```

## State Management

### Zustand Store Best Practices

1. **Selective subscriptions** - Subscribe only to needed state slices

```typescript
// Good - only re-renders when soberDays changes
const soberDays = useSobrietyStore(state => state.soberDays);

// Avoid - re-renders on any state change
const store = useSobrietyStore();
```

2. **Batch updates** - Group related state updates

```typescript
set((state) => ({
  ...state,
  isLoading: false,
  data: newData,
  error: null,
}));
```

## Image Optimization

1. **Use appropriate sizes** - Don't load full-resolution images
2. **Lazy load** - Load images as they come into view
3. **Cache** - Use image caching for repeated views

## Memory Management

### Cleanup Effects

Always clean up subscriptions and listeners:

```typescript
useEffect(() => {
  const subscription = someObservable.subscribe();
  return () => subscription.unsubscribe();
}, []);
```

### Avoid Memory Leaks

1. Clear intervals/timeouts in cleanup
2. Remove event listeners
3. Cancel async operations on unmount

## Encryption Performance

Field-level encryption is used instead of full-database encryption for:
- Faster read/write operations
- Targeted protection of sensitive data
- Reduced battery consumption

## Monitoring

### Development

Use React DevTools Profiler to identify:
- Components that render too often
- Expensive renders
- Unnecessary re-renders

### Production

Error tracking (Sentry) captures:
- Performance transactions
- Slow operations (> 100ms)
- Memory warnings

## Performance Utilities

The `lib/utils/performance.ts` module provides:

```typescript
// Debounce user input
const debouncedSearch = useDebounce(searchFn, 300);

// Throttle scroll handlers
const throttledScroll = useThrottle(scrollHandler, 16);

// Measure operation time
measurePerformance('loadData', () => loadData());

// Format dates with caching
const formatted = formatDateCached(date, 'short');
```

## Checklist for New Features

Before shipping a new feature, verify:

- [ ] Database queries use appropriate indexes
- [ ] List components use FlatList with performance props
- [ ] Expensive computations are memoized
- [ ] Callbacks are wrapped in useCallback
- [ ] State subscriptions are selective
- [ ] Effects clean up resources
- [ ] Images are appropriately sized
- [ ] No console.log statements in production
- [ ] Error boundaries wrap risky components

