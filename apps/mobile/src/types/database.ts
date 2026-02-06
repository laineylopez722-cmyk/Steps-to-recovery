// Minimal Supabase database types placeholder to satisfy type-checks
// Replace with generated types when available
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public?: {
    Tables?: Record<string, unknown>;
    Views?: Record<string, unknown>;
    Functions?: Record<string, unknown>;
  };
}
