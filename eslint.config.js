// https://docs.expo.dev/guides/using-eslint/

import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat';

export default defineConfig([
  expoConfig,
]);

export const ignores = [
  'dist/**',
  'node_modules/**',
  'coverage/**',
  'build/**',
  'ios/**',
  'android/**',
];
