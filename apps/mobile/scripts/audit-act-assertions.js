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

const ALLOWED_SNIPPETS = [
  ").rejects.toThrow('Database error')",
  ").rejects.toThrow('Update failed')",
  ").rejects.toThrow('Delete failed')",
];

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

function isAllowedMatch(filePath, text, matchIndex) {
  const normalized = path.normalize(filePath);
  if (!normalized.endsWith(TARGET_FILE_SUFFIX)) {
    return false;
  }

  const window = text.slice(matchIndex, matchIndex + 800);
  return ALLOWED_SNIPPETS.some((snippet) => window.includes(snippet));
}

const testFiles = walk(SRC_DIR);
const violations = [];
let allowedMatches = 0;

for (const file of testFiles) {
  const text = fs.readFileSync(file, 'utf8');
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

if (violations.length > 0) {
  console.error('❌ Found fragile act/assertion pattern outside allowlist:');
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  console.error('Expected style: await act(async () => { await expect(fn()).rejects... });');
  process.exit(1);
}

if (allowedMatches !== 3) {
  console.error(
    `❌ Expected exactly 3 allowlisted rollback exceptions in useJournalEntries, found ${allowedMatches}.`,
  );
  process.exit(1);
}

console.log('✅ act/assertion audit passed (0 violations, 3 allowlisted rollback exceptions).');
