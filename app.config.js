/**
 * Monorepo root: delegate Expo config to the mobile app so `npx expo` / `eas`
 * from the repository root resolve the same project as `cd apps/mobile`.
 */
module.exports = require('./apps/mobile/app.json');
