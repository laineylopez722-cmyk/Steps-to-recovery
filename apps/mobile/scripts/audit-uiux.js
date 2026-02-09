/**
 * UI/UX Architecture Audit
 *
 * Fast, deterministic checks that keep design-system drift visible:
 * - token-system usage counts
 * - doc-to-code existence checks for "modern" screens
 * - navigation contract mismatch checks
 *
 * Usage:
 *   node scripts/audit-uiux.js
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(process.cwd(), 'src');
const MAIN_NAVIGATOR = path.join(SRC_DIR, 'navigation', 'MainNavigator.tsx');
const NAV_TYPES = path.join(SRC_DIR, 'navigation', 'types.ts');
const NAV_LINKING = path.join(SRC_DIR, 'navigation', 'linking.ts');

const importPatterns = [
  { key: 'dsTokens', needle: 'design-system/tokens/ds' },
  { key: 'useThemeHook', needle: 'design-system/hooks/useTheme' },
  { key: 'modernTokens', needle: 'design-system/tokens/modern' },
  { key: 'uiComponents', needle: 'components/ui' },
];

const modernScreensClaimedInDocs = [
  'src/features/home/screens/HomeScreenModern.tsx',
  'src/features/auth/screens/LoginScreenModern.tsx',
  'src/features/journal/screens/JournalListScreenModern.tsx',
  'src/features/journal/screens/JournalEditorScreenModern.tsx',
  'src/features/meetings/screens/MeetingFinderScreenModern.tsx',
  'src/features/steps/screens/StepsOverviewScreenModern.tsx',
  'src/features/profile/screens/ProfileScreenModern.tsx',
];

function walkFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }

    if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

function countFilesContaining(files, text) {
  let count = 0;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes(text)) {
      count += 1;
    }
  }
  return count;
}

function reportTokenUsage(files) {
  const results = {};
  for (const pattern of importPatterns) {
    results[pattern.key] = countFilesContaining(files, pattern.needle);
  }

  console.log('\nToken/Component usage footprint');
  console.log('--------------------------------');
  console.log(`Files importing ds tokens: ${results.dsTokens}`);
  console.log(`Files importing useTheme hook: ${results.useThemeHook}`);
  console.log(`Files importing modern tokens: ${results.modernTokens}`);
  console.log(`Files importing components/ui: ${results.uiComponents}`);
}

function reportModernScreenDrift() {
  const missing = [];
  const present = [];

  for (const screenPath of modernScreensClaimedInDocs) {
    const exists = fs.existsSync(path.join(process.cwd(), screenPath));
    if (exists) {
      present.push(screenPath);
    } else {
      missing.push(screenPath);
    }
  }

  console.log('\nDoc-to-code modern screen drift');
  console.log('------------------------------');
  console.log(`Claimed screens present: ${present.length}`);
  console.log(`Claimed screens missing: ${missing.length}`);

  for (const item of missing) {
    console.log(`  - missing: ${item}`);
  }
}

function reportNavigationContract() {
  const mainNavigator = fs.readFileSync(MAIN_NAVIGATOR, 'utf8');
  const typesFile = fs.readFileSync(NAV_TYPES, 'utf8');
  const linkingFile = fs.readFileSync(NAV_LINKING, 'utf8');

  const hasShareEntriesType = typesFile.includes('ShareEntries');
  const hasShareEntriesLink = linkingFile.includes('ShareEntries');
  const hasShareEntriesScreen = mainNavigator.includes('name="ShareEntries"');

  console.log('\nNavigation contract checks');
  console.log('--------------------------');
  console.log(`ShareEntries typed: ${hasShareEntriesType ? 'yes' : 'no'}`);
  console.log(`ShareEntries deep-linked: ${hasShareEntriesLink ? 'yes' : 'no'}`);
  console.log(`ShareEntries registered in MainNavigator: ${hasShareEntriesScreen ? 'yes' : 'no'}`);
}

function main() {
  const files = walkFiles(SRC_DIR);
  console.log('UI/UX Architecture Audit');
  console.log('========================');
  console.log(`TS/TSX files scanned: ${files.length}`);

  reportTokenUsage(files);
  reportModernScreenDrift();
  reportNavigationContract();
  console.log('');
}

main();
