/**
 * useConfetti Hook
 *
 * Confetti celebration trigger with reduced motion support.
 * Warm color palette: amber, coral, sage.
 *
 * @example
 * ```tsx
 * const { particles, trigger, isActive, reset } = useConfetti({
 *   particleCount: 60,
 *   colors: ['#D4A855', '#E07A5F', '#8A9A7C'],
 * });
 *
 * // Trigger on milestone
 * <Button onPress={trigger}>Celebrate!</Button>
 *
 * {isActive && <ConfettiView particles={particles} />}
 * ```
 */

import { useCallback, useState } from 'react';
import { Dimensions } from 'react-native';
import { useReducedMotion } from '../presets/motion';

// ============================================================================
// TYPES
// ============================================================================

/** Confetti particle */
export interface ConfettiParticle {
  id: string;
  x: number;
  y: number;
  color: string;
  size: number;
  shape: 'circle' | 'square' | 'triangle';
  rotation: number;
  velocityX: number;
  velocityY: number;
  rotationSpeed: number;
  delay: number;
  opacity: number;
}

/** Confetti configuration */
export interface UseConfettiOptions {
  /** Number of particles */
  particleCount?: number;
  /** Origin point (defaults to screen center) */
  origin?: { x: number; y: number };
  /** Colors to use (defaults to warm palette) */
  colors?: string[];
  /** Gravity strength (0-1) */
  gravity?: number;
  /** Spread angle in degrees (0-360) */
  spread?: number;
  /** Particle size range [min, max] */
  sizeRange?: [number, number];
  /** Shapes to use */
  shapes?: Array<'circle' | 'square' | 'triangle'>;
  /** Animation duration in ms */
  duration?: number;
  /** Fade out duration in ms */
  fadeDuration?: number;
}

/** Confetti animation result */
export interface UseConfettiReturn {
  /** Array of confetti particles */
  particles: ConfettiParticle[];
  /** Trigger the confetti animation */
  trigger: () => void;
  /** Reset/clear confetti */
  reset: () => void;
  /** Whether confetti is currently active */
  isActive: boolean;
  /** Whether reduced motion is enabled (confetti disabled) */
  isReducedMotion: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Warm color palette for celebrations */
export const WARM_COLORS = {
  /** Sage green - primary brand */
  sage: ['#8A9A7C', '#9DAD8F', '#6B7B5E', '#A5B598'],
  /** Amber/gold - warmth */
  amber: ['#D4A855', '#E0B860', '#B89440', '#C9A050'],
  /** Coral - energy */
  coral: ['#E07A5F', '#E8917A', '#C46B52', '#F0A090'],
  /** Cream - soft accent */
  cream: ['#F5F5DC', '#E8DCC6', '#D4C5A9', '#FFF8E7'],
  /** Teal - balance */
  teal: ['#5A8A8A', '#6B9B9B', '#4A7A7A', '#7AB5B5'],
} as const;

/** Default warm palette (flattened) */
export const DEFAULT_COLORS: string[] = [
  ...WARM_COLORS.sage,
  ...WARM_COLORS.amber,
  ...WARM_COLORS.coral,
  ...WARM_COLORS.cream,
  ...WARM_COLORS.teal,
];

/** Default configuration */
const DEFAULT_OPTIONS: Required<UseConfettiOptions> = {
  particleCount: 60,
  origin: { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 3 },
  colors: DEFAULT_COLORS,
  gravity: 0.8,
  spread: 360,
  sizeRange: [8, 16],
  shapes: ['circle', 'square', 'triangle'],
  duration: 2500,
  fadeDuration: 500,
};

// ============================================================================
// PARTICLE GENERATION
// ============================================================================

/**
 * Generate a random confetti particle
 */
function generateParticle(index: number, config: Required<UseConfettiOptions>): ConfettiParticle {
  const { origin, colors, sizeRange, shapes, spread } = config;
  const [minSize, maxSize] = sizeRange;

  // Random angle within spread
  const angle = (index / config.particleCount) * Math.PI * 2;
  const spreadRad = (spread * Math.PI) / 180;
  const angleOffset = (Math.random() - 0.5) * spreadRad;
  const finalAngle = angle + angleOffset;

  // Random velocity
  const velocity = Math.random() * 300 + 200;

  return {
    id: `particle-${index}-${Date.now()}`,
    x: origin.x,
    y: origin.y,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * (maxSize - minSize) + minSize,
    shape: shapes[Math.floor(Math.random() * shapes.length)],
    rotation: Math.random() * 360,
    velocityX: Math.cos(finalAngle) * velocity,
    velocityY: Math.sin(finalAngle) * velocity - 200, // Initial upward burst
    rotationSpeed: (Math.random() - 0.5) * 720,
    delay: Math.random() * 200,
    opacity: 1,
  };
}

/**
 * Generate all confetti particles
 */
function generateParticles(config: Required<UseConfettiOptions>): ConfettiParticle[] {
  return Array.from({ length: config.particleCount }, (_, i) => generateParticle(i, config));
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for confetti celebrations
 * Respects reduced motion (disabled if on)
 * @param options - Confetti configuration
 * @returns Confetti controls and particles
 */
export function useConfetti(options: UseConfettiOptions = {}): UseConfettiReturn {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const isReducedMotion = useReducedMotion();

  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const [isActive, setIsActive] = useState(false);

  // Trigger confetti animation
  const trigger = useCallback(() => {
    // Don't show confetti if reduced motion is enabled
    if (isReducedMotion) {
      return;
    }

    const newParticles = generateParticles(config);
    setParticles(newParticles);
    setIsActive(true);

    // Auto-cleanup after duration
    const totalDuration = config.duration + config.fadeDuration;
    setTimeout(() => {
      setIsActive(false);
      setParticles([]);
    }, totalDuration);
  }, [config, isReducedMotion]);

  // Reset confetti
  const reset = useCallback(() => {
    setIsActive(false);
    setParticles([]);
  }, []);

  return {
    particles,
    trigger,
    reset,
    isActive,
    isReducedMotion,
  };
}

// ============================================================================
// PRESETS
// ============================================================================

/** Subtle confetti preset */
export function useSubtleConfetti(
  options: Omit<UseConfettiOptions, 'particleCount'> = {},
): UseConfettiReturn {
  return useConfetti({
    particleCount: 30,
    sizeRange: [6, 12],
    ...options,
  });
}

/** Grand confetti preset */
export function useGrandConfetti(
  options: Omit<UseConfettiOptions, 'particleCount'> = {},
): UseConfettiReturn {
  return useConfetti({
    particleCount: 100,
    sizeRange: [8, 20],
    ...options,
  });
}

/** Center burst preset */
export function useCenterBurstConfetti(
  options: Omit<UseConfettiOptions, 'origin'> = {},
): UseConfettiReturn {
  return useConfetti({
    origin: { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 },
    spread: 360,
    ...options,
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useConfetti;
