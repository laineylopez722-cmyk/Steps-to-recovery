/**
 * Mock for react-native-css-interop
 * Used by NativeWind for CSS-in-JS styling
 */

// cssInterop wraps a component to accept className prop
const cssInterop = (component) => component;

// remapProps maps className to style
const remapProps = (component, mapping) => component;

// StyleSheet mock - passes through to React Native StyleSheet
const { StyleSheet: RNStyleSheet } = require('react-native');

module.exports = {
  cssInterop,
  remapProps,
  StyleSheet: RNStyleSheet,
};
