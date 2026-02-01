/**
 * Mock for react-native-css-interop/jsx-runtime
 * Used by NativeWind for JSX transformation
 */
const React = require('react');

/**
 * @typedef {string | React.ComponentType<any>} ElementType
 * @typedef {Record<string, any> | null} Props
 * @typedef {string | number | undefined} Key
 */

module.exports = {
  /**
   * @param {ElementType} type
   * @param {Props} props
   * @param {Key} key
   * @returns {React.ReactElement}
   */
  jsx: (type, props, key) => React.createElement(type, { ...props, key }),
  /**
   * @param {ElementType} type
   * @param {Props} props
   * @param {Key} key
   * @returns {React.ReactElement}
   */
  jsxs: (type, props, key) => React.createElement(type, { ...props, key }),
  Fragment: React.Fragment,
};
