#!/usr/bin/env node
'use strict';

// Suppress Node.js deprecation warning for punycode (DEP0040) before Jest loads.
const originalEmitWarning = process.emitWarning.bind(process);
process.emitWarning = (warning, type, code, ctor) => {
  const message = typeof warning === 'string' ? warning : warning?.message;
  const warningCode =
    (typeof warning === 'object' && warning?.code) ||
    (typeof type === 'object' && type?.code) ||
    code;
  if (warningCode === 'DEP0040' || (typeof message === 'string' && message.includes('punycode'))) {
    return;
  }
  // @ts-ignore - Node's overloads allow multiple signatures
  return originalEmitWarning(warning, type, code, ctor);
};

const args = process.argv.slice(2);
const isWatchMode = args.includes('--watch') || args.includes('--watchAll');
const hasForceExit = args.includes('--forceExit');

// Some RN/Jest suites leave non-critical async handles alive (React Query timers, etc.)
// and can hang autonomous runs indefinitely after reporting results.
// Enforce deterministic exits for non-watch runs while still allowing explicit override.
if (!isWatchMode && !hasForceExit) {
  process.argv.push('--forceExit');
}

require('jest/bin/jest');
