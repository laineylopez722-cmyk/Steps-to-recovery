'use strict';

const optionalNativeModules = {
  ExpoHaptics: {
    notificationAsync: () => Promise.resolve(),
    impactAsync: () => Promise.resolve(),
    selectionAsync: () => Promise.resolve(),
    performHapticsAsync: () => Promise.resolve(),
  },
};

function requireOptionalNativeModule(name) {
  return optionalNativeModules[name] ?? null;
}

function requireNativeModule(name) {
  return optionalNativeModules[name] ?? null;
}

function registerRootComponent(component) {
  return component;
}

module.exports = {
  requireOptionalNativeModule,
  requireNativeModule,
  registerRootComponent,
};
