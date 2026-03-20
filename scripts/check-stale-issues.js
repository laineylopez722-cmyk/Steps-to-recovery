#!/usr/bin/env node
// =============================================================================
// check-stale-issues.js — Issue aging detection for .claude/issues/
//
// Usage: node scripts/check-stale-issues.js [--json]
//
// Parses every *.issue.md file under .claude/issues/, extracts the YAML
// frontmatter, then reports issues that have exceeded age thresholds:
//
//   - "open"        older than 30 days  → escalate or close
//   - "in-progress" older than 14 days  → update or escalate
//
// Outputs a colour-coded table to stdout. Pass --json for machine-readable
// output (useful in CI pipelines or GitHub Actions summaries).
// =============================================================================

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const THRESHOLDS = {
  open: 30,        // days before an "open" issue is considered stale
  'in-progress': 14, // days before an "in-progress" issue is considered stale
};

// Statuses that count as "done" — these are never flagged
const DONE_STATUSES = new Set(['closed', 'done', 'resolved', 'wont-fix', 'duplicate']);

// ---------------------------------------------------------------------------
// ANSI colour helpers — disabled when stdout is not a TTY or NO_COLOR is set
// ---------------------------------------------------------------------------
const USE_COLOR = process.stdout.isTTY && !process.env.NO_COLOR;

const c = {
  reset:  USE_COLOR ? '\x1b[0m'  : '',
  bold:   USE_COLOR ? '\x1b[1m'  : '',
  red:    USE_COLOR ? '\x1b[31m' : '',
  yellow: USE_COLOR ? '\x1b[33m' : '',
  green:  USE_COLOR ? '\x1b[32m' : '',
  cyan:   USE_COLOR ? '\x1b[36m' : '',
  grey:   USE_COLOR ? '\x1b[90m' : '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the monorepo root from this script's location.
 * @returns {string}
 */
function resolveRoot() {
  return path.resolve(__dirname, '..');
}

/**
 * Recursively find all *.issue.md files under a directory.
 * @param {string} dir
 * @returns {string[]}
 */
function findIssueFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  /** @type {string[]} */
  const results = [];

  /**
   * @param {string} current
   */
  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.issue.md')) {
        results.push(fullPath);
      }
    }
  }

  walk(dir);
  return results;
}

/**
 * Parse YAML-style frontmatter from a Markdown file.
 * Supports simple "key: value" lines between the opening and closing "---" fences.
 * Does NOT support nested or multi-line YAML — only flat key/value pairs.
 *
 * @param {string} content
 * @returns {Record<string, string>}
 */
function parseFrontmatter(content) {
  /** @type {Record<string, string>} */
  const result = {};

  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return result;

  const body = match[1];
  for (const line of body.split('\n')) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kv) {
      const key = kv[1].trim();
      // Strip surrounding quotes if present
      const value = kv[2].trim().replace(/^["']|["']$/g, '');
      result[key] = value;
    }
  }

  return result;
}

/**
 * Extract the first Markdown heading (# Title) from file content.
 * Falls back to the filename stem.
 *
 * @param {string} content
 * @param {string} filePath
 * @returns {string}
 */
