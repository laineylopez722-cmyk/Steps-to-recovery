import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * @param {string} relativePath
 * @returns {any}
 */
function readJson(relativePath) {
  const fullPath = resolve(process.cwd(), relativePath);
  const content = readFileSync(fullPath, 'utf8');
  return JSON.parse(content);
}

/**
 * @param {string[]} failures
 * @param {boolean} condition
 * @param {string} message
 * @param {string} fix
 */
function assertCondition(failures, condition, message, fix) {
  if (!condition) {
    failures.push(`${message}\n    Fix: ${fix}`);
  }
}

const failures = [];
const rootPackage = readJson('package.json');
const mobilePackage = readJson('apps/mobile/package.json');
const nvmrc = readFileSync(resolve(process.cwd(), '.nvmrc'), 'utf8').trim();

const expectedPackageManager = rootPackage.packageManager;
const expectedNodeMajor = 20;
const expectedNpmMajor = Number(expectedPackageManager.split('@')[1].split('.')[0]);

const currentNodeMajor = Number(process.versions.node.split('.')[0]);
const currentNpmVersion = execSync('npm -v', { encoding: 'utf8' }).trim();
const currentNpmMajor = Number(currentNpmVersion.split('.')[0]);

assertCondition(
  failures,
  expectedPackageManager.startsWith('npm@'),
  `packageManager must be npm-based. Found "${expectedPackageManager}".`,
  `Edit package.json → set "packageManager": "npm@${expectedNpmMajor}.x.x"`,
);
assertCondition(
  failures,
  currentNodeMajor >= expectedNodeMajor,
  `Node major must be >= ${expectedNodeMajor}. Found ${process.versions.node}.`,
  `Run: nvm install ${expectedNodeMajor} && nvm use ${expectedNodeMajor}  (or see .nvmrc)`,
);
assertCondition(
  failures,
  currentNpmMajor === expectedNpmMajor,
  `npm major must be ${expectedNpmMajor}. Found ${currentNpmVersion}.`,
  `Run: npm install -g npm@${expectedNpmMajor}`,
);
assertCondition(
  failures,
  nvmrc === String(expectedNodeMajor),
  `.nvmrc must be "${expectedNodeMajor}".`,
  `Run: echo ${expectedNodeMajor} > .nvmrc`,
);

assertCondition(
  failures,
  mobilePackage.scripts['type-check'] === 'npm exec -- tsc --noEmit',
  'apps/mobile/package.json script "type-check" must be "npm exec -- tsc --noEmit".',
  'Edit apps/mobile/package.json → set scripts.type-check to "npm exec -- tsc --noEmit"',
);

if (failures.length > 0) {
  console.error('Toolchain doctor found issues:\n');
  for (const failure of failures) {
    console.error(`  ✗ ${failure}\n`);
  }
  process.exit(1);
}

if (currentNodeMajor !== expectedNodeMajor) {
  console.warn(
    `Toolchain doctor warning: expected Node ${expectedNodeMajor}.x (from .nvmrc), running ${process.versions.node}.`,
  );
}

console.log('Toolchain doctor passed.');
