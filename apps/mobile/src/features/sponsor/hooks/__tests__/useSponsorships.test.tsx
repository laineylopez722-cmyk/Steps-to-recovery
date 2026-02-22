/**
 * useSponsorships Hook Test Suite
 *
 * Tests sponsorship connection functionality including:
 * - Fetch sponsorships on mount
 * - Filter helpers (mySponsor, mySponsees, pendingRequests, sentRequests)
 * - Send sponsorship request by email
 * - Accept/decline pending requests
 * - Remove sponsorship
 * - Error handling
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';

// Create stable mock user object
const mockStableUser = { id: 'user-123', email: 'test@example.com' };

// Create stable chainable mock object (prefixed with 'mock' for jest.mock access)
const mockChainable: {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  or: jest.Mock;
  order: jest.Mock;
  single: jest.Mock;
} = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  eq: jest.fn(),
  or: jest.fn(),
  order: jest.fn(),
  single: jest.fn(),
};

// Make chainable methods return the same object
mockChainable.select.mockReturnValue(mockChainable);
mockChainable.insert.mockReturnValue(mockChainable);
mockChainable.update.mockReturnValue(mockChainable);
mockChainable.delete.mockReturnValue(mockChainable);
mockChainable.eq.mockReturnValue(mockChainable);
mockChainable.or.mockReturnValue(mockChainable);
mockChainable.order.mockReturnValue(mockChainable);

// Mock logger first
jest.mock('../../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock AuthContext with stable return value
jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({ user: mockStableUser })),
}));

// Mock Supabase
jest.mock('../../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => mockChainable),
  },
}));

// Import after mocks
import { useSponsorships } from '../useSponsorships';
import { logger as mockLogger } from '../../../../utils/logger';
import { useAuth } from '../../../../contexts/AuthContext';
import { supabase } from '../../../../lib/supabase';

const mockSupabaseFrom = supabase.from as jest.Mock;
const mockUseAuth = useAuth as jest.Mock;

describe('useSponsorships', () => {
  const testUserId = 'user-123';
  const otherUserId = 'user-456';
  const thirdUserId = 'user-789';

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset stable mock user properties
    mockStableUser.id = testUserId;
    mockStableUser.email = 'test@example.com';

    // Default authenticated user - return stable reference
    mockUseAuth.mockImplementation(() => ({ user: mockStableUser }));

    // Re-establish chainable mock returns (cleared by clearAllMocks)
    mockChainable.select.mockReturnValue(mockChainable);
    mockChainable.insert.mockReturnValue(mockChainable);
    mockChainable.update.mockReturnValue(mockChainable);
    mockChainable.delete.mockReturnValue(mockChainable);
    mockChainable.eq.mockReturnValue(mockChainable);
    mockChainable.or.mockReturnValue(mockChainable);
    mockChainable.order.mockReturnValue(mockChainable);

    // Default successful responses
    mockChainable.order.mockResolvedValue({ data: [], error: null });
    mockChainable.single.mockResolvedValue({ data: null, error: null });
  });

  describe('Data Fetching', () => {
    it('should fetch sponsorships on mount', async () => {
      const mockSponsorships = [
        {
          id: 'sp-1',
          sponsor_id: otherUserId,
          sponsee_id: testUserId,
          status: 'accepted',
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T10:00:00Z',
        },
      ];

      mockChainable.order.mockResolvedValue({ data: mockSponsorships, error: null });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('sponsorships');
      expect(mockChainable.select).toHaveBeenCalledWith('*');
      expect(mockChainable.or).toHaveBeenCalledWith(
        `sponsor_id.eq.${testUserId},sponsee_id.eq.${testUserId}`,
      );
      expect(mockChainable.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result.current.sponsorships).toEqual(mockSponsorships);
    });

    it('should handle empty state', async () => {
      mockChainable.order.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.sponsorships).toEqual([]);
      expect(result.current.mySponsor).toBeUndefined();
      expect(result.current.mySponsees).toEqual([]);
      expect(result.current.pendingRequests).toEqual([]);
      expect(result.current.sentRequests).toEqual([]);
    });

    it('should handle fetch errors', async () => {
      mockChainable.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.sponsorships).toEqual([]);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to fetch sponsorships',
        expect.anything(),
      );
    });

    it('should not fetch when user is not authenticated', async () => {
      mockUseAuth.mockImplementation(() => ({ user: null }));

      const { result } = renderHook(() => useSponsorships());

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockSupabaseFrom).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
    });

    it('should provide refresh function', async () => {
      mockChainable.order.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear mocks to track new calls
      mockSupabaseFrom.mockClear();

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('sponsorships');
    });
  });

  describe('Filter Helpers', () => {
    const mockSponsorships = [
      // My sponsor (I'm the sponsee, status accepted)
      {
        id: 'sp-1',
        sponsor_id: otherUserId,
        sponsee_id: testUserId,
        status: 'accepted',
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
      },
      // My sponsee (I'm the sponsor, status accepted)
      {
        id: 'sp-2',
        sponsor_id: testUserId,
        sponsee_id: thirdUserId,
        status: 'accepted',
        created_at: '2025-01-02T10:00:00Z',
        updated_at: '2025-01-02T10:00:00Z',
      },
      // Pending request received (I'm the sponsor)
      {
        id: 'sp-3',
        sponsor_id: testUserId,
        sponsee_id: 'user-aaa',
        status: 'pending',
        created_at: '2025-01-03T10:00:00Z',
        updated_at: '2025-01-03T10:00:00Z',
      },
      // Sent request pending (I'm the sponsee)
      {
        id: 'sp-4',
        sponsor_id: 'user-bbb',
        sponsee_id: testUserId,
        status: 'pending',
        created_at: '2025-01-04T10:00:00Z',
        updated_at: '2025-01-04T10:00:00Z',
      },
    ];

    beforeEach(() => {
      mockChainable.order.mockResolvedValue({ data: mockSponsorships, error: null });
    });

    it('should filter mySponsor (accepted where user is sponsee)', async () => {
      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.mySponsor).toEqual(mockSponsorships[0]);
    });

    it('should filter mySponsees (accepted where user is sponsor)', async () => {
      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.mySponsees).toHaveLength(1);
      expect(result.current.mySponsees[0]).toEqual(mockSponsorships[1]);
    });

    it('should filter pendingRequests (received)', async () => {
      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.pendingRequests).toHaveLength(1);
      expect(result.current.pendingRequests[0]).toEqual(mockSponsorships[2]);
    });

    it('should filter sentRequests (pending I sent)', async () => {
      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.sentRequests).toHaveLength(1);
      expect(result.current.sentRequests[0]).toEqual(mockSponsorships[3]);
    });

    it('should return empty arrays when no matches', async () => {
      mockChainable.order.mockResolvedValue({
        data: [
          {
            id: 'sp-5',
            sponsor_id: 'user-ccc',
            sponsee_id: testUserId,
            status: 'declined',
            created_at: '2025-01-05T10:00:00Z',
            updated_at: '2025-01-05T10:00:00Z',
          },
        ],
        error: null,
      });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.mySponsor).toBeUndefined();
      expect(result.current.mySponsees).toEqual([]);
      expect(result.current.pendingRequests).toEqual([]);
      expect(result.current.sentRequests).toEqual([]);
    });
  });

  describe('sendRequest', () => {
    beforeEach(() => {
      mockChainable.order.mockResolvedValue({ data: [], error: null });
    });

    it('should find sponsor by email and create pending sponsorship', async () => {
      const sponsorProfile = { id: otherUserId };
      mockChainable.single
        .mockResolvedValueOnce({ data: sponsorProfile, error: null }) // profiles query
        .mockResolvedValue({ data: null, error: null }); // Default for any other calls

      mockChainable.insert.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.sendRequest('sponsor@example.com');
      });

      // Should query profiles by email
      expect(mockSupabaseFrom).toHaveBeenCalledWith('profiles');
      expect(mockChainable.select).toHaveBeenCalledWith('id');
      expect(mockChainable.eq).toHaveBeenCalledWith('email', 'sponsor@example.com');

      // Should insert sponsorship
      expect(mockChainable.insert).toHaveBeenCalledWith({
        sponsor_id: otherUserId,
        sponsee_id: testUserId,
        status: 'pending',
      });

      expect(mockLogger.info).toHaveBeenCalledWith('Sponsor request sent successfully');
    });

    it('should convert email to lowercase', async () => {
      const sponsorProfile = { id: otherUserId };
      mockChainable.single.mockResolvedValueOnce({ data: sponsorProfile, error: null });
      mockChainable.insert.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.sendRequest('SPONSOR@EXAMPLE.COM');
      });

      expect(mockChainable.eq).toHaveBeenCalledWith('email', 'sponsor@example.com');
    });

    it('should prevent self-sponsorship', async () => {
      const sponsorProfile = { id: testUserId }; // Same as current user
      mockChainable.single.mockResolvedValueOnce({ data: sponsorProfile, error: null });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(result.current.sendRequest('myself@example.com')).rejects.toThrow(
          'Cannot sponsor yourself',
        );
      });
    });

    it('should handle sponsor not found', async () => {
      mockChainable.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(result.current.sendRequest('nonexistent@example.com')).rejects.toThrow(
          'Sponsor not found with that email',
        );
      });
    });

    it('should throw when not authenticated', async () => {
      mockUseAuth.mockImplementation(() => ({ user: null }));

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(result.current.sendRequest('sponsor@example.com')).rejects.toThrow(
          'Not authenticated',
        );
      });
    });

    it('should handle insert errors', async () => {
      const sponsorProfile = { id: otherUserId };
      mockChainable.single.mockResolvedValueOnce({ data: sponsorProfile, error: null });
      mockChainable.insert.mockResolvedValueOnce({
        error: new Error('Insert failed'),
      });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(result.current.sendRequest('sponsor@example.com')).rejects.toThrow(
          'Insert failed',
        );
      });
    });

    it('should refresh sponsorships after successful request', async () => {
      const sponsorProfile = { id: otherUserId };
      mockChainable.single.mockResolvedValueOnce({ data: sponsorProfile, error: null });
      mockChainable.insert.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear mocks to track new calls
      mockSupabaseFrom.mockClear();

      await act(async () => {
        await result.current.sendRequest('sponsor@example.com');
      });

      // Should refresh by calling fetchSponsorships again
      expect(mockSupabaseFrom).toHaveBeenCalledWith('sponsorships');
    });
  });

  describe('acceptRequest', () => {
    beforeEach(() => {
      mockChainable.order.mockResolvedValue({ data: [], error: null });
    });

    it('should update status to accepted', async () => {
      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.acceptRequest('sp-123');
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('sponsorships');
      expect(mockChainable.update).toHaveBeenCalledWith({ status: 'accepted' });
      expect(mockChainable.eq).toHaveBeenCalledWith('id', 'sp-123');
      expect(mockLogger.info).toHaveBeenCalledWith('Sponsor request accepted');
    });

    it('should refresh sponsorships after accepting', async () => {
      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear mocks
      mockSupabaseFrom.mockClear();

      await act(async () => {
        await result.current.acceptRequest('sp-123');
      });

      // Should call from sponsorships again to refresh
      expect(mockSupabaseFrom).toHaveBeenCalledWith('sponsorships');
    });

    it('should handle update errors', async () => {
      mockChainable.eq.mockResolvedValueOnce({
        error: new Error('Update failed'),
      });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(result.current.acceptRequest('sp-123')).rejects.toThrow('Update failed');
      });

      expect(mockLogger.warn).toHaveBeenCalledWith('Failed to accept request', expect.anything());
    });
  });

  describe('declineRequest', () => {
    beforeEach(() => {
      mockChainable.order.mockResolvedValue({ data: [], error: null });
    });

    it('should update status to declined', async () => {
      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.declineRequest('sp-123');
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('sponsorships');
      expect(mockChainable.update).toHaveBeenCalledWith({ status: 'declined' });
      expect(mockChainable.eq).toHaveBeenCalledWith('id', 'sp-123');
      expect(mockLogger.info).toHaveBeenCalledWith('Sponsor request declined');
    });

    it('should refresh sponsorships after declining', async () => {
      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear mocks
      mockSupabaseFrom.mockClear();

      await act(async () => {
        await result.current.declineRequest('sp-123');
      });

      // Should refresh
      expect(mockSupabaseFrom).toHaveBeenCalledWith('sponsorships');
    });

    it('should handle update errors', async () => {
      mockChainable.eq.mockResolvedValueOnce({
        error: new Error('Update failed'),
      });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(result.current.declineRequest('sp-123')).rejects.toThrow('Update failed');
      });

      expect(mockLogger.warn).toHaveBeenCalledWith('Failed to decline request', expect.anything());
    });
  });

  describe('removeSponsor', () => {
    beforeEach(() => {
      mockChainable.order.mockResolvedValue({ data: [], error: null });
    });

    it('should delete sponsorship record', async () => {
      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.removeSponsor('sp-123');
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('sponsorships');
      expect(mockChainable.delete).toHaveBeenCalled();
      expect(mockChainable.eq).toHaveBeenCalledWith('id', 'sp-123');
      expect(mockLogger.info).toHaveBeenCalledWith('Sponsor removed');
    });

    it('should refresh sponsorships after removal', async () => {
      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear mocks
      mockSupabaseFrom.mockClear();

      await act(async () => {
        await result.current.removeSponsor('sp-123');
      });

      // Should refresh
      expect(mockSupabaseFrom).toHaveBeenCalledWith('sponsorships');
    });

    it('should handle delete errors', async () => {
      mockChainable.eq.mockResolvedValueOnce({
        error: new Error('Delete failed'),
      });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(result.current.removeSponsor('sp-123')).rejects.toThrow('Delete failed');
      });

      expect(mockLogger.warn).toHaveBeenCalledWith('Failed to remove sponsor', expect.anything());
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined user in filter helpers', async () => {
      mockUseAuth.mockImplementation(() => ({ user: null }));
      mockChainable.order.mockResolvedValue({ data: [], error: null });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Filter helpers should handle undefined user gracefully
      expect(result.current.mySponsor).toBeUndefined();
      expect(result.current.mySponsees).toEqual([]);
      expect(result.current.pendingRequests).toEqual([]);
      expect(result.current.sentRequests).toEqual([]);
    });

    it('should handle non-Error exceptions in fetchSponsorships', async () => {
      mockChainable.order.mockRejectedValue('String error');

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Failed to fetch');
    });

    it('should handle multiple pending requests received', async () => {
      const mockSponsorships = [
        {
          id: 'sp-1',
          sponsor_id: testUserId,
          sponsee_id: 'user-aaa',
          status: 'pending',
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T10:00:00Z',
        },
        {
          id: 'sp-2',
          sponsor_id: testUserId,
          sponsee_id: 'user-bbb',
          status: 'pending',
          created_at: '2025-01-02T10:00:00Z',
          updated_at: '2025-01-02T10:00:00Z',
        },
      ];

      mockChainable.order.mockResolvedValue({ data: mockSponsorships, error: null });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.pendingRequests).toHaveLength(2);
    });

    it('should handle multiple sponsees', async () => {
      const mockSponsorships = [
        {
          id: 'sp-1',
          sponsor_id: testUserId,
          sponsee_id: 'user-aaa',
          status: 'accepted',
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T10:00:00Z',
        },
        {
          id: 'sp-2',
          sponsor_id: testUserId,
          sponsee_id: 'user-bbb',
          status: 'accepted',
          created_at: '2025-01-02T10:00:00Z',
          updated_at: '2025-01-02T10:00:00Z',
        },
      ];

      mockChainable.order.mockResolvedValue({ data: mockSponsorships, error: null });

      const { result } = renderHook(() => useSponsorships());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.mySponsees).toHaveLength(2);
    });
  });
});
