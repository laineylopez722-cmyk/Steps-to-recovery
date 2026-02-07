/**
 * Shadow System - iOS Style
 * 
 * Subtle, refined shadows for elevation hierarchy
 * Platform-specific: iOS uses shadow props, Android uses elevation
 */

import { Platform } from 'react-native';

interface ShadowStyle {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}

// ============================================================================
// LIGHT MODE SHADOWS
// ============================================================================

export const shadowSm: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  android: { elevation: 2 },
  default: {},
}) as ShadowStyle;

export const shadowMd: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  android: { elevation: 4 },
  default: {},
}) as ShadowStyle;

export const shadowLg: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  android: { elevation: 8 },
  default: {},
}) as ShadowStyle;

export const shadowXl: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  android: { elevation: 12 },
  default: {},
}) as ShadowStyle;

// ============================================================================
// DARK MODE SHADOWS (slightly more visible)
// ============================================================================

export const shadowSmDark: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  android: { elevation: 2 },
  default: {},
}) as ShadowStyle;

export const shadowMdDark: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  android: { elevation: 4 },
  default: {},
}) as ShadowStyle;

export const shadowLgDark: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  android: { elevation: 8 },
  default: {},
}) as ShadowStyle;

export const shadowXlDark: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  android: { elevation: 12 },
  default: {},
}) as ShadowStyle;

// ============================================================================
// GLOW SHADOWS (accent - use sparingly)
// ============================================================================

export const glowPrimary: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  android: { elevation: 6 },
  default: {},
}) as ShadowStyle;

export const glowSuccess: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#30D158',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  android: { elevation: 4 },
  default: {},
}) as ShadowStyle;

export const glowDanger: ShadowStyle = Platform.select({
  ios: {
    shadowColor: '#FF453A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  android: { elevation: 4 },
  default: {},
}) as ShadowStyle;

// ============================================================================
// EXPORTS
// ============================================================================

export const shadows = {
  // Light mode
  sm: shadowSm,
  md: shadowMd,
  lg: shadowLg,
  xl: shadowXl,
  // Dark mode
  smDark: shadowSmDark,
  mdDark: shadowMdDark,
  lgDark: shadowLgDark,
  xlDark: shadowXlDark,
  // Glow
  glowPrimary,
  glowSuccess,
  glowDanger,
} as const;

export type ShadowKey = keyof typeof shadows;
