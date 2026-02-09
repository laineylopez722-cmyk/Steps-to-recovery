import type { UxRoadmapItem } from './types';

/**
 * Decision-complete phased roadmap for UI/UX meta-review execution.
 */
export const UI_UX_REVIEW_ROADMAP: UxRoadmapItem[] = [
  {
    phase: 1,
    title: 'Foundation Alignment',
    objective: 'Lock one design-system direction and remove architecture ambiguity.',
    effort: 'M',
    risk: 'high',
    dependencies: [],
    tasks: [
      'Pick canonical token source (`ThemeContext` + preferred token set) for production screens.',
      'Define deprecation map for `tokens/modern`, `tokens/theme`, and direct `ds` usage outside migration boundaries.',
      'Document compatibility rules for color, spacing, typography, elevation, and motion.',
      'Fix route contract mismatch (`ShareEntries`) to avoid navigation ambiguity.',
    ],
    acceptanceCriteria: [
      'Design-system architecture decision record merged and referenced in team docs.',
      'New lint/search gates identify deprecated token imports in changed files.',
      'Navigation types, deep links, and stack registration agree for profile/sponsor routes.',
    ],
  },
  {
    phase: 2,
    title: 'Flagship Flow Polish',
    objective: 'Raise perceived quality in highest-frequency and highest-risk journeys.',
    effort: 'L',
    risk: 'medium',
    dependencies: ['Phase 1 design-system decision', 'Phase 1 navigation contract fixes'],
    tasks: [
      'Polish Home, Journal, Emergency, Auth, and Meetings flows with one shared visual language.',
      'Standardize loading/empty/error handling patterns and microcopy tone across these routes.',
      'Introduce motion templates for screen entry, card interactions, and modal transitions.',
      'Run accessibility pass with explicit role/label/hint and touch target conformance.',
    ],
    acceptanceCriteria: [
      'Target flows reach >= 4.2 weighted score using rubric in `review/rubric.ts`.',
      'No critical accessibility findings in emergency and auth journeys.',
      'Design QA confirms consistent spacing/type hierarchy across flagship flows.',
    ],
  },
  {
    phase: 3,
    title: 'Surface Harmonization',
    objective: 'Propagate premium baseline to remaining screens and reduce residual drift.',
    effort: 'L',
    risk: 'medium',
    dependencies: ['Phase 2 component updates'],
    tasks: [
      'Apply token/component conventions to sponsor, settings, progress, and edge routes.',
      'Consolidate duplicate screen implementations (for example DailyReading variants).',
      'Reduce export surface by moving non-preferred components behind legacy namespaces.',
      'Normalize tab and header affordances for stronger wayfinding.',
    ],
    acceptanceCriteria: [
      'All inventory routes score >= 3.5 weighted.',
      'No unresolved high-severity consistency issues remain in backlog.',
      'Duplicate production UI implementations are either removed or explicitly archived.',
    ],
  },
  {
    phase: 4,
    title: 'Governance and Regression Control',
    objective: 'Make quality improvements durable through tooling and process.',
    effort: 'M',
    risk: 'low',
    dependencies: ['Phase 3 completion'],
    tasks: [
      'Add UI/UX review checklist to pull request template and Definition of Done.',
      'Run monthly rubric audit against route inventory and trend weighted scores.',
      'Track backlog burn-down by severity and route risk level.',
      'Keep docs in sync with shipped screens to avoid future architectural drift.',
    ],
    acceptanceCriteria: [
      'PR workflow includes mandatory UI/UX checklist for screen-touching changes.',
      'Monthly audit report generated with route coverage and score trends.',
      'No stale “future-state as current-state” documentation in design-system docs.',
    ],
  },
];
