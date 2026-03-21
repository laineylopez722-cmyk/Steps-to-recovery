/**
 * lint-staged configuration
 *
 * Runs automatically via Husky pre-commit hook before every commit.
 * To bypass in emergencies only: git commit --no-verify
 *
 * Pipeline per file type:
 *  - TypeScript/JavaScript: ESLint (auto-fix) + Prettier
 *  - JSON/Markdown/YAML/CSS:  Prettier only
 *
 * Note: TypeScript type-checking (tsc --noEmit) is intentionally omitted
 * here because lint-staged passes only staged file paths, which breaks
 * project-wide type resolution. Type-checking runs as a separate step in
 * CI (npm run type-check) and can be run locally with:
 *   cd apps/mobile && npx tsc --noEmit
 */
module.exports = {
  // Lint + format TypeScript and JavaScript files
  '*.{ts,tsx,js,jsx}': [
    // ESLint: auto-fix safe violations, fail on remaining errors
    'eslint --fix --max-warnings=0',
    // Prettier: enforce consistent formatting
    'prettier --write',
  ],

  // Format-only for non-script files
  '*.{json,md,yml,yaml,css,scss}': ['prettier --write'],
};
