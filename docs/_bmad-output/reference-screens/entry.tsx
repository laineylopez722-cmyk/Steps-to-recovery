// Ensure polyfills load before the rest of the app (including expo-router and any modules
// that may access web APIs like localStorage during SSR/web builds).
import '../polyfills';

// Continue with the standard Expo Router entry.
import 'expo-router/entry';

// Provide a default export to satisfy Expo Router route scanning in app/.
export default function AppEntry() {
  return null;
}

