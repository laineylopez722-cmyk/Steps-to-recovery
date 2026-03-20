#!/usr/bin/env node

/**
 * Skip bash script execution on Windows
 *
 * On Unix/Linux/macOS: runs setup:verify (bash script)
 * On Windows: skips gracefully (bash not available)
 */

import { spawnSync } from 'child_process';
import { platform } from 'os';

const isWindows = platform() === 'win32';

if (isWindows) {
  console.log('ℹ️  Skipping setup verification on Windows (bash unavailable)');
  console.log('   Run: npm run setup:verify (manually, requires bash/WSL)');
  process.exit(0);
}

// Unix-like: run bash setup:verify
const result = spawnSync('npm', ['run', 'setup:verify'], {
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status ?? 0);
