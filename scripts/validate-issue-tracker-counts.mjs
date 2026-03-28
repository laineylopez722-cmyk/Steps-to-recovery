#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const TRACKER_PATH = path.resolve('docs/issues/_tracker.yaml');

function extractSection(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  if (start === -1) {
    throw new Error(`Missing section marker: ${startMarker}`);
  }

  const end = source.indexOf(endMarker, start);
  if (end === -1) {
    throw new Error(`Missing section marker: ${endMarker}`);
  }

  return source.slice(start, end);
}

function parseIssueEntries(issuesSection) {
  const entries = [];
  const lines = issuesSection.split('\n');
  let current = null;

  for (const line of lines) {
    const idMatch = line.match(/^\s*- id:\s*([A-Z]+-\d+)/);
    if (idMatch) {
      current = { id: idMatch[1], status: null };
      entries.push(current);
      continue;
    }

    const statusMatch = line.match(/^\s+status:\s*([a-z-]+)/);
    if (statusMatch && current) {
      current.status = statusMatch[1];
    }
  }

  return entries;
}

function parseMetadataCounts(source) {
  const metadataSection = extractSection(source, 'metadata:', '\n---\n\n# ============================================================\n# ISSUES BY CATEGORY');

  const totalMatch = metadataSection.match(/\n\s*total_issues:\s*(\d+)/);
  if (!totalMatch) {
    throw new Error('Missing metadata.total_issues');
  }

  const counts = {};
  for (const status of ['open', 'in_progress', 'blocked', 'fixed', 'deferred']) {
    const match = metadataSection.match(new RegExp(`\\n\\s*${status}:\\s*(\\d+)`));
    if (!match) {
      throw new Error(`Missing metadata.counts.${status}`);
    }

    counts[status] = Number(match[1]);
  }

  return {
    totalIssues: Number(totalMatch[1]),
    counts,
  };
}

function parseByStatus(source) {
  const byStatusSection = extractSection(source, 'by_status:', '\n\n---\n\n# ============================================================\n# AGING');
  const aliases = {
    open: 'open',
    'in-progress': 'in_progress',
    in_progress: 'in_progress',
    blocked: 'blocked',
    fixed: 'fixed',
    deferred: 'deferred',
  };
  const parsed = Object.fromEntries(
    Object.values(aliases).map((key) => [key, { count: null, ids: [] }]),
  );

  let currentStatus = null;
  for (const line of byStatusSection.split('\n')) {
    const statusMatch = line.match(/^\s{2}(open|in-progress|in_progress|blocked|fixed|deferred):\s*$/);
    if (statusMatch) {
      currentStatus = aliases[statusMatch[1]];
      continue;
    }

    if (!currentStatus) {
      continue;
    }

    const countMatch = line.match(/^\s{4}count:\s*(\d+)\s*$/);
    if (countMatch) {
      parsed[currentStatus].count = Number(countMatch[1]);
      continue;
    }

    const idMatch = line.match(/^\s{6}-\s*([A-Z]+(?:-[A-Z]+)?-\d+)/);
    if (idMatch) {
      parsed[currentStatus].ids.push(idMatch[1]);
    }
  }

  for (const [yamlStatus, key] of Object.entries(aliases)) {
    if (parsed[key].count === null) {
      throw new Error(`Missing by_status.${yamlStatus}.count`);
    }
  }

  return parsed;
}

function formatMismatch(label, expected, actual) {
  return `- ${label}: expected ${expected}, found ${actual}`;
}

function main() {
  if (!fs.existsSync(TRACKER_PATH)) {
    console.error(`Tracker not found: ${TRACKER_PATH}`);
    process.exit(1);
  }

  const source = fs.readFileSync(TRACKER_PATH, 'utf8');
  const issuesSection = extractSection(
    source,
    'issues:',
    '\n---\n\n# ============================================================\n# INDEX BY PRIORITY',
  );

  const entries = parseIssueEntries(issuesSection);
  const allowedStatuses = new Set(['open', 'in-progress', 'blocked', 'fixed', 'deferred']);

  const statusMap = {
    open: [],
    in_progress: [],
    blocked: [],
    fixed: [],
    deferred: [],
  };

  const errors = [];

  for (const entry of entries) {
    if (!entry.status) {
      errors.push(`- ${entry.id} is missing a status field`);
      continue;
    }

    if (!allowedStatuses.has(entry.status)) {
      errors.push(`- ${entry.id} has unsupported status: ${entry.status}`);
      continue;
    }

    const key = entry.status === 'in-progress' ? 'in_progress' : entry.status;
    statusMap[key].push(entry.id);
  }

  const metadata = parseMetadataCounts(source);
  const byStatus = parseByStatus(source);

  if (metadata.totalIssues !== entries.length) {
    errors.push(formatMismatch('metadata.total_issues', entries.length, metadata.totalIssues));
  }

  for (const status of Object.keys(statusMap)) {
    const expectedIds = statusMap[status];
    const expectedCount = expectedIds.length;
    const pretty = status;

    if (metadata.counts[status] !== expectedCount) {
      errors.push(
        formatMismatch(
          `metadata.counts.${pretty}`,
          expectedCount,
          metadata.counts[status],
        ),
      );
    }

    if (byStatus[status].count !== expectedCount) {
      errors.push(
        formatMismatch(`by_status.${pretty}.count`, expectedCount, byStatus[status].count),
      );
    }

    const listed = byStatus[status].ids;
    const missing = expectedIds.filter((id) => !listed.includes(id));
    const extra = listed.filter((id) => !expectedIds.includes(id));

    if (missing.length > 0 || extra.length > 0) {
      if (missing.length > 0) {
        errors.push(`- by_status.${pretty}.issues missing IDs: ${missing.join(', ')}`);
      }

      if (extra.length > 0) {
        errors.push(`- by_status.${pretty}.issues has extra IDs: ${extra.join(', ')}`);
      }
    }
  }

  if (errors.length > 0) {
    console.error('Issue tracker validation failed.');
    console.error(errors.join('\n'));
    process.exit(1);
  }

  console.log(
    `Issue tracker validation passed: ${entries.length} issues (open: ${statusMap.open.length}, in-progress: ${statusMap.in_progress.length}, blocked: ${statusMap.blocked.length}, fixed: ${statusMap.fixed.length}, deferred: ${statusMap.deferred.length}).`,
  );
}

main();
