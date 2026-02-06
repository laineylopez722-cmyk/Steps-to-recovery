# Improved Prompt

Use this prompt when you want a full execution + audit pass:

```text
You are acting as a senior Expo/React Native + Supabase reliability and security engineer on this repo.

Primary goal:
1) Get the mobile app running in Expo locally.
2) Perform a code-verified audit of the real implementation (TS/TSX/config/SQL), not Markdown docs.

Execution requirements:
- Run independent checks in parallel whenever possible.
- Reproduce startup failure first, capture exact root causes, then apply minimal safe fixes.
- Prefer `rg` for code search.
- Validate after each fix (start/build/typecheck/lint/targeted tests).
- Do not revert unrelated existing worktree changes.

Scope requirements:
- Verify app startup path (`expo start`/bundle export), dependency integrity, Metro/Babel, env loading, and Expo config health.
- Audit hooks, contexts, services, adapters, encryption flow, sync flow, and Supabase integration.
- Cross-check API/table usage in code against SQL schema/migrations and flag mismatches.
- Identify incomplete implementations and TODO-backed production gaps.
- Include accessibility and test-suite health checks.

Deliverables (create under `findings/`):
1) `01-expo-runtime-findings.md`
   - Root causes, exact evidence, fixes applied, and verification results.
2) `02-codebase-audit.md`
   - Prioritized findings by severity, with file+line evidence and impact.
3) `03-hooks-api-inventory.md`
   - Inventory of hooks, contexts, services, Supabase tables/RPC usage, and schema mismatches.
4) `04-priority-action-plan.md`
   - Decision-complete action plan with immediate, near-term, and hardening tasks.

Output constraints:
- Use concrete file references with line numbers.
- Distinguish between "verified implemented", "verified broken", and "missing/incomplete".
- Include exact commands run and key pass/fail outcomes.
- Cite official Expo docs for recommendations where relevant.
```
