/**
 * Steps to Recovery - Application Entry Point
 *
 * This is the root entry point for the Expo application.
 * registerRootComponent ensures the app works correctly in:
 * - Expo Go (development)
 * - Development builds (expo-dev-client)
 * - Production builds (standalone apps)
 *
 * @see https://docs.expo.dev/versions/latest/sdk/register-root-component/
 */
import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
