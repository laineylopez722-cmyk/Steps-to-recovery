import type { UxIssue } from './types';

/**
 * Seed backlog created from repo-grounded meta review.
 * This list is intentionally implementation-ready and ordered by priority.
 */
export const UX_PRIORITY_BACKLOG: UxIssue[] = [
  {
    id: 'UX-001',
    title: 'Unify design token source-of-truth',
    severity: 'critical',
    status: 'open',
    categories: ['consistency', 'visualPolish', 'motionPerformance'],
    summary:
      'The app currently mixes multiple token systems (`ds`, `tokens/theme`, `tokens/modern`), producing visual drift and inconsistent motion/spacing behavior.',
    impact:
      'Inconsistent UI quality across flows increases cognitive load and weakens premium feel.',
    recommendation:
      'Choose one canonical token pipeline for production screens and define a strict deprecation plan for alternate token imports.',
    affectedRoutes: ['HomeMain', 'MeetingFinder', 'ProfileHome', 'JournalList'],
    evidence: [
      {
        filePath: 'src/navigation/MainNavigator.tsx',
        line: 35,
        rationale: 'Navigation chrome uses `ds` tokens directly.',
      },
      {
        filePath: 'src/features/meetings/screens/MeetingFinderScreen.tsx',
        line: 11,
        rationale: 'Meetings flow uses `useTheme` token path.',
      },
      {
        filePath: 'src/design-system/components/AccessibilityHelpers.tsx',
        line: 5,
        rationale: 'Accessibility helpers pull from `tokens/modern`.',
      },
    ],
  },
  {
    id: 'UX-002',
    title: 'Align design docs with shipped UI',
    severity: 'high',
    status: 'open',
    categories: ['consistency', 'hierarchy'],
    summary: 'Design docs reference `*Modern` screens that do not exist in the current codebase.',
    impact: 'Team decisions can drift from reality, causing rework and roadmap confusion.',
    recommendation:
      'Update docs to reflect active screen files and explicitly mark non-shipped concepts as future-state.',
    affectedRoutes: ['HomeMain', 'Login', 'JournalList', 'StepsOverview'],
    evidence: [
      {
        filePath: 'src/design-system/UI_IMPROVEMENTS_SUMMARY.md',
        rationale: 'Document references `HomeScreenModern` and other modern variants.',
      },
      {
        filePath: 'src/features/home/screens/HomeScreen.tsx',
        rationale: 'Actual production home screen is `HomeScreen`.',
      },
    ],
  },
  {
    id: 'UX-003',
    title: 'Resolve typed-but-unregistered profile route',
    severity: 'high',
    status: 'done',
    categories: ['hierarchy', 'consistency', 'recoverySafety'],
    summary:
      '`ShareEntries` is defined in navigation types and deep links but not registered in `ProfileStackNavigator`.',
    impact:
      'Deep-link and navigation contract mismatch can cause dead ends in sponsor sharing flow.',
    recommendation:
      'Keep `ShareEntries` registered in `MainNavigator` and validate contract drift with `npm run audit:uiux`.',
    affectedRoutes: ['ShareEntries', 'SharedEntries', 'Sponsor'],
    evidence: [
      {
        filePath: 'src/navigation/types.ts',
        line: 62,
        rationale: 'Route type exists.',
      },
      {
        filePath: 'src/navigation/linking.ts',
        line: 117,
        rationale: 'Deep link path exists.',
      },
      {
        filePath: 'src/navigation/MainNavigator.tsx',
        rationale: 'Route is not registered in `ProfileStackNavigator`.',
      },
    ],
  },
  {
    id: 'UX-004',
    title: 'Correct emergency screen accessibility role semantics',
    severity: 'high',
    status: 'done',
    categories: ['accessibility', 'recoverySafety'],
    summary:
      '`EmergencyScreen` marks a major scroll container as `accessibilityRole=\"scrollbar\"`, which is not a semantically appropriate role for the content.',
    impact: 'Screen reader users may receive misleading navigation semantics in crisis context.',
    recommendation:
      'Keep non-deceptive container semantics (no forced `scrollbar` role) and preserve clear heading/button structure.',
    affectedRoutes: ['Emergency'],
    evidence: [
      {
        filePath: 'src/features/emergency/screens/EmergencyScreen.tsx',
        line: 95,
        rationale: 'Scroll view uses `accessibilityRole=\"scrollbar\"`.',
      },
    ],
  },
  {
    id: 'UX-005',
    title: 'Collapse duplicate Daily Reading implementations',
    severity: 'medium',
    status: 'open',
    categories: ['consistency', 'hierarchy'],
    summary:
      'Daily reading exists in both `features/home/screens` and `features/readings/screens` with route using only one of them.',
    impact: 'Parallel implementations increase maintenance cost and visual divergence risk.',
    recommendation:
      'Select one canonical screen implementation and archive the other behind explicit migration notes.',
    affectedRoutes: ['DailyReading'],
    evidence: [
      {
        filePath: 'src/features/readings/screens/DailyReadingScreen.tsx',
        rationale: 'Active route target.',
      },
      {
        filePath: 'src/features/home/screens/DailyReadingScreen.tsx',
        rationale: 'Alternate implementation remains in codebase.',
      },
    ],
  },
  {
    id: 'UX-006',
    title: 'Standardize minimum touch target policy',
    severity: 'medium',
    status: 'open',
    categories: ['accessibility', 'consistency'],
    summary:
      'Components and docs mix 44dp, 48dp, and AAA expectations without one enforced standard.',
    impact:
      'Inconsistent target sizing can lower usability, especially during stress or motor impairment.',
    recommendation:
      'Define one enforced baseline token for touch targets and audit all interactive components against it.',
    affectedRoutes: ['HomeMain', 'Emergency', 'JournalEditor', 'NotificationSettings'],
    evidence: [
      {
        filePath: 'src/design-system/tokens/spacing.ts',
        line: 25,
        rationale: '48dp accessibility guidance appears in token docs.',
      },
      {
        filePath: 'src/design-system/components/Input.tsx',
        line: 164,
        rationale: 'Input uses 44 minimum touch target.',
      },
    ],
  },
  {
    id: 'UX-007',
    title: 'Normalize tab bar information scent',
    severity: 'medium',
    status: 'open',
    categories: ['hierarchy', 'accessibility', 'visualPolish'],
    summary: 'Bottom tab labels are hidden globally, reducing route discoverability for new users.',
    impact:
      'Lower wayfinding confidence and weaker first-time clarity, especially with similar icon metaphors.',
    recommendation:
      'Introduce accessible labels/tooltips or conditional labels for onboarding period.',
    affectedRoutes: ['HomeMain', 'JournalList', 'StepsOverview', 'MeetingFinder', 'ProfileHome'],
    evidence: [
      {
        filePath: 'src/navigation/MainNavigator.tsx',
        line: 282,
        rationale: 'Tab navigator sets `tabBarShowLabel: false`.',
      },
    ],
  },
  {
    id: 'UX-008',
    title: 'Align motion language across stacks',
    severity: 'medium',
    status: 'open',
    categories: ['motionPerformance', 'consistency', 'visualPolish'],
    summary:
      'Animation strategy varies by feature (`react-native-reanimated`, static transitions, and token-driven motion) with no shared choreography standard.',
    impact: 'Uneven perceived quality and interaction rhythm between high-traffic flows.',
    recommendation:
      'Define motion tiers and interaction templates (screen enter, card enter, modal) reused by all stacks.',
    affectedRoutes: ['HomeMain', 'JournalList', 'MeetingFinder', 'StepDetail'],
    evidence: [
      {
        filePath: 'src/features/home/screens/HomeScreen.tsx',
        rationale: 'Uses MotionTransitions and custom reanimated enters.',
      },
      {
        filePath: 'src/navigation/RootNavigator.tsx',
        line: 190,
        rationale: 'Root stack uses generic fade transition.',
      },
    ],
  },
  {
    id: 'UX-009',
    title: 'Consolidate design system exports to reduce choice overload',
    severity: 'medium',
    status: 'open',
    categories: ['consistency', 'hierarchy'],
    summary:
      'Design system index exports many overlapping primitives and variants, increasing decision overhead and stylistic divergence.',
    impact: 'Developers can unintentionally select incompatible patterns for similar UI jobs.',
    recommendation:
      'Create a preferred subset for production use and mark legacy/fallback components as deprecated.',
    affectedRoutes: ['HomeMain', 'JournalList', 'MeetingFinder', 'ProfileHome'],
    evidence: [
      {
        filePath: 'src/design-system/index.ts',
        rationale: 'Large export surface mixes old and new primitives.',
      },
    ],
  },
  {
    id: 'UX-010',
    title: 'Introduce shared screen-state choreography for loading/empty/error',
    severity: 'medium',
    status: 'open',
    categories: ['hierarchy', 'visualPolish', 'consistency'],
    summary:
      'Screens implement loading and error states with different patterns and varying copy style.',
    impact:
      'State transitions feel inconsistent, reducing product coherence during non-happy paths.',
    recommendation:
      'Adopt unified state components and copy guidelines across high-frequency routes.',
    affectedRoutes: ['HomeMain', 'JournalList', 'MeetingFinder', 'DailyReading'],
    evidence: [
      {
        filePath: 'src/features/home/screens/HomeScreen.tsx',
        rationale: 'Custom skeleton + bespoke error banner flow.',
      },
      {
        filePath: 'src/design-system/components/EmptyState.tsx',
        rationale: 'Reusable state primitive exists but is not consistently applied.',
      },
    ],
  },
];