function extractTitle(content, filePath) {
  const headingMatch = content.match(/^#+\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();
  return path.basename(filePath, '.issue.md');
}

/**
 * Calculate the age in days from a date string to today.
 * Returns NaN if the date cannot be parsed.
 *
 * @param {string} dateStr
 * @returns {number}
 */
function ageInDays(dateStr) {
  if (!dateStr) return NaN;
  const created = new Date(dateStr);
  if (isNaN(created.getTime())) return NaN;
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Derive a recommendation string based on status and age.
 *
 * @param {string} status
 * @param {number} age
 * @returns {string}
 */
function recommend(status, age) {
  const threshold = THRESHOLDS[status] ?? 30;
  const overage = age - threshold;

  if (status === 'open') {
    if (overage > 60) return 'Close (very old — likely no longer relevant)';
    if (overage > 30) return 'Escalate or close';
    return 'Review and update priority';
  }

  if (status === 'in-progress') {
    if (overage > 30) return 'Escalate — may be blocked';
    return 'Request status update';
  }

  return 'Review';
}

/**
 * Pad a string to exactly `len` characters (truncating if needed).
 *
 * @param {string} str
 * @param {number} len
 * @returns {string}
 */
function pad(str, len) {
  if (str.length >= len) return str.slice(0, len - 1) + '…';
  return str + ' '.repeat(len - str.length);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');

const root = resolveRoot();
const issuesDir = path.join(root, '.claude', 'issues');

if (!fs.existsSync(issuesDir)) {
  if (jsonMode) {
    console.log(JSON.stringify({ error: 'issues directory not found', path: issuesDir }));
  } else {
    console.log(`${c.yellow}[check-stale-issues]${c.reset} No issues directory found at: ${issuesDir}`);
    console.log(`${c.grey}Create .claude/issues/<id>/<id>.issue.md files to track issues.${c.reset}`);
  }
  process.exit(0);
}

const issueFiles = findIssueFiles(issuesDir);

if (issueFiles.length === 0) {
  if (jsonMode) {
    console.log(JSON.stringify({ stale: [], total: 0, message: 'No issue files found' }));
  } else {
    console.log(`${c.green}[check-stale-issues]${c.reset} No issue files found in ${issuesDir}`);
  }
  process.exit(0);
}

/**
 * @typedef {Object} IssueRecord
 * @property {string} id
 * @property {string} title
 * @property {string} status
 * @property {string} created
 * @property {number} age
 * @property {string} file
 * @property {string} recommendation
 * @property {'red'|'yellow'|'green'} severity
 */

/** @type {IssueRecord[]} */
const staleIssues = [];

/** @type {IssueRecord[]} */
const allIssues = [];

for (const filePath of issueFiles) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fm = parseFrontmatter(content);
  const title = fm.title || extractTitle(content, filePath);
  const status = (fm.status || 'open').toLowerCase();
  const created = fm.created || fm.date || '';
  const issueId = fm.id || path.basename(path.dirname(filePath));
  const age = ageInDays(created);

  // Skip done statuses
  if (DONE_STATUSES.has(status)) continue;

  /** @type {IssueRecord} */
  const record = {
    id: issueId,
    title,
    status,
    created,
    age: isNaN(age) ? -1 : age,
    file: path.relative(root, filePath),
    recommendation: '',
    severity: 'green',
  };

  allIssues.push(record);

  const threshold = THRESHOLDS[status];
  // Only flag statuses that have a threshold defined
  if (threshold === undefined) continue;
  if (isNaN(age) || age < threshold) continue;

  record.recommendation = recommend(status, age);
  record.severity = age - threshold > 30 ? 'red' : 'yellow';

  staleIssues.push(record);
}

// ---------------------------------------------------------------------------
// JSON output
// ---------------------------------------------------------------------------
if (jsonMode) {
  console.log(
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalScanned: allIssues.length,
        staleCount: staleIssues.length,
        thresholds: THRESHOLDS,
        stale: staleIssues.map(({ id, title, status, created, age, file, recommendation, severity }) => ({
          id,
          title,
          status,
          created,
          ageDays: age,
          file,
          recommendation,
          severity,
        })),
      },
      null,
      2,
    ),
  );
  process.exit(staleIssues.length > 0 ? 1 : 0);
}

// ---------------------------------------------------------------------------
// Human-readable table output
// ---------------------------------------------------------------------------
const TODAY = new Date().toISOString().slice(0, 10);
console.log(`\n${c.bold}${c.cyan}Stale Issue Report${c.reset} — ${TODAY}`);
console.log(`Scanned: ${issueFiles.length} file(s) in ${issuesDir}`);
console.log(`Thresholds: open >${THRESHOLDS.open}d, in-progress >${THRESHOLDS['in-progress']}d\n`);

if (staleIssues.length === 0) {
  console.log(`${c.green}No stale issues found. Great work!${c.reset}\n`);
  process.exit(0);
}

// Table column widths
const COL = { id: 16, title: 36, age: 8, status: 14, recommendation: 34 };

// Header
const header = [
  pad('ID', COL.id),
  pad('Title', COL.title),
  pad('Age(d)', COL.age),
  pad('Status', COL.status),
  pad('Recommendation', COL.recommendation),
].join('  ');

const divider = '-'.repeat(header.length);

console.log(`${c.bold}${header}${c.reset}`);
console.log(c.grey + divider + c.reset);

for (const issue of staleIssues) {
  const color = issue.severity === 'red' ? c.red : c.yellow;
  const ageStr = issue.age >= 0 ? String(issue.age) : '?';

  const row = [
    pad(issue.id, COL.id),
    pad(issue.title, COL.title),
    pad(ageStr, COL.age),
    pad(issue.status, COL.status),
    pad(issue.recommendation, COL.recommendation),
  ].join('  ');

  console.log(color + row + c.reset);
}

console.log(c.grey + divider + c.reset);
console.log(
  `\n${c.bold}${staleIssues.length} stale issue(s) found.${c.reset} ` +
  `Review ${c.cyan}.claude/issues/${c.reset} and update or close them.\n`,
);

process.exit(1);
