import { StyleSheet } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';

const clamp = (value: number, min = 0, max = 1): number => Math.min(max, Math.max(min, value));

export const sereneGlow = {
  subtle: {
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
  } as ViewStyle,
  soft: {
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 3,
  } as ViewStyle,
  focus: {
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 22,
    elevation: 4,
  } as ViewStyle,
} as const;

export const serenePillRow = {
  row: {
    gap: 8,
    padding: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
  } as ViewStyle,
  variants: {
    subtle: {
      pillBg: 'rgba(255,255,255,0.02)',
      pillText: 'rgba(255,255,255,0.65)',
      activeBg: 'rgba(245,158,11,0.20)',
      activeText: '#FFFFFF',
    },
    elevated: {
      pillBg: 'rgba(255,255,255,0.04)',
      pillText: 'rgba(255,255,255,0.8)',
      activeBg: 'rgba(245,158,11,0.28)',
      activeText: '#FFFFFF',
    },
    ghost: {
      pillBg: 'transparent',
      pillText: 'rgba(255,255,255,0.6)',
      activeBg: 'rgba(255,255,255,0.12)',
      activeText: '#FFFFFF',
    },
  },
  sizes: {
    sm: { minHeight: 30, paddingHorizontal: 10, borderRadius: 999 },
    md: { minHeight: 36, paddingHorizontal: 12, borderRadius: 999 },
    lg: { minHeight: 42, paddingHorizontal: 14, borderRadius: 999 },
  },
} as const;

export const sereneRing = {
  thickness: {
    sm: 4,
    md: 6,
    lg: 8,
  },
  track: {
    default: 'rgba(255,255,255,0.12)',
    muted: 'rgba(255,255,255,0.08)',
  },
  progress: {
    default: '#F59E0B',
    success: '#FBBF24',
    calm: '#0A84FF',
  },
} as const;

export function getSereneProgressBarStyles(options: {
  progress: number;
  height?: number;
  radius?: number;
  trackColor?: string;
  progressColor?: string;
}): { track: ViewStyle; fill: ViewStyle; clampedProgress: number } {
  const clampedProgress = clamp(options.progress);
  const height = options.height ?? 8;
  const radius = options.radius ?? 999;

  return {
    clampedProgress,
    track: {
      height,
      borderRadius: radius,
      overflow: 'hidden',
      backgroundColor: options.trackColor ?? sereneRing.track.default,
    },
    fill: {
      width: `${Math.round(clampedProgress * 100)}%`,
      height: '100%',
      borderRadius: radius,
      backgroundColor: options.progressColor ?? sereneRing.progress.default,
    },
  };
}

export function getSereneRingMetrics(options: {
  progress: number;
  radius: number;
  strokeWidth?: number;
}): {
  clampedProgress: number;
  circumference: number;
  dashOffset: number;
  strokeWidth: number;
} {
  const clampedProgress = clamp(options.progress);
  const strokeWidth = options.strokeWidth ?? sereneRing.thickness.md;
  const circumference = 2 * Math.PI * options.radius;

  return {
    clampedProgress,
    circumference,
    dashOffset: circumference * (1 - clampedProgress),
    strokeWidth,
  };
}

export const premiumTypographyAliases = {
  hero: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '700',
    letterSpacing: -0.8,
  } as TextStyle,
  displayTight: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.6,
  } as TextStyle,
  stat: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  } as TextStyle,
  labelStrong: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  } as TextStyle,
} as const;

export const backgroundTexture = {
  alpha: {
    off: 0,
    subtle: 0.03,
    soft: 0.05,
  },
  tint: {
    neutral: '255,255,255',
    warm: '245,158,11',
  },
} as const;

export function getSereneTextureOverlay(options?: {
  enabled?: boolean;
  strength?: keyof typeof backgroundTexture.alpha;
  tone?: keyof typeof backgroundTexture.tint;
}): ViewStyle {
  const enabled = options?.enabled ?? false;
  if (!enabled) return { opacity: 0 };

  const strength = options?.strength ?? 'subtle';
  const tone = options?.tone ?? 'neutral';

  return {
    ...StyleSheet.absoluteFillObject,
    opacity: 1,
    backgroundColor: `rgba(${backgroundTexture.tint[tone]}, ${backgroundTexture.alpha[strength]})`,
  };
}

export const serene = {
  glow: sereneGlow,
  pillRow: serenePillRow,
  ring: sereneRing,
  typography: premiumTypographyAliases,
  texture: backgroundTexture,
  helpers: {
    getSereneProgressBarStyles,
    getSereneRingMetrics,
    getSereneTextureOverlay,
  },
} as const;
