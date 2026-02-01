/**
 * Utility Functions
 *
 * Shared utility functions for common operations.
 *
 * @module lib/utils
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with conflict resolution
 *
 * Combines `clsx` for conditional classes with `tailwind-merge` for
 * intelligent conflict resolution. When conflicting classes are provided,
 * the last one wins (e.g., `px-4` and `px-8` → `px-8`).
 *
 * @param inputs - Class values (strings, objects, arrays, conditionals)
 * @returns Merged class string
 * @example
 * ```ts
 * // Basic usage
 * cn('px-4 py-2', 'bg-blue-500')
 * // => 'px-4 py-2 bg-blue-500'
 *
 * // Conditional classes
 * cn('btn', isActive && 'btn-active', isDisabled && 'opacity-50')
 *
 * // Conflict resolution (last class wins)
 * cn('px-4', 'px-8')
 * // => 'px-8' (tailwind-merge removes the conflict)
 *
 * // Object syntax
 * cn({ 'bg-red-500': hasError, 'bg-green-500': !hasError })
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
