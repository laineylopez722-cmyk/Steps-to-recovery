# Expo Router Patterns — Steps to Recovery

> File-based routing patterns for Expo Router 6.x (SDK 54).

## Current Route Structure

```
app/
├── _layout.tsx              # Root layout (providers, auth guard)
├── +not-found.tsx           # 404 handler
├── onboarding.tsx           # Onboarding flow
├── (auth)/                  # Unauthenticated routes
│   ├── _layout.tsx
│   ├── login.tsx
│   ├── sign-up.tsx
│   └── forgot-password.tsx
└── (tabs)/                  # Main authenticated app
    ├── _layout.tsx          # Tab navigator
    ├── (home)/              # Home tab (nested stack)
    │   ├── _layout.tsx
    │   ├── index.tsx        # Dashboard
    │   └── [feature].tsx    # Dynamic feature routes
    ├── steps/               # Steps tab
    ├── meetings/            # Meetings tab
    ├── journal/             # Journal tab
    └── profile/             # Profile tab
```

## Core Patterns

### 1. Root Layout with Auth Guard

```typescript
// app/_layout.tsx
import { Redirect, Slot } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function RootLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <SplashScreen />;
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Providers>
      <Slot />
    </Providers>
  );
}
```

### 2. Tab Navigation

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tokens.colors.primary,
        tabBarStyle: { backgroundColor: tokens.colors.surface },
      }}
      screenListeners={{
        tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
      }}
    >
      <Tabs.Screen name="(home)" options={{ title: 'Home', tabBarIcon: HomeIcon }} />
      <Tabs.Screen name="steps" options={{ title: 'Steps', tabBarIcon: StepsIcon }} />
      <Tabs.Screen name="meetings" options={{ title: 'Meetings', tabBarIcon: MeetingsIcon }} />
      <Tabs.Screen name="journal" options={{ title: 'Journal', tabBarIcon: JournalIcon }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ProfileIcon }} />
    </Tabs>
  );
}
```

### 3. Dynamic Routes

```typescript
// app/(tabs)/(home)/[feature].tsx
import { useLocalSearchParams } from 'expo-router';

export default function FeatureScreen() {
  const { feature } = useLocalSearchParams<{ feature: string }>();
  // Route to feature component based on param
}
```

### 4. Notification Deep Linking

```typescript
// In root _layout.tsx
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

function useNotificationObserver() {
  useEffect(() => {
    function redirect(notification: Notifications.Notification) {
      const url = notification.request.content.data?.url;
      if (typeof url === 'string') {
        router.push(url);
      }
    }

    const response = Notifications.getLastNotificationResponse();
    if (response?.notification) redirect(response.notification);

    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => redirect(response.notification)
    );

    return () => sub.remove();
  }, []);
}
```

### 5. Modal Routes

```typescript
// app/(tabs)/(home)/modal.tsx - Presented as modal
export default function ModalScreen() {
  return <View>...</View>;
}

// In _layout.tsx
<Stack.Screen name="modal" options={{ presentation: 'modal' }} />
```

## Navigation Helpers

```typescript
import { router, Link, useRouter, useSegments, usePathname } from 'expo-router';

// Programmatic navigation
router.push('/journal/new');
router.replace('/(auth)/login');
router.back();

// Link component
<Link href="/steps/1" asChild>
  <Pressable accessibilityRole="link">
    <Text>Step 1</Text>
  </Pressable>
</Link>

// Typed params
const { id } = useLocalSearchParams<{ id: string }>();
```

## Best Practices

1. **Use `<Link>` over `router.push()`** where possible for better accessibility
2. **Type all route params** with `useLocalSearchParams<T>()`
3. **Auth guards in _layout.tsx** using `<Redirect>`
4. **Haptics on all tab presses** via `screenListeners.tabPress`
5. **Accessibility** on all navigation elements
6. **Error boundaries** in layouts with `ErrorBoundary` export
