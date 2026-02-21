/**
 * Mock for react-native-css-interop/jsx-runtime
 * Used by NativeWind for JSX transformation
 */
import { createElement, Fragment as _Fragment } from 'react/jsx-runtime';

/**
 * @typedef {string | React.ComponentType<any>} ElementType
 * @typedef {Record<string, any> | null} Props
 * @typedef {string | number | undefined} Key
 */

export function jsx(type, props, key) { return createElement(type, { ...props, key }); }
export function jsxs(type, props, key) { return createElement(type, { ...props, key }); }
export const Fragment = _Fragment;
