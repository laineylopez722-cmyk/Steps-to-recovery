#!/usr/bin/env node

const { spawnSync, spawn } = require('child_process');
const path = require('path');

function resolveAdb() {
  const sdkRoot = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (sdkRoot) {
    const exe = process.platform === 'win32' ? 'adb.exe' : 'adb';
    return path.join(sdkRoot, 'platform-tools', exe);
  }
  return 'adb';
}

function runOrThrow(command, args, label) {
  const result = spawnSync(command, args, {
    stdio: 'pipe',
    encoding: 'utf8',
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    const stdout = (result.stdout || '').trim();
    const detail = stderr || stdout || `exit code ${result.status}`;
    throw new Error(`${label} failed: ${detail}`);
  }

  return result.stdout || '';
}

function getAttachedDeviceIds(adbPath) {
  const output = runOrThrow(adbPath, ['devices'], 'adb devices');
  return output
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => /\bdevice\b/.test(line) && !/\boffline\b|\bunauthorized\b/.test(line))
    .map((line) => line.split(/\s+/)[0]);
}

function reversePort(adbPath, deviceId, port) {
  runOrThrow(adbPath, ['-s', deviceId, 'reverse', `tcp:${port}`, `tcp:${port}`], `adb reverse ${port}`);
}

function main() {
  const adbPath = resolveAdb();

  try {
    runOrThrow(adbPath, ['start-server'], 'adb start-server');
  } catch (error) {
    console.warn(`[android:dev] Could not start adb server: ${error.message}`);
  }

  let deviceIds = [];
  try {
    deviceIds = getAttachedDeviceIds(adbPath);
  } catch (error) {
    console.warn(`[android:dev] Could not enumerate adb devices: ${error.message}`);
  }

  if (deviceIds.length === 0) {
    console.warn('[android:dev] No attached Android device detected. Falling back to LAN dev client startup.');
    const expo = spawn('npx', ['expo', 'start', '--dev-client', '--android'], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: process.env,
    });

    expo.on('exit', (code) => process.exit(code ?? 0));
    return;
  }

  const deviceId = deviceIds[0];
  for (const port of ['8081', '19000', '19001']) {
    try {
      reversePort(adbPath, deviceId, port);
      console.log(`[android:dev] Reversed tcp:${port} for ${deviceId}`);
    } catch (error) {
      console.warn(`[android:dev] ${error.message}`);
    }
  }

  const env = {
    ...process.env,
    REACT_NATIVE_PACKAGER_HOSTNAME: '127.0.0.1',
  };

  const expo = spawn('npx', ['expo', 'start', '--dev-client', '--android', '--localhost'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env,
  });

  expo.on('exit', (code) => process.exit(code ?? 0));
}

main();
