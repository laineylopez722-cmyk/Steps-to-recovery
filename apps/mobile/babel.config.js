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
            test: [/[/\\]apps[/\\]mobile[/\\]src[/\\]/, /^\.\/src[/\\]/],
            plugins: ['babel-plugin-dynamic-import-node'],
          },
        ],
        // In test mode, exclude most node_modules for speed — only transform packages
        // that ship TypeScript/JSX source (react-native field or .mjs with JSX).
        // In Metro (EAS/dev builds), NO exclude is applied — babel-preset-expo handles
        // all packages correctly including those that ship TS/JSX source files.
        exclude: [
          /node_modules\/(?!(.pnpm|(jest-)?react-native(-[^/]*)?|@react-native(-[^/]*)?|expo(-[^/]*)?|@expo(-[^/]*)?|@unimodules|nativewind|uniwind|@react-navigation(-[^/]*)?|@sentry\/react-native|@gorhom(-[^/]*)?|@rn-primitives(-[^/]*)?|@hookform(-[^/]*)?|react-hook-form|react-freeze|@tanstack(-[^/]*)?|@supabase(-[^/]*)?|@shopify(-[^/]*)?)\/).*/,
        ],
      }
      : {}),
  };
};
