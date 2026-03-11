# POLISH GUIDE — Steps to Recovery

## Design System Token Reference

### Import Pattern
```tsx
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
// In component:
const styles = useThemedStyles(createStyles);
const ds = useDs();
```

### Color Tokens (use ds.semantic.*)
| Legacy (REPLACE) | Modern Token |
|---|---|
| `theme.colors.text` | `ds.semantic.text.primary` |
| `theme.colors.textSecondary` | `ds.semantic.text.secondary` |
| `theme.colors.textTertiary` | `ds.semantic.text.tertiary` |
| `theme.colors.textMuted` | `ds.semantic.text.muted` |
| `theme.colors.textInverse` | `ds.semantic.text.inverse` |
| `theme.colors.primary` | `ds.semantic.intent.primary.solid` |
| `theme.colors.secondary` | `ds.semantic.intent.secondary.solid` |
| `theme.colors.danger` | `ds.semantic.intent.alert.solid` |
| `theme.colors.success` | `ds.semantic.intent.success.solid` |
| `theme.colors.warning` | `ds.semantic.intent.warning.solid` |
| `theme.colors.surface` | `ds.semantic.surface.card` |
| `theme.colors.surfaceHover` | `ds.semantic.surface.elevated` |
| `theme.colors.surfaceElevated` | `ds.semantic.surface.elevated` |
| `theme.colors.surfaceVariant` | `ds.semantic.surface.interactive` |
| `theme.colors.background` | `ds.semantic.surface.app` |
| `theme.colors.border` | `ds.semantic.surface.overlay` |
| `theme.colors.borderLight` | `'rgba(255,255,255,0.06)'` |
| `theme.colors.overlay` | `ds.semantic.surface.overlay` |
| `theme.colors.muted` | `ds.semantic.text.muted` |
| `theme.colors.successMuted` | `ds.semantic.intent.success.muted` |
| `theme.colors.semantic.*` | `ds.semantic.*` (just remove "colors.") |

### Typography Tokens (use ds.semantic.typography.*)
| Legacy (REPLACE) | Modern Token |
|---|---|
| `theme.typography.h1` | `ds.semantic.typography.screenTitle` |
| `theme.typography.h2` | `ds.typography.h2` |
| `theme.typography.h3` | `ds.typography.h3` |
| `theme.typography.body` | `ds.semantic.typography.body` |
| `theme.typography.bodySm` | `ds.semantic.typography.bodySmall` |
| `theme.typography.caption` | `ds.semantic.typography.sectionLabel` |
| `theme.typography.micro` | `ds.semantic.typography.meta` |
| `theme.typography.labelLarge` | `ds.typography.h3` |
| `theme.typography.bodyBold` | `{ ...ds.semantic.typography.body, fontWeight: '700' as const }` |
| `theme.typography.title1` | `ds.typography.h2` |
| `theme.typography.title2` | `ds.typography.h3` |
| `theme.typography.title3` | `ds.typography.h3` |
| `theme.typography.headline` | `ds.typography.h3` |
| `theme.typography.subheadline` | `ds.semantic.typography.bodySmall` |
| `theme.typography.caption1` | `ds.semantic.typography.sectionLabel` |
| `theme.typography.largeTitle` | `ds.semantic.typography.screenTitle` |

### Layout Tokens
- `ds.semantic.layout.screenPadding` (24)
- `ds.semantic.layout.sectionGap` (24)
- `ds.semantic.layout.cardPadding` (20)
- `ds.semantic.layout.listItemPadding` (16)
- `ds.semantic.layout.touchTarget` (44)

### Spacing (ds.space)
`ds.space[1]=4, [2]=8, [3]=12, [4]=16, [5]=20, [6]=24, [7]=28, [8]=32, [9]=36, [10]=40`

### Radius (ds.radius)
`xs=6, sm=10, md=14, lg=20, xl=28, '2xl'=36, full=9999`

## Polish Checklist Per Screen

1. **Remove legacy theme imports** — replace `useTheme()` with `useDs()` if not present
2. **Replace ALL `theme.colors.*` and `theme.typography.*`** references using table above
3. **Replace `ActivityIndicator`** with `SkeletonCard` from design-system for loading states
4. **Add entry animations** — `FadeIn`, `FadeInDown` from `react-native-reanimated`
5. **Consistent section headers** — use `ds.semantic.typography.sectionLabel` + `ds.semantic.text.secondary` + uppercase + letterSpacing 1
6. **Card padding/radius** — `padding: ds.semantic.layout.cardPadding`, `borderRadius: ds.radius.lg`
7. **Touch feedback** — use `useMotionPress()` for all tappable items
8. **Screen padding** — `paddingHorizontal: ds.semantic.layout.screenPadding`
9. **Remove inline color literals** — replace hex codes with DS tokens
10. **Empty states** — show helpful message + icon when data is empty
11. **Error states** — show error message with retry button
12. **Consistent icon sizing** — 20-24px for inline, 32-48px for decorative, consistent icon library (Feather preferred)
13. **haptics** — fire-and-forget pattern: `Haptics.impactAsync(...).catch(() => {})` — never await

## Critical Rules
- `npx tsc --noEmit` MUST pass after ALL changes
- Do NOT introduce new `any` types
- Do NOT remove existing functionality
- Keep component line count reasonable (< 300 for screens, < 200 for components)
- Commit message format: `polish(<scope>): <description>`
- Run `cd C:\Users\h\Documents\GitHub\Steps-to-recovery\apps\mobile && npx tsc --noEmit` before committing
- Run `cd C:\Users\h\Documents\GitHub\Steps-to-recovery && git add -A && git commit -m "polish(<scope>): <description>"` to commit
