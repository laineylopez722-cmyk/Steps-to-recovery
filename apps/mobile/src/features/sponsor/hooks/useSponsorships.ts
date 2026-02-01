import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { logger } from '../../../utils/logger';

export interface Sponsorship {
  id: string;
  sponsor_id: string;
  sponsee_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
}

export function useSponsorships() {
  const { user } = useAuth();
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSponsorships = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('sponsorships')
        .select('*')
        .or(`sponsor_id.eq.${user.id},sponsee_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setSponsorships(data || []);
      setError(null);
    } catch (err) {
      logger.error('Failed to fetch sponsorships', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSponsorships();
  }, [fetchSponsorships]);

  const sendRequest = useCallback(
    async (sponsorEmail: string): Promise<void> => {
      if (!user) throw new Error('Not authenticated');

      try {
        // Find sponsor by email in profiles
        const { data: sponsorProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', sponsorEmail.toLowerCase())
          .single();

        if (profileError || !sponsorProfile) {
          throw new Error('Sponsor not found with that email');
        }

        if (sponsorProfile.id === user.id) {
          throw new Error('Cannot sponsor yourself');
        }

        // Create sponsorship request
        const { error: insertError } = await supabase.from('sponsorships').insert({
          sponsor_id: sponsorProfile.id,
          sponsee_id: user.id,
          status: 'pending',
        });

        if (insertError) throw insertError;

        await fetchSponsorships();
        logger.info('Sponsor request sent successfully');
      } catch (err) {
        logger.error('Failed to send sponsor request', err);
        throw err;
      }
    },
    [user, fetchSponsorships],
  );

  const acceptRequest = useCallback(
    async (sponsorshipId: string): Promise<void> => {
      try {
        const { error } = await supabase
          .from('sponsorships')
          .update({ status: 'accepted' })
          .eq('id', sponsorshipId);

        if (error) throw error;

        await fetchSponsorships();
        logger.info('Sponsor request accepted');
      } catch (err) {
        logger.error('Failed to accept request', err);
        throw err;
      }
    },
    [fetchSponsorships],
  );

  const declineRequest = useCallback(
    async (sponsorshipId: string): Promise<void> => {
      try {
        const { error } = await supabase
          .from('sponsorships')
          .update({ status: 'declined' })
          .eq('id', sponsorshipId);

        if (error) throw error;

        await fetchSponsorships();
        logger.info('Sponsor request declined');
      } catch (err) {
        logger.error('Failed to decline request', err);
        throw err;
      }
    },
    [fetchSponsorships],
  );

  const removeSponsor = useCallback(
    async (sponsorshipId: string): Promise<void> => {
      try {
        const { error } = await supabase.from('sponsorships').delete().eq('id', sponsorshipId);

        if (error) throw error;

        await fetchSponsorships();
        logger.info('Sponsor removed');
      } catch (err) {
        logger.error('Failed to remove sponsor', err);
        throw err;
      }
    },
    [fetchSponsorships],
  );

  // Filter helpers
  const mySponsor = sponsorships.find((s) => s.sponsee_id === user?.id && s.status === 'accepted');

  const mySponsees = sponsorships.filter(
    (s) => s.sponsor_id === user?.id && s.status === 'accepted',
  );

  const pendingRequests = sponsorships.filter(
    (s) => s.sponsor_id === user?.id && s.status === 'pending',
  );

  const sentRequests = sponsorships.filter(
    (s) => s.sponsee_id === user?.id && s.status === 'pending',
  );

  return {
    sponsorships,
    loading,
    error,
    mySponsor,
    mySponsees,
    pendingRequests,
    sentRequests,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeSponsor,
    refresh: fetchSponsorships,
  };
}
