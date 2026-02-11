/**
 * useSponsorships Hook Test Suite
 *
 * Tests sponsorship functionality including:
 * - Fetching sponsorships
 * - Sending requests
 * - Accepting/declining requests
 * - Removing sponsors
 * - Filter helpers (mySponsor, mySponsees, pendingRequests, sentRequests)
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';

// Mock dependencies
const mockSupabaseFrom = jest.fn();
const mockSupabaseSelect = jest.fn();
const mockSupabaseInsert = jest.fn();
const mockSupabaseUpdate = jest.fn();
const mockSupabaseDelete = jest.fn();
const mockSupabaseEq = jest.fn();
const mockSupabaseOr = jest.fn();
const mockSupabaseOrder = jest.fn();
const mockSupabaseSingle = jest.fn();

jest.mock('../../../../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
  },
}));

jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'user-123', email: 'test@example.com' },
    session: { access_token: 'mock-token' },
  })),
}));

jest.mock('../../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Import hook after mocking
import { useSponsorships } from '../useSponsorships';
import { logger as mockLogger } from '../../../../utils/logger';

describe('useSponsorships', () => {
  const currentUserId = 'user-123';
  const currentUserEmail = 'test@example.com';

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup Supabase mock chain
    mockSupabaseOr.mockReturnValue({
      order: mockSupabaseOrder,
    });
    mockSupabaseOrder.mockResolvedValue({ data: [], error: null });
    mockSupabaseEq.mockReturnValue({ single: mockSupabaseSingle });
    mockSupabaseSingle.mockResolvedValue({ data: null, error: null });
    mockSupabaseSelect.mockReturnValue({ eq: mockSupabaseEq, or: mockSupabaseOr });
    mockSupabaseUpdate.mockReturnValue({ eq: mockSupabaseEq });
    mockSupabaseDelete.mockReturnValue({ eq: mockSupabaseEq });
    mockSupabaseInsert.mockResolvedValue({ error: null });
    mockSupabaseFrom.mockReturnValue({
      select: mockSupabaseSelect,
      insert: mockSupabaseInsert,
      update: mockSupabaseUpdate,
      delete: mockSupabaseDelete,
      or: mockSupabaseOr,
    });
  });

  describe('Fetching Sponsorships', () => {
    it('should fetch sponsorships on mount', async () => {
      const mockSponsorships = [
        {
          id: 'sponsorship-1',
          sponsor_id: 'sponsor-1',
          sponsee_id: currentUserId,
          status: 'accepted',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      mockSupabaseOrder.mockResolvedValue({ data: mockSponsorships, error: null });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('sponsorships');
      expect(mockSupabaseOr).toHaveBeenCalledWith(
        `sponsor_id.eq.${currentUserId},sponsee_id.eq.${currentUserId}`,
      );
      expect(result.current.sponsorships).toEqual(mockSponsorships);
      expect(result.current.error).toBe(null);
    });

    it('should handle fetch errors gracefully', async () => {
      mockSupabaseOrder.mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
      });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.sponsorships).toEqual([]);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to fetch sponsorships',
        expect.any(Object),
      );
    });

    it('should handle empty sponsorship list', async () => {
      mockSupabaseOrder.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.sponsorships).toEqual([]);
      expect(result.current.mySponsor).toBeUndefined();
      expect(result.current.mySponsees).toEqual([]);
    });
  });

  describe('Send Request', () => {
    it('should send sponsorship request successfully', async () => {
      const sponsorProfile = { id: 'sponsor-456' };
      mockSupabaseSingle
        .mockResolvedValueOnce({ data: sponsorProfile, error: null }) // Find sponsor
        .mockResolvedValue({ data: null, error: null });
      mockSupabaseInsert.mockResolvedValue({ error: null });
      mockSupabaseOrder.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.sendRequest('sponsor@example.com');
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('profiles');
      expect(mockSupabaseSelect).toHaveBeenCalledWith('id');
      expect(mockSupabaseFrom).toHaveBeenCalledWith('sponsorships');
      expect(mockSupabaseInsert).toHaveBeenCalledWith({
        sponsor_id: 'sponsor-456',
        sponsee_id: currentUserId,
        status: 'pending',
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Sponsor request sent successfully');
    });

    it('should throw error when sponsor not found', async () => {
      mockSupabaseSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });
      mockSupabaseOrder.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.sendRequest('nonexistent@example.com');
        }),
      ).rejects.toThrow('Sponsor not found with that email');
    });

    it('should throw error when trying to sponsor yourself', async () => {
      mockSupabaseSingle.mockResolvedValue({ data: { id: currentUserId }, error: null });
      mockSupabaseOrder.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.sendRequest(currentUserEmail);
        }),
      ).rejects.toThrow('Cannot sponsor yourself');
    });

    it('should convert email to lowercase', async () => {
      mockSupabaseSingle.mockResolvedValue({ data: { id: 'sponsor-789' }, error: null });
      mockSupabaseInsert.mockResolvedValue({ error: null });
      mockSupabaseOrder.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.sendRequest('UPPERCASE@EXAMPLE.COM');
      });

      expect(mockSupabaseEq).toHaveBeenCalledWith('email', 'uppercase@example.com');
    });

    it('should handle insert errors', async () => {
      mockSupabaseSingle.mockResolvedValue({ data: { id: 'sponsor-456' }, error: null });
      mockSupabaseInsert.mockResolvedValue({ error: { message: 'Insert failed' } });
      mockSupabaseOrder.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.sendRequest('sponsor@example.com');
        }),
      ).rejects.toThrow('Insert failed');
    });
  });

  describe('Accept Request', () => {
    it('should accept pending request', async () => {
      mockSupabaseOrder.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.acceptRequest('sponsorship-123');
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('sponsorships');
      expect(mockSupabaseUpdate).toHaveBeenCalledWith({ status: 'accepted' });
      expect(mockSupabaseEq).toHaveBeenCalledWith('id', 'sponsorship-123');
      expect(mockLogger.info).toHaveBeenCalledWith('Sponsor request accepted');
    });

    it('should refresh after accepting', async () => {
      mockSupabaseOrder.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.acceptRequest('sponsorship-123');
      });

      // Should refresh by calling fetch again
      expect(mockSupabaseOr).toHaveBeenCalled();
    });

    it('should handle accept errors', async () => {
      mockSupabaseOrder.mockResolvedValue({ data: [], error: null });
      mockSupabaseUpdate.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
      });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.acceptRequest('sponsorship-123');
        }),
      ).rejects.toThrow('Update failed');
    });
  });

  describe('Decline Request', () => {
    it('should decline pending request', async () => {
      mockSupabaseOrder.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.declineRequest('sponsorship-123');
      });

      expect(mockSupabaseUpdate).toHaveBeenCalledWith({ status: 'declined' });
      expect(mockLogger.info).toHaveBeenCalledWith('Sponsor request declined');
    });

    it('should handle decline errors', async () => {
      mockSupabaseOrder.mockResolvedValue({ data: [], error: null });
      mockSupabaseUpdate.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: { message: 'Decline failed' } }),
      });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.declineRequest('sponsorship-123');
        }),
      ).rejects.toThrow('Decline failed');
    });
  });

  describe('Remove Sponsor', () => {
    it('should remove sponsorship relationship', async () => {
      mockSupabaseOrder.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.removeSponsor('sponsorship-123');
      });

      expect(mockSupabaseDelete).toHaveBeenCalled();
      expect(mockSupabaseEq).toHaveBeenCalledWith('id', 'sponsorship-123');
      expect(mockLogger.info).toHaveBeenCalledWith('Sponsor removed');
    });

    it('should handle remove errors', async () => {
      mockSupabaseOrder.mockResolvedValue({ data: [], error: null });
      mockSupabaseDelete.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.removeSponsor('sponsorship-123');
        }),
      ).rejects.toThrow('Delete failed');
    });
  });

  describe('Filter Helpers', () => {
    it('should filter mySponsor correctly', async () => {
      const sponsorships = [
        {
          id: 's-1',
          sponsor_id: 'sponsor-1',
          sponsee_id: currentUserId,
          status: 'accepted',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 's-2',
          sponsor_id: 'sponsor-2',
          sponsee_id: currentUserId,
          status: 'pending',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      ];

      mockSupabaseOrder.mockResolvedValue({ data: sponsorships, error: null });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.mySponsor?.id).toBe('s-1');
      expect(result.current.mySponsor?.status).toBe('accepted');
    });

    it('should filter mySponsees correctly', async () => {
      const sponsorships = [
        {
          id: 's-1',
          sponsor_id: currentUserId,
          sponsee_id: 'sponsee-1',
          status: 'accepted',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 's-2',
          sponsor_id: currentUserId,
          sponsee_id: 'sponsee-2',
          status: 'accepted',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      ];

      mockSupabaseOrder.mockResolvedValue({ data: sponsorships, error: null });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.mySponsees).toHaveLength(2);
    });

    it('should filter pendingRequests correctly', async () => {
      const sponsorships = [
        {
          id: 's-1',
          sponsor_id: currentUserId,
          sponsee_id: 'sponsee-1',
          status: 'pending',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      mockSupabaseOrder.mockResolvedValue({ data: sponsorships, error: null });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.pendingRequests).toHaveLength(1);
      expect(result.current.pendingRequests[0].id).toBe('s-1');
    });

    it('should filter sentRequests correctly', async () => {
      const sponsorships = [
        {
          id: 's-1',
          sponsor_id: 'sponsor-1',
          sponsee_id: currentUserId,
          status: 'pending',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      mockSupabaseOrder.mockResolvedValue({ data: sponsorships, error: null });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.sentRequests).toHaveLength(1);
      expect(result.current.sentRequests[0].id).toBe('s-1');
    });
  });

  describe('Refresh', () => {
    it('should refresh sponsorships manually', async () => {
      mockSupabaseOrder.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear mock to track refresh call
      mockSupabaseFrom.mockClear();

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('sponsorships');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing user', async () => {
      jest.mocked(require('../../../../contexts/AuthContext').useAuth).mockReturnValue({
        user: null,
        session: null,
      });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.sponsorships).toEqual([]);

      // Restore mock
      jest.mocked(require('../../../../contexts/AuthContext').useAuth).mockReturnValue({
        user: { id: currentUserId, email: currentUserEmail },
        session: { access_token: 'mock-token' },
      });
    });

    it('should handle network errors gracefully', async () => {
      mockSupabaseOrder.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });
  });
});
