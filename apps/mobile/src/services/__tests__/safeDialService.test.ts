 
import {
  normalizePhoneNumber,
  addRiskyContact,
  getRiskyContacts,
  isRiskyContact,
  updateRiskyContact,
  deleteRiskyContact,
  permanentlyDeleteRiskyContact,
  logCloseCall,
  getCloseCallHistory,
  getCloseCallStats,
  addMultipleRiskyContacts,
} from '../safeDialService';
import type { AddRiskyContactParams } from '../safeDialService';
import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';

// Mock dependencies
jest.mock('../../lib/supabase');
jest.mock('../../utils/logger');

describe('safeDialService', () => {
  const mockFrom = jest.fn();
  const mockInsert = jest.fn();
  const mockSelect = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();
  const mockEq = jest.fn();
  const mockOrder = jest.fn();
  const mockLimit = jest.fn();
  const mockSingle = jest.fn();
  const mockMaybeSingle = jest.fn();
  const mockRpc = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default chain setup
    mockSingle.mockResolvedValue({ data: null, error: null });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockLimit.mockReturnValue({ data: [], error: null });
    mockOrder.mockReturnValue({ limit: mockLimit, data: [], error: null });
    mockEq.mockReturnValue({
      eq: mockEq,
      order: mockOrder,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
      select: mockSelect,
      data: [],
      error: null,
    });
    mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq, select: mockSelect });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({
      insert: mockInsert,
      select: mockSelect,
      update: mockUpdate,
      delete: mockDelete,
    });
    (supabase.from as jest.Mock) = mockFrom;
    (supabase.rpc as jest.Mock) = mockRpc;
  });

  // ========================================
  // normalizePhoneNumber
  // ========================================

  describe('normalizePhoneNumber', () => {
    it('should strip all non-digit characters', () => {
      expect(normalizePhoneNumber('(555) 123-4567')).toBe('5551234567');
      expect(normalizePhoneNumber('+1-555-123-4567')).toBe('15551234567');
      expect(normalizePhoneNumber('555.123.4567')).toBe('5551234567');
    });

    it('should handle already-clean numbers', () => {
      expect(normalizePhoneNumber('5551234567')).toBe('5551234567');
    });

    it('should handle empty string', () => {
      expect(normalizePhoneNumber('')).toBe('');
    });
  });

  // ========================================
  // addRiskyContact
  // ========================================

  describe('addRiskyContact', () => {
    const params: AddRiskyContactParams = {
      userId: 'user-1',
      name: 'Old Friend',
      phoneNumber: '(555) 111-2222',
      relationshipType: 'old_friend',
      notes: 'Triggers cravings',
    };

    it('should add a risky contact and return mapped result', async () => {
      const dbRow = {
        id: 'rc-1',
        user_id: 'user-1',
        name: 'Old Friend',
        phone_number: '5551112222',
        relationship_type: 'old_friend',
        notes: 'Triggers cravings',
        added_at: '2026-01-01T00:00:00Z',
        is_active: true,
      };
      mockSingle.mockResolvedValue({ data: dbRow, error: null });

      const result = await addRiskyContact(params);

      expect(result).toEqual({
        id: 'rc-1',
        userId: 'user-1',
        name: 'Old Friend',
        phoneNumber: '5551112222',
        relationshipType: 'old_friend',
        notes: 'Triggers cravings',
        addedAt: '2026-01-01T00:00:00Z',
        isActive: true,
      });
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          phone_number: '5551112222',
          relationship_type: 'old_friend',
        }),
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Risky contact added',
        expect.objectContaining({ contactId: 'rc-1' }),
      );
    });

    it('should throw for duplicate contact (code 23505)', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'Duplicate' },
      });

      await expect(addRiskyContact(params)).rejects.toThrow(
        'This contact is already in your danger zone',
      );
    });

    it('should throw on other Supabase errors', async () => {
      const dbError = { code: '500', message: 'Server error' };
      mockSingle.mockResolvedValue({ data: null, error: dbError });

      await expect(addRiskyContact(params)).rejects.toEqual(dbError);
      expect(logger.error).toHaveBeenCalledWith('Failed to add risky contact', dbError);
    });
  });

  // ========================================
  // getRiskyContacts
  // ========================================

  describe('getRiskyContacts', () => {
    it('should return mapped risky contacts', async () => {
      const rows = [
        {
          id: 'rc-1',
          user_id: 'user-1',
          name: 'Contact A',
          phone_number: '1111111111',
          relationship_type: 'dealer',
          notes: null,
          added_at: '2026-01-01T00:00:00Z',
          is_active: true,
        },
      ];
      mockOrder.mockReturnValue({ data: rows, error: null });

      const result = await getRiskyContacts('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Contact A');
      expect(result[0].relationshipType).toBe('dealer');
    });

    it('should return empty array when no contacts', async () => {
      mockOrder.mockReturnValue({ data: [], error: null });

      const result = await getRiskyContacts('user-1');

      expect(result).toEqual([]);
    });

    it('should throw on error', async () => {
      mockOrder.mockReturnValue({ data: null, error: { message: 'DB error' } });

      await expect(getRiskyContacts('user-1')).rejects.toEqual({ message: 'DB error' });
    });
  });

  // ========================================
  // isRiskyContact
  // ========================================

  describe('isRiskyContact', () => {
    it('should return contact when phone matches', async () => {
      const dbRow = {
        id: 'rc-1',
        user_id: 'user-1',
        name: 'Danger',
        phone_number: '5551112222',
        relationship_type: 'dealer',
        added_at: '2026-01-01T00:00:00Z',
        is_active: true,
      };
      mockMaybeSingle.mockResolvedValue({ data: dbRow, error: null });

      const result = await isRiskyContact('user-1', '(555) 111-2222');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Danger');
    });

    it('should return null when phone not found', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await isRiskyContact('user-1', '9999999999');

      expect(result).toBeNull();
    });

    it('should throw on error', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'Error' } });

      await expect(isRiskyContact('user-1', '555')).rejects.toEqual({ message: 'Error' });
    });
  });

  // ========================================
  // updateRiskyContact
  // ========================================

  describe('updateRiskyContact', () => {
    it('should update contact fields', async () => {
      const updatedRow = {
        id: 'rc-1',
        user_id: 'user-1',
        name: 'New Name',
        phone_number: '9999999999',
        relationship_type: 'trigger_person',
        added_at: '2026-01-01T00:00:00Z',
        is_active: true,
      };
      mockSingle.mockResolvedValue({ data: updatedRow, error: null });

      const result = await updateRiskyContact('rc-1', {
        name: 'New Name',
        phoneNumber: '999-999-9999',
        relationshipType: 'trigger_person',
      });

      expect(result.name).toBe('New Name');
      expect(result.phoneNumber).toBe('9999999999');
      expect(logger.info).toHaveBeenCalledWith(
        'Risky contact updated',
        expect.objectContaining({ contactId: 'rc-1' }),
      );
    });

    it('should throw on error', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Update error' } });

      await expect(updateRiskyContact('rc-1', { name: 'Test' })).rejects.toEqual({
        message: 'Update error',
      });
    });
  });

  // ========================================
  // deleteRiskyContact (soft delete)
  // ========================================

  describe('deleteRiskyContact', () => {
    it('should soft delete by setting is_active to false', async () => {
      mockEq.mockResolvedValue({ error: null });

      await deleteRiskyContact('rc-1');

      expect(mockUpdate).toHaveBeenCalledWith({ is_active: false });
      expect(logger.info).toHaveBeenCalledWith(
        'Risky contact deleted',
        expect.objectContaining({ contactId: 'rc-1' }),
      );
    });

    it('should throw on error', async () => {
      mockEq.mockResolvedValue({ error: { message: 'Delete error' } });

      await expect(deleteRiskyContact('rc-1')).rejects.toEqual({ message: 'Delete error' });
    });
  });

  // ========================================
  // permanentlyDeleteRiskyContact
  // ========================================

  describe('permanentlyDeleteRiskyContact', () => {
    it('should hard delete the contact', async () => {
      mockEq.mockResolvedValue({ error: null });

      await permanentlyDeleteRiskyContact('rc-1');

      expect(mockDelete).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        'Risky contact permanently deleted',
        expect.objectContaining({ contactId: 'rc-1' }),
      );
    });

    it('should throw on error', async () => {
      mockEq.mockResolvedValue({ error: { message: 'Perm delete error' } });

      await expect(permanentlyDeleteRiskyContact('rc-1')).rejects.toEqual({
        message: 'Perm delete error',
      });
    });
  });

  // ========================================
  // logCloseCall
  // ========================================

  describe('logCloseCall', () => {
    it('should log a close call and return mapped result', async () => {
      const dbRow = {
        id: 'cc-1',
        user_id: 'user-1',
        risky_contact_id: 'rc-1',
        contact_name: 'Dealer Dan',
        action_taken: 'called_sponsor',
        notes: 'Called my sponsor instead',
        created_at: '2026-01-01T00:00:00Z',
      };
      mockSingle.mockResolvedValue({ data: dbRow, error: null });

      const result = await logCloseCall({
        userId: 'user-1',
        contactName: 'Dealer Dan',
        actionTaken: 'called_sponsor',
        riskyContactId: 'rc-1',
        notes: 'Called my sponsor instead',
      });

      expect(result).toEqual({
        id: 'cc-1',
        userId: 'user-1',
        riskyContactId: 'rc-1',
        contactName: 'Dealer Dan',
        actionTaken: 'called_sponsor',
        notes: 'Called my sponsor instead',
        createdAt: '2026-01-01T00:00:00Z',
      });
      expect(logger.info).toHaveBeenCalledWith(
        'Close call logged',
        expect.objectContaining({ actionTaken: 'called_sponsor' }),
      );
    });

    it('should throw on error', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Log error' } });

      await expect(
        logCloseCall({
          userId: 'user-1',
          contactName: 'Test',
          actionTaken: 'waited',
        }),
      ).rejects.toEqual({ message: 'Log error' });
    });
  });

  // ========================================
  // getCloseCallHistory
  // ========================================

  describe('getCloseCallHistory', () => {
    it('should return mapped close call history', async () => {
      const rows = [
        {
          id: 'cc-1',
          user_id: 'user-1',
          contact_name: 'Contact A',
          action_taken: 'waited',
          created_at: '2026-01-01T00:00:00Z',
        },
      ];
      mockLimit.mockReturnValue({ data: rows, error: null });

      const result = await getCloseCallHistory('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].contactName).toBe('Contact A');
      expect(result[0].actionTaken).toBe('waited');
    });

    it('should use custom limit', async () => {
      mockLimit.mockReturnValue({ data: [], error: null });

      await getCloseCallHistory('user-1', 10);

      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('should throw on error', async () => {
      mockLimit.mockReturnValue({ data: null, error: { message: 'History error' } });

      await expect(getCloseCallHistory('user-1')).rejects.toEqual({ message: 'History error' });
    });
  });

  // ========================================
  // getCloseCallStats
  // ========================================

  describe('getCloseCallStats', () => {
    it('should return mapped stats from RPC', async () => {
      mockRpc.mockResolvedValue({
        data: [
          {
            total_close_calls: '5',
            times_resisted: '4',
            times_proceeded: '1',
            last_close_call: '2026-01-01T00:00:00Z',
            longest_streak_days: 30,
          },
        ],
        error: null,
      });

      const result = await getCloseCallStats('user-1');

      expect(result).toEqual({
        totalCloseCalls: 5,
        timesResisted: 4,
        timesProceeded: 1,
        lastCloseCall: '2026-01-01T00:00:00Z',
        longestStreakDays: 30,
      });
    });

    it('should throw on RPC error', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC error' } });

      await expect(getCloseCallStats('user-1')).rejects.toEqual({ message: 'RPC error' });
    });
  });

  // ========================================
  // addMultipleRiskyContacts
  // ========================================

  describe('addMultipleRiskyContacts', () => {
    it('should add multiple contacts and track successes/failures', async () => {
      const contacts: AddRiskyContactParams[] = [
        {
          userId: 'user-1',
          name: 'Contact A',
          phoneNumber: '1111111111',
          relationshipType: 'dealer',
        },
        {
          userId: 'user-1',
          name: 'Contact B',
          phoneNumber: '2222222222',
          relationshipType: 'old_friend',
        },
      ];

      // First call succeeds, second fails
      mockSingle
        .mockResolvedValueOnce({
          data: {
            id: 'rc-1',
            user_id: 'user-1',
            name: 'Contact A',
            phone_number: '1111111111',
            relationship_type: 'dealer',
            added_at: '2026-01-01T00:00:00Z',
            is_active: true,
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { code: '23505', message: 'Duplicate' },
        });

      const result = await addMultipleRiskyContacts(contacts);

      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toContain('danger zone');
      expect(logger.info).toHaveBeenCalledWith(
        'Batch risky contacts added',
        expect.objectContaining({ successful: 1, failed: 1 }),
      );
    });

    it('should handle all successful', async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: 'rc-1',
          user_id: 'user-1',
          name: 'A',
          phone_number: '111',
          relationship_type: 'other',
          added_at: '2026-01-01T00:00:00Z',
          is_active: true,
        },
        error: null,
      });

      const result = await addMultipleRiskyContacts([
        { userId: 'user-1', name: 'A', phoneNumber: '111', relationshipType: 'other' },
      ]);

      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(0);
    });
  });
});
