/**
 * Mock for react-native-css-interop/jsx-runtime
 * Used by NativeWind for JSX transformation
 */
const React = require('react');

module.exports = {
  jsx: (type, props, key) => React.createElement(type, { ...props, key }),
  jsxs: (type, props, key) => React.createElement(type, { ...props, key }),
  Fragment: React.Fragment,
};
