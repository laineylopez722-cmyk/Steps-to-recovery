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
 */
function assertDeepEqual(failures, label, actual, expected) {
  if (!isDeepStrictEqual(actual, expected)) {
    failures.push(
      `${label} mismatch.\nExpected: ${JSON.stringify(expected, null, 2)}\nActual: ${JSON.stringify(actual, null, 2)}`,
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
);
assertDeepEqual(
  failures,
  'apps/mobile/components.json aliases',
  componentsConfig.aliases,
  aliasContract.componentsAliases,
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
);

const jestConfig = require(resolve(process.cwd(), 'apps/mobile/jest.config.js'));
for (const [mapperKey, mapperValue] of Object.entries(aliasContract.jestModuleNameMapper)) {
  if (jestConfig.moduleNameMapper[mapperKey] !== mapperValue) {
    failures.push(
      `apps/mobile/jest.config.js moduleNameMapper["${mapperKey}"] must be "${mapperValue}" but was "${jestConfig.moduleNameMapper[mapperKey]}".`,
    );
  }
}

if (rootTsConfig.compilerOptions.baseUrl !== undefined) {
  failures.push('tsconfig.json should not define compilerOptions.baseUrl for mobile-only aliases.');
}
if (rootTsConfig.compilerOptions.paths !== undefined) {
  failures.push('tsconfig.json should not define compilerOptions.paths for mobile-only aliases.');
}

if (failures.length > 0) {
  console.error('Alias consistency doctor found issues:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Alias consistency doctor passed.');
