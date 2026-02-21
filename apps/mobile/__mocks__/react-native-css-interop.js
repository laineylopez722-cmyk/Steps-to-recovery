/**
 * Mock for react-native-css-interop
 * Used by NativeWind for CSS-in-JS styling
 */

// cssInterop wraps a component to accept className prop
const cssInterop = (component) => component;

// remapProps maps className to style
const remapProps = (component) => component;

// StyleSheet mock - passes through to React Native StyleSheet
import { StyleSheet as RNStyleSheet } from react-native;

export default {
  cssInterop,
  remapProps,
  StyleSheet: RNStyleSheet,
};
