/**
 * Jest preload
 *
 * Mock Expo WinterCG runtime modules that can import outside of test scope.
 */
'use strict';

// Prevent WinterCG runtime from installing globals during Jest boot.
jest.mock('expo/src/winter/runtime', () => ({}), { virtual: true });
jest.mock('expo/src/winter/runtime.native', () => ({}), { virtual: true });
jest.mock('expo/src/winter/installGlobal', () => ({
  install: () => {},
  installGlobal: () => {},
}), { virtual: true });

// Provide a safe default registry to avoid lazy getter imports.
globalThis.__ExpoImportMetaRegistry = {};
