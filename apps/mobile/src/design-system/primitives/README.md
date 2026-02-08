# Action primitive (headless slot pattern)

```tsx
import { Action } from '@/design-system/primitives';
import { Feather } from '@expo/vector-icons';

<Action.Root onPress={onPress} contentStyle={styles.card}>
  <Action.Icon style={styles.iconWrap}>
    <Feather name="book-open" size={18} color="#8B5CF6" />
  </Action.Icon>

  <Action.Content style={styles.content}>
    <Action.Title style={styles.title}>Step work</Action.Title>
    <Action.Subtitle style={styles.subtitle}>Continue where you left off</Action.Subtitle>
  </Action.Content>

  <Action.Trailing style={styles.trailing}>
    <Feather name="chevron-right" size={16} color="#6B7280" />
  </Action.Trailing>
</Action.Root>
```

## Motion-only hook

```tsx
const motion = useActionMotion({ scaleTo: 0.98 });

<Pressable onPressIn={motion.onPressIn} onPressOut={motion.onPressOut}>
  <Animated.View style={motion.animatedStyle}>{children}</Animated.View>
</Pressable>
```
