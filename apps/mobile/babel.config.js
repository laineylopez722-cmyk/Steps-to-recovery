/**
 * Babel configuration for Expo React Native
 * Supports Uniwind, Reanimated, and path aliases
 * @see https://docs.expo.dev/guides/typescript/#path-aliases
 */

// Load polyfills for Metro and Jest compatibility
require('./polyfills.cjs');
const importAliases = require('./config/import-aliases.json');

/** @param {import('@babel/core').ConfigAPI} api */
module.exports = function (api) {
  api.cache.using(() => {
    return process.env.BABEL_ENV || process.env.NODE_ENV || 'development';
  });

  const isTest = api.env('test');
  const isDevClient = process.env.EXPO_USE_DEV_CLIENT === '1';

  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Hermes stable transform for production builds
          ...(isTest || isDevClient ? {} : { unstable_transformProfile: 'hermes-stable' }),
          // Enable React 19 JSX transform
          jsxRuntime: 'automatic',
        },
      ],
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: importAliases.babelModuleResolverAlias,
          extensions: ['.ios.js', '.android.js', '.js', '.jsx', '.json', '.ts', '.tsx'],
        },
      ],
      // Strip Flow types used by React Native internals (safe for JS files)
      '@babel/plugin-transform-flow-strip-types',
      // Reanimated plugin must be last
      'react-native-reanimated/plugin',
    ],
    // Transform dynamic import() to require() in tests so Jest can mock them
    // Only apply to project source, not node_modules
    ...(isTest
      ? {
        overrides: [
          {
            test: ['./src/**'],
            plugins: ['babel-plugin-dynamic-import-node'],
          },
        ],
      }
      : {}),
    // Exclude node_modules from transformation except specific packages
    // Use patterns like expo(-[^/]*)? to match expo, expo-modules-core, expo-sqlite, etc.
    exclude: [
      /node_modules\/(?!(.pnpm|(jest-)?react-native(-[^/]*)?|@react-native(-[^/]*)?|expo(-[^/]*)?|@expo(-[^/]*)?|@unimodules|nativewind|uniwind|@react-navigation(-[^/]*)?|@sentry\/react-native|@gorhom(-[^/]*)?)\/).*/,
    ],
  };
};
