/**
 * useSponsorInfo Hook
 * 
 * Fetches sponsor information for quick-dial in crisis situations
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export interface SponsorInfo {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship_notes?: string;
}

export function useSponsorInfo(userId: string) {
  const [sponsor, setSponsor] = useState<SponsorInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSponsor();
  }, [userId]);

  const fetchSponsor = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      const { data, error: queryError } = await supabase
        .from('sponsor_relationships')
        .select('sponsor:sponsor_id(*)')
        .eq('sponsee_id', userId)
        .eq('is_active', true)
        .single();

      if (queryError) {
        logger.error('Sponsor fetch failed', { error: queryError });
        setError(queryError.message);
        setSponsor(null);
        return;
      }

      if (data && data.sponsor) {
        setSponsor(data.sponsor as SponsorInfo);
      }
    } catch (err) {
      logger.error('Sponsor fetch error', { error: err });
      setError('Failed to load sponsor');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sponsor,
    isLoading,
    error,
    refetch: fetchSponsor,
  };
}
