// Ensure critical polyfills (e.g., localStorage shim) are loaded before Metro parses the app.
// CRITICAL: Must be CommonJS for Metro and Jest compatibility
require('./polyfills.cjs');

/** @param {import('@babel/core').ConfigAPI} api */
module.exports = function (api) {
  api.cache.using(() => process.env.BABEL_ENV || process.env.NODE_ENV);
  const isTest = api.env('test');
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
          ...(isTest ? {} : { unstable_transformProfile: 'hermes-stable' }),
        },
      ],
      [
        '@babel/preset-react',
        {
          runtime: 'automatic',
        },
      ],
      [
        '@babel/preset-typescript',
        {
          isTSX: true,
          allExtensions: true,
        },
      ],
      'nativewind/babel',
    ],
    plugins: [
      '@babel/plugin-syntax-typescript',
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/contexts': './src/contexts',
            '@/features': './src/features',
            '@/hooks': './src/hooks',
            '@/lib': './src/lib',
            '@/utils': './src/utils',
            '@/design-system': './src/design-system',
            '@/navigation': './src/navigation',
            '@recovery/shared': '../../packages/shared/src',
          },
        },
      ],
      'react-native-reanimated/plugin', // Must be last
    ],
  };
};
