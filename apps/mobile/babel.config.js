// Ensure critical polyfills (e.g., localStorage shim) are loaded before Metro parses the app.
// CRITICAL: Must be CommonJS for Metro compatibility
import './polyfills.cjs';

/** @param {import('@babel/core').ConfigAPI} api */
export default function (api) {
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
