// Metro configuration for Expo using CommonJS syntax
// Ensures .wasm assets (expo-sqlite web) are bundled correctly and supports monorepo paths.
const { resolve } = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {string} Absolute path to the mobile app directory */
const projectRoot = __dirname;

/** @type {string} Absolute path to the monorepo root (two levels up from mobile app) */
const monorepoRoot = resolve(projectRoot, '..', '..');

/** @type {import('expo/metro-config').MetroConfig} Metro bundler configuration object */
const config = getDefaultConfig(projectRoot);

// Allow importing files from the monorepo root (e.g., ../../index.ts) when bundling release.
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  resolve(projectRoot, 'node_modules'),
  resolve(monorepoRoot, 'node_modules'),
];

// Exclude reference/documentation folders from Metro bundler to prevent conflicts
config.resolver.blockList = [
  // Exclude reference screens (documentation only)
  new RegExp(`${monorepoRoot.replace(/\\/g, '\\\\')}\\\\_bmad-output.*`),
  // Exclude supabase folder
  new RegExp(`${monorepoRoot.replace(/\\/g, '\\\\')}\\\\supabase.*`),
];

// Treat wasm as an asset so Metro bundles the provided wa-sqlite.wasm
config.resolver.assetExts = [...config.resolver.assetExts, 'wasm'];
config.resolver.sourceExts = config.resolver.sourceExts.filter((ext) => {
  return ext !== 'wasm';
});

module.exports = withNativeWind(config, { input: './global.css' });
