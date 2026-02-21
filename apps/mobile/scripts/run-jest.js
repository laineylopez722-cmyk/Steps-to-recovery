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

require('jest/bin/jest');
