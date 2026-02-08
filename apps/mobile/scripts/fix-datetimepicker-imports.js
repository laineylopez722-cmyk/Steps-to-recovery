const { existsSync, readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

/**
 * Workaround for a broken publish of @react-native-community/datetimepicker where
 * android/src/main/java/.../Common.java is missing Android imports for DialogInterface and Resources,
 * which breaks Android compilation.
 *
 * This script is safe to run multiple times; it only inserts missing imports once.
 */
function main() {
  const targetFile = join(
    __dirname,
    '..',
    'node_modules',
    '@react-native-community',
    'datetimepicker',
    'android',
    'src',
    'main',
    'java',
    'com',
    'reactcommunity',
    'rndatetimepicker',
    'Common.java',
  );

  if (!existsSync(targetFile)) {
    // In some setups the package may be hoisted to the repo root node_modules.
    // Skip rather than failing the install.
    console.log('[postinstall] datetimepicker Common.java not found, skipping');
    return;
  }

  const src = readFileSync(targetFile, 'utf8');

  const requiredImports = [
    'import android.content.DialogInterface;',
    'import android.content.res.Resources;',
  ];

  const missing = requiredImports.filter((imp) => !src.includes(imp));
  if (missing.length === 0) return;

  const anchor = 'import android.content.Context;';
  if (!src.includes(anchor)) {
    console.warn('[postinstall] anchor import not found in datetimepicker Common.java; skipping');
    return;
  }

  const insertion = `${anchor}\n${missing.join('\n')}`;
  const next = src.replace(anchor, insertion);

  writeFileSync(targetFile, next, 'utf8');
  console.log(
    `[postinstall] patched datetimepicker Common.java (added ${missing.length} import(s))`,
  );
}

main();
