#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const TARGET_FILE_SUFFIX = path.join(
  'features',
  'journal',
  'hooks',
  '__tests__',
  'useJournalEntries.test.tsx',
);

const FRAGILE_PATTERN = /await\s+expect\(\s*act\s*\(\s*async\s*\(\)\s*=>\s*\{/g;
const LEGACY_MARKER = 'LEGACY_ACT_ROLLBACK_EXCEPTION';
const EXPECTED_LEGACY_EXCEPTIONS = 1;

const ALLOWED_SNIPPETS = [').rejects.toThrow(expectedMessage)'];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.expo') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (/\.test\.tsx?$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function lineNumberFromIndex(text, index) {
  return text.slice(0, index).split('\n').length;
}

function isTargetFile(filePath) {
  return path.normalize(filePath).endsWith(TARGET_FILE_SUFFIX);
}

function isAllowedMatch(filePath, text, matchIndex) {
  if (!isTargetFile(filePath)) {
    return false;
  }

  const lookback = text.slice(Math.max(0, matchIndex - 300), matchIndex);
  const lookahead = text.slice(matchIndex, matchIndex + 800);

  const hasLegacyMarker = lookback.includes(LEGACY_MARKER);
  const hasAllowedSnippet = ALLOWED_SNIPPETS.some((snippet) => lookahead.includes(snippet));

  return hasLegacyMarker && hasAllowedSnippet;
}

const testFiles = walk(SRC_DIR);
const violations = [];
let allowedMatches = 0;
let targetFileText = null;

for (const file of testFiles) {
  const text = fs.readFileSync(file, 'utf8');
  if (isTargetFile(file)) {
    targetFileText = text;
  }

  FRAGILE_PATTERN.lastIndex = 0;

  let match;
  while ((match = FRAGILE_PATTERN.exec(text)) !== null) {
    const idx = match.index;

    if (isAllowedMatch(file, text, idx)) {
      allowedMatches += 1;
      continue;
    }

    const line = lineNumberFromIndex(text, idx);
    violations.push(`${path.relative(ROOT, file)}:${line}`);
  }
}

if (targetFileText == null) {
  console.error('❌ Could not find useJournalEntries.test.tsx for legacy exception audit.');
  process.exit(1);
}

const markerCount = (targetFileText.match(new RegExp(LEGACY_MARKER, 'g')) || []).length;

if (violations.length > 0) {
  console.error('❌ Found fragile act/assertion pattern outside allowlist:');
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  console.error('Expected style: await act(async () => { await expect(fn()).rejects... });');
  process.exit(1);
}

if (markerCount !== EXPECTED_LEGACY_EXCEPTIONS) {
  console.error(
    `❌ Expected exactly ${EXPECTED_LEGACY_EXCEPTIONS} legacy markers in useJournalEntries, found ${markerCount}.`,
  );
  process.exit(1);
}

if (allowedMatches !== EXPECTED_LEGACY_EXCEPTIONS) {
  console.error(
    `❌ Expected exactly ${EXPECTED_LEGACY_EXCEPTIONS} allowlisted rollback exceptions, found ${allowedMatches}.`,
  );
  process.exit(1);
}

console.log(
  `✅ act/assertion audit passed (0 violations, ${allowedMatches} allowlisted legacy rollback exceptions).`,
);
