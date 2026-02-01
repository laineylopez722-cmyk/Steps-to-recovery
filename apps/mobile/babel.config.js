// Ensure critical polyfills (e.g., localStorage shim) are loaded before Metro parses the app.
// CRITICAL: Must be CommonJS for Metro compatibility
require('./polyfills.cjs');

/** @param {import('@babel/core').ConfigAPI} api */
module.exports = function (api) {
  api.cache.forever();
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/lib': './src/lib',
            '@/design-system': './src/design-system',
          },
        },
      ],
      'react-native-reanimated/plugin', // Must be last
    ],
  };
};
