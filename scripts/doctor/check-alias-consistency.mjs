import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/**
 * @param {string} relativePath
 * @returns {any}
 */
function readJson(relativePath) {
  const fullPath = resolve(process.cwd(), relativePath);
  return JSON.parse(readFileSync(fullPath, 'utf8'));
}

/**
 * @param {string[]} failures
 * @param {string} label
 * @param {unknown} actual
 * @param {unknown} expected
 * @param {string} fix
 */
function assertDeepEqual(failures, label, actual, expected, fix) {
  if (!isDeepStrictEqual(actual, expected)) {
    failures.push(
      `${label} mismatch.\n    Expected: ${JSON.stringify(expected, null, 2)}\n    Actual: ${JSON.stringify(actual, null, 2)}\n    Fix: ${fix}`,
    );
  }
}

const failures = [];
const aliasContract = readJson('apps/mobile/config/import-aliases.json');
const mobileTsConfig = readJson('apps/mobile/tsconfig.json');
const componentsConfig = readJson('apps/mobile/components.json');
const rootTsConfig = readJson('tsconfig.json');

assertDeepEqual(
  failures,
  'apps/mobile/tsconfig.json compilerOptions.paths',
  mobileTsConfig.compilerOptions.paths,
  aliasContract.tsconfigPaths,
  'Copy tsconfigPaths from apps/mobile/config/import-aliases.json into apps/mobile/tsconfig.json → compilerOptions.paths',
);
assertDeepEqual(
  failures,
  'apps/mobile/components.json aliases',
  componentsConfig.aliases,
  aliasContract.componentsAliases,
  'Copy componentsAliases from apps/mobile/config/import-aliases.json into apps/mobile/components.json → aliases',
);

const babelFactory = require(resolve(process.cwd(), 'apps/mobile/babel.config.js'));
const babelConfig = babelFactory({
  cache: { using: () => undefined },
  env: () => false,
});
const moduleResolverPlugin = babelConfig.plugins.find(
  /**
   * @param {unknown} plugin
   */
  (plugin) => Array.isArray(plugin) && plugin[0] === 'module-resolver',
);
const babelAlias =
  Array.isArray(moduleResolverPlugin) &&
  typeof moduleResolverPlugin[1] === 'object' &&
  moduleResolverPlugin[1] !== null
    ? moduleResolverPlugin[1].alias
    : undefined;
assertDeepEqual(
  failures,
  'apps/mobile/babel.config.js module-resolver alias',
  babelAlias,
  aliasContract.babelModuleResolverAlias,
  'Update apps/mobile/babel.config.js → module-resolver plugin alias to match babelModuleResolverAlias in apps/mobile/config/import-aliases.json',
);

const jestConfig = require(resolve(process.cwd(), 'apps/mobile/jest.config.js'));
for (const [mapperKey, mapperValue] of Object.entries(aliasContract.jestModuleNameMapper)) {
  if (jestConfig.moduleNameMapper[mapperKey] !== mapperValue) {
    failures.push(
      `apps/mobile/jest.config.js moduleNameMapper["${mapperKey}"] must be "${mapperValue}" but was "${jestConfig.moduleNameMapper[mapperKey]}".\n    Fix: Edit apps/mobile/jest.config.js → set moduleNameMapper["${mapperKey}"] = "${mapperValue}"`,
    );
  }
}

if (rootTsConfig.compilerOptions.baseUrl !== undefined) {
  failures.push('tsconfig.json should not define compilerOptions.baseUrl for mobile-only aliases.\n    Fix: Remove compilerOptions.baseUrl from the root tsconfig.json');
}
if (rootTsConfig.compilerOptions.paths !== undefined) {
  failures.push('tsconfig.json should not define compilerOptions.paths for mobile-only aliases.\n    Fix: Remove compilerOptions.paths from the root tsconfig.json');
}

if (failures.length > 0) {
  console.error('Alias consistency doctor found issues:\n');
  for (const failure of failures) {
    console.error(`  ✗ ${failure}\n`);
  }
  console.error('  Source of truth: apps/mobile/config/import-aliases.json');
  process.exit(1);
}

console.log('Alias consistency doctor passed.');

