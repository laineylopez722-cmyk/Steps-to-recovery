/**
 * Metro configuration for Expo React Native
 * Supports Uniwind, monorepo workspaces, and WASM assets
 * @see https://docs.expo.dev/guides/customizing-metro/
 */
const { resolve } = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

// @ts-check
/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Get monorepo root (two levels up from apps/mobile)
const monorepoRoot = resolve(__dirname, '..', '..');

// ============================================================================
// Watch Folders (Monorepo Support)
// ============================================================================
const existingWatchFolders = config.watchFolders ?? [];
config.watchFolders = existingWatchFolders.includes(monorepoRoot)
  ? existingWatchFolders
  : [...existingWatchFolders, monorepoRoot];

// ============================================================================
// Node Modules Resolution
// ============================================================================
config.resolver.nodeModulesPaths = [
  resolve(__dirname, 'node_modules'),
  resolve(monorepoRoot, 'node_modules'),
];

// Ensure proper resolution order for React Native monorepos
config.resolver.disableHierarchicalLookup = false;

// ============================================================================
// Block List (Exclude from Bundling)
// ============================================================================
// Normalize path for cross-platform regex compatibility and escape for RegExp
const normalizedRoot = monorepoRoot.replace(/\\/g, '/');
const escapedRoot = normalizedRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
config.resolver.blockList = [
  // Exclude Extra folder (archived docs/temp files)
  new RegExp(`${escapedRoot}/Extra/.*`),
  // Exclude Supabase CLI folder
  new RegExp(`${escapedRoot}/supabase/.*`),
  // Exclude git internals
  new RegExp(`${escapedRoot}/\\.git/.*`),
  // Exclude test coverage
  new RegExp(`${escapedRoot}/coverage/.*`),
];

// ============================================================================
// Asset Extensions (WASM for expo-sqlite web support)
// ============================================================================
config.resolver.assetExts = [...config.resolver.assetExts, 'wasm'];
config.resolver.sourceExts = config.resolver.sourceExts.filter((ext) => ext !== 'wasm');

// ============================================================================
// Uniwind Configuration
// ============================================================================
module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
});
