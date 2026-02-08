/**
 * useSponsorInfo Hook
 *
 * Fetches sponsor information for quick-dial in crisis situations
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export interface SponsorInfo {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship_notes?: string;
}

interface UseSponsorInfoResult {
  sponsor: SponsorInfo | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function isMissingTableError(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return code === 'PGRST205' || code === '42P01';
}

export function useSponsorInfo(userId: string): UseSponsorInfoResult {
  const [sponsor, setSponsor] = useState<SponsorInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSponsor = useCallback(async (): Promise<void> => {
    if (!userId) {
      setSponsor(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // The current schema stores sponsorship links in `sponsorships`.
      const { data: sponsorship, error: sponsorshipError } = await supabase
        .from('sponsorships')
        .select('sponsor_id')
        .eq('sponsee_id', userId)
        .eq('status', 'accepted')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sponsorshipError) {
        // In some environments this table is not provisioned yet.
        // Treat as unavailable rather than a hard runtime error.
        if (isMissingTableError(sponsorshipError)) {
          logger.warn('Sponsor relationships table not available; skipping sponsor fetch', {
            code: (sponsorshipError as { code?: string }).code,
          });
          setSponsor(null);
          setError(null);
          return;
        }

        logger.warn('Sponsor relationship fetch failed', { error: sponsorshipError });
        setError(sponsorshipError.message);
        setSponsor(null);
        return;
      }

      if (!sponsorship) {
        setSponsor(null);
        setError(null);
        return;
      }

      // Resolve sponsor profile. Current schema guarantees `email`; phone is not yet modeled.
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', sponsorship.sponsor_id)
        .maybeSingle();

      if (profileError) {
        if (isMissingTableError(profileError)) {
          logger.warn('Profiles table not available; skipping sponsor profile fetch', {
            code: (profileError as { code?: string }).code,
          });
          setSponsor(null);
          setError(null);
          return;
        }

        logger.warn('Sponsor profile fetch failed', { error: profileError });
        setError(profileError.message);
        setSponsor(null);
        return;
      }

      if (!profile) {
        setSponsor(null);
        setError('Sponsor profile not found');
        return;
      }

      const fallbackName = profile.email?.split('@')[0] || 'Sponsor';

      setSponsor({
        id: profile.id,
        email: profile.email,
        name: fallbackName,
        phone: '',
      });
      setError(null);
    } catch (err) {
      logger.warn('Sponsor fetch error', { error: err });
      setError('Failed to load sponsor');
      setSponsor(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void fetchSponsor();
  }, [fetchSponsor]);

  return {
    sponsor,
    isLoading,
    error,
    refetch: fetchSponsor,
  };
}

