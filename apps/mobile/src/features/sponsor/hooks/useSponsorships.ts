import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

  const queryKey = ['sponsorships', user?.id];

  const {
    data: sponsorships = [],
    isLoading: loading,
    error,
  } = useQuery<Sponsorship[], Error>({
    queryKey,
    queryFn: async (): Promise<Sponsorship[]> => {
      if (!user) return [];

      const { data, error: fetchError } = await supabase
        .from('sponsorships')
        .select('*')
        .or(`sponsor_id.eq.${user.id},sponsee_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const sendRequestMutation = useMutation<void, Error, string>({
    mutationFn: async (sponsorEmail: string): Promise<void> => {
      if (!user) throw new Error('Not authenticated');

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
      logger.info('Sponsor request sent successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err) => {
      logger.error('Failed to send sponsor request', err);
    },
  });

  const acceptMutation = useMutation<void, Error, string>({
    mutationFn: async (sponsorshipId: string): Promise<void> => {
      const { error } = await supabase
        .from('sponsorships')
        .update({ status: 'accepted' })
        .eq('id', sponsorshipId);

      if (error) throw error;
      logger.info('Sponsor request accepted');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err) => {
      logger.error('Failed to accept request', err);
    },
  });

  const declineMutation = useMutation<void, Error, string>({
    mutationFn: async (sponsorshipId: string): Promise<void> => {
      const { error } = await supabase
        .from('sponsorships')
        .update({ status: 'declined' })
        .eq('id', sponsorshipId);

      if (error) throw error;
      logger.info('Sponsor request declined');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err) => {
      logger.error('Failed to decline request', err);
    },
  });

  const removeMutation = useMutation<void, Error, string>({
    mutationFn: async (sponsorshipId: string): Promise<void> => {
      const { error } = await supabase.from('sponsorships').delete().eq('id', sponsorshipId);

      if (error) throw error;
      logger.info('Sponsor removed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err) => {
      logger.error('Failed to remove sponsor', err);
    },
  });

  // Derived filter helpers
  const mySponsor = useMemo(
    () => sponsorships.find((s) => s.sponsee_id === user?.id && s.status === 'accepted'),
    [sponsorships, user?.id],
  );

  const mySponsees = useMemo(
    () => sponsorships.filter((s) => s.sponsor_id === user?.id && s.status === 'accepted'),
    [sponsorships, user?.id],
  );

  const pendingRequests = useMemo(
    () => sponsorships.filter((s) => s.sponsor_id === user?.id && s.status === 'pending'),
    [sponsorships, user?.id],
  );

  const sentRequests = useMemo(
    () => sponsorships.filter((s) => s.sponsee_id === user?.id && s.status === 'pending'),
    [sponsorships, user?.id],
  );

  return {
    sponsorships,
    loading,
    error: error ?? null,
    mySponsor,
    mySponsees,
    pendingRequests,
    sentRequests,
    sendRequest: sendRequestMutation.mutateAsync,
    acceptRequest: acceptMutation.mutateAsync,
    declineRequest: declineMutation.mutateAsync,
    removeSponsor: removeMutation.mutateAsync,
    refresh: () => queryClient.invalidateQueries({ queryKey }),
  };
}
