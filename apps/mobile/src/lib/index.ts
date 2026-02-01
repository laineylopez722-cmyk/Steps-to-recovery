/**
 * Library Exports
 *
 * Central export point for third-party integrations and utilities.
 *
 * **Available Exports**:
 * - `cn`: Utility for combining CSS classes
 * - `supabase`: Supabase client instance
 * - `notifications`: Notification utilities namespace
 *
 * @module lib
 */

export { cn } from './utils';
export { supabase } from './supabase';

// Notification utilities
export * as notifications from './notifications';
