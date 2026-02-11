/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  startCrisisCheckpoint,
  updateTriggerDescription,
  markWaitedTenMinutes,
  markSponsorContact,
  saveReflection,
  completeCrisisCheckpoint,
  getActiveCheckpoint,
  getCrisisStats,
  COMMON_EMOTIONS,
} from '../crisisCheckpointService';
import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';

// Mock dependencies
jest.mock('../../lib/supabase');
jest.mock('../../utils/logger');

describe('crisisCheckpointService', () => {
  const mockFrom = jest.fn();
  const mockInsert = jest.fn();
  const mockUpdate = jest.fn();
  const mockSelect = jest.fn();
  const mockEq = jest.fn();
  const mockIs = jest.fn();
  const mockOrder = jest.fn();
  const mockLimit = jest.fn();
  const mockSingle = jest.fn();
  const mockNot = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default Supabase chain setup
    mockSingle.mockResolvedValue({ data: null, error: null });
    mockLimit.mockReturnValue({ single: mockSingle });
    mockOrder.mockReturnValue({ limit: mockLimit });
    mockNot.mockResolvedValue({ data: [], error: null });
    mockIs.mockReturnValue({ order: mockOrder });
    mockEq.mockReturnValue({
      eq: mockEq,
      is: mockIs,
      single: mockSingle,
      select: mockSelect,
      not: mockNot,
    });
    mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({
      insert: mockInsert,
      update: mockUpdate,
      select: mockSelect,
    });
    (supabase.from as jest.Mock) = mockFrom;
  });

  // ========================================
  // startCrisisCheckpoint
  // ========================================

  describe('startCrisisCheckpoint', () => {
    it('should start a checkpoint and return checkpointId on success', async () => {
      mockSingle.mockResolvedValue({
        data: { id: 'cp-123' },
        error: null,
      });

      const result = await startCrisisCheckpoint('user-1', 7);

      expect(result).toEqual({ success: true, checkpointId: 'cp-123' });
      expect(mockFrom).toHaveBeenCalledWith('crisis_checkpoints');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          craving_intensity: 7,
          outcome: 'abandoned',
          waited_10_minutes: false,
          called_sponsor: false,
          texted_sponsor: false,
        }),
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Crisis checkpoint: Started',
        expect.objectContaining({ userId: 'user-1', checkpointId: 'cp-123' }),
      );
    });

    it('should return error when Supabase insert fails', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      });

      const result = await startCrisisCheckpoint('user-1', 5);

      expect(result).toEqual({ success: false, error: 'Insert failed' });
      expect(logger.error).toHaveBeenCalledWith(
        'Crisis checkpoint: Start failed',
        expect.objectContaining({ error: { message: 'Insert failed' } }),
      );
    });

    it('should handle unexpected exceptions', async () => {
      mockSingle.mockImplementation(async () => {
        throw new Error('Network error');
      });

      const result = await startCrisisCheckpoint('user-1', 8);

      expect(result).toEqual({ success: false, error: 'Unexpected error' });
      expect(logger.error).toHaveBeenCalledWith(
        'Crisis checkpoint: Start error',
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });
  });

  // ========================================
  // updateTriggerDescription
  // ========================================

  describe('updateTriggerDescription', () => {
    it('should update trigger description successfully', async () => {
      mockEq.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });

      const result = await updateTriggerDescription('cp-123', 'user-1', 'Stress at work');

      expect(result).toEqual({ success: true });
      expect(mockFrom).toHaveBeenCalledWith('crisis_checkpoints');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ trigger_description: 'Stress at work' }),
      );
    });

    it('should return error on Supabase failure', async () => {
      mockEq.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
      });

      const result = await updateTriggerDescription('cp-123', 'user-1', 'Stress');

      expect(result).toEqual({ success: false, error: 'Update failed' });
    });

    it('should handle unexpected exceptions', async () => {
      mockEq.mockReturnValue({
        eq: jest.fn().mockImplementation(async () => {
          throw new Error('Crash');
        }),
      });

      const result = await updateTriggerDescription('cp-123', 'user-1', 'Trigger');

      expect(result).toEqual({ success: false, error: 'Unexpected error' });
    });
  });

  // ========================================
  // markWaitedTenMinutes
  // ========================================

  describe('markWaitedTenMinutes', () => {
    it('should mark waited_10_minutes as true', async () => {
      mockEq.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const result = await markWaitedTenMinutes('cp-123', 'user-1');

      expect(result).toEqual({ success: true });
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ waited_10_minutes: true }));
    });

    it('should return error on failure', async () => {
      mockEq.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: { message: 'DB error' } }),
      });

      const result = await markWaitedTenMinutes('cp-123', 'user-1');

      expect(result).toEqual({ success: false, error: 'DB error' });
    });
  });

  // ========================================
  // markSponsorContact
  // ========================================

  describe('markSponsorContact', () => {
    it('should mark called_sponsor when action is call', async () => {
      mockEq.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const result = await markSponsorContact('cp-123', 'user-1', 'call');

      expect(result).toEqual({ success: true });
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ called_sponsor: true }));
    });

    it('should mark texted_sponsor when action is text', async () => {
      mockEq.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const result = await markSponsorContact('cp-123', 'user-1', 'text');

      expect(result).toEqual({ success: true });
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ texted_sponsor: true }));
    });

    it('should return error on failure', async () => {
      mockEq.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: { message: 'Contact error' } }),
      });

      const result = await markSponsorContact('cp-123', 'user-1', 'call');

      expect(result).toEqual({ success: false, error: 'Contact error' });
    });

    it('should handle unexpected exceptions', async () => {
      mockEq.mockReturnValue({
        eq: jest.fn().mockImplementation(async () => {
          throw new Error('Unexpected');
        }),
      });

      const result = await markSponsorContact('cp-123', 'user-1', 'text');

      expect(result).toEqual({ success: false, error: 'Unexpected error' });
    });
  });

  // ========================================
  // saveReflection
  // ========================================

  describe('saveReflection', () => {
    it('should save journal entry and emotions', async () => {
      mockEq.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const result = await saveReflection('cp-123', 'user-1', 'I felt strong today', [
        'Anxious',
        'Stressed',
      ]);

      expect(result).toEqual({ success: true });
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          journal_entry: 'I felt strong today',
          emotions_identified: ['Anxious', 'Stressed'],
        }),
      );
    });

    it('should return error on failure', async () => {
      mockEq.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: { message: 'Reflection error' } }),
      });

      const result = await saveReflection('cp-123', 'user-1', 'Entry', ['Sad']);

      expect(result).toEqual({ success: false, error: 'Reflection error' });
    });
  });

  // ========================================
  // completeCrisisCheckpoint
  // ========================================

  describe('completeCrisisCheckpoint', () => {
    it('should complete checkpoint with resisted outcome', async () => {
      // Mock getCheckpointStartTime (internal call)
      const mockStartEq = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
            error: null,
          }),
        }),
      });

      // Mock the update call
      const mockUpdateEq = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: getCheckpointStartTime (select)
          return {
            select: jest.fn().mockReturnValue({ eq: mockStartEq }),
          };
        }
        // Second call: update
        return {
          update: jest.fn().mockReturnValue({ eq: mockUpdateEq }),
        };
      });

      const result = await completeCrisisCheckpoint('cp-123', 'user-1', 'resisted', 3);

      expect(result).toEqual({ success: true });
      expect(logger.info).toHaveBeenCalledWith(
        'Crisis checkpoint: Completed',
        expect.objectContaining({ outcome: 'resisted' }),
      );
    });

    it('should handle missing start time gracefully', async () => {
      const mockStartEq = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        }),
      });

      const mockUpdateEq = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { select: jest.fn().mockReturnValue({ eq: mockStartEq }) };
        }
        return { update: jest.fn().mockReturnValue({ eq: mockUpdateEq }) };
      });

      const result = await completeCrisisCheckpoint('cp-123', 'user-1', 'used', 9);

      expect(result).toEqual({ success: true });
    });

    it('should return error when update fails', async () => {
      const mockStartEq = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { started_at: new Date().toISOString() },
            error: null,
          }),
        }),
      });

      const mockUpdateEq = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: { message: 'Complete failed' } }),
      });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { select: jest.fn().mockReturnValue({ eq: mockStartEq }) };
        }
        return { update: jest.fn().mockReturnValue({ eq: mockUpdateEq }) };
      });

      const result = await completeCrisisCheckpoint('cp-123', 'user-1', 'resisted', 2);

      expect(result).toEqual({ success: false, error: 'Complete failed' });
    });
  });

  // ========================================
  // getActiveCheckpoint
  // ========================================

  describe('getActiveCheckpoint', () => {
    it('should return active checkpoint when one exists', async () => {
      const mockCheckpoint = {
        id: 'cp-123',
        user_id: 'user-1',
        craving_intensity: 7,
        outcome: 'abandoned',
        started_at: '2026-01-01T00:00:00Z',
        completed_at: null,
        waited_10_minutes: false,
        called_sponsor: false,
        texted_sponsor: false,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      mockSingle.mockResolvedValue({ data: mockCheckpoint, error: null });

      const result = await getActiveCheckpoint('user-1');

      expect(result).toEqual(mockCheckpoint);
      expect(mockFrom).toHaveBeenCalledWith('crisis_checkpoints');
    });

    it('should return null when no active checkpoint exists', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      const result = await getActiveCheckpoint('user-1');

      expect(result).toBeNull();
    });

    it('should return null on exception', async () => {
      mockSingle.mockImplementation(async () => {
        throw new Error('Network error');
      });

      const result = await getActiveCheckpoint('user-1');

      expect(result).toBeNull();
    });
  });

  // ========================================
  // getCrisisStats
  // ========================================

  describe('getCrisisStats', () => {
    it('should compute stats from completed checkpoints', async () => {
      const mockCheckpoints = [
        {
          id: '1',
          user_id: 'user-1',
          outcome: 'resisted',
          craving_intensity: 8,
          trigger_description: 'Stress',
          completed_at: '2026-01-01T00:00:00Z',
        },
        {
          id: '2',
          user_id: 'user-1',
          outcome: 'resisted',
          craving_intensity: 6,
          trigger_description: 'Stress',
          completed_at: '2026-01-02T00:00:00Z',
        },
        {
          id: '3',
          user_id: 'user-1',
          outcome: 'used',
          craving_intensity: 10,
          trigger_description: 'Loneliness',
          completed_at: '2026-01-03T00:00:00Z',
        },
      ];

      mockNot.mockReturnValue({ data: mockCheckpoints, error: null });

      const stats = await getCrisisStats('user-1');

      expect(stats.total_checkpoints).toBe(3);
      expect(stats.times_resisted).toBe(2);
      expect(stats.times_used).toBe(1);
      expect(stats.resistance_rate).toBeCloseTo(66.67, 1);
      expect(stats.average_craving_intensity).toBe(8);
      expect(stats.most_common_triggers).toEqual(['Stress', 'Loneliness']);
    });

    it('should return empty stats when no completed checkpoints', async () => {
      mockNot.mockReturnValue({ data: null, error: { message: 'No data' } });

      const stats = await getCrisisStats('user-1');

      expect(stats).toEqual({
        total_checkpoints: 0,
        times_resisted: 0,
        times_used: 0,
        resistance_rate: 0,
        average_craving_intensity: 0,
        most_common_triggers: [],
      });
    });

    it('should return empty stats on exception', async () => {
      mockNot.mockImplementation(async () => {
        throw new Error('Query error');
      });

      const stats = await getCrisisStats('user-1');

      expect(stats.total_checkpoints).toBe(0);
      expect(logger.error).toHaveBeenCalledWith(
        'Crisis stats: Query error',
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });

    it('should handle checkpoints with no triggers', async () => {
      const mockCheckpoints = [
        {
          id: '1',
          user_id: 'user-1',
          outcome: 'resisted',
          craving_intensity: 5,
          trigger_description: null,
          completed_at: '2026-01-01T00:00:00Z',
        },
      ];

      mockNot.mockReturnValue({ data: mockCheckpoints, error: null });

      const stats = await getCrisisStats('user-1');

      expect(stats.most_common_triggers).toEqual([]);
    });
  });

  // ========================================
  // COMMON_EMOTIONS
  // ========================================

  describe('COMMON_EMOTIONS', () => {
    it('should be an array of strings', () => {
      expect(Array.isArray(COMMON_EMOTIONS)).toBe(true);
      expect(COMMON_EMOTIONS.length).toBeGreaterThan(0);
      COMMON_EMOTIONS.forEach((emotion) => {
        expect(typeof emotion).toBe('string');
      });
    });

    it('should include key recovery-relevant emotions', () => {
      expect(COMMON_EMOTIONS).toContain('Anxious');
      expect(COMMON_EMOTIONS).toContain('Lonely');
      expect(COMMON_EMOTIONS).toContain('Stressed');
    });
  });
});
