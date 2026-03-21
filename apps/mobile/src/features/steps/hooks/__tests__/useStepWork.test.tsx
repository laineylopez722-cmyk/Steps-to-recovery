/**
 * useStepWork Hook Test Suite
 *
 * Tests step work functionality including:
 * - Fetch step questions and answers
 * - Progress calculation
 * - Save answers with encryption
 * - Optimistic updates and rollback
 * - Cache invalidation
 * - Error handling
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock dependencies before importing hooks
const mockEncryptContent = jest.fn();
const mockDecryptContent = jest.fn();
const mockAddToSyncQueue = jest.fn();
const mockGenerateId = jest.fn();

// Mock database
const mockDb = {
  getDatabaseName: jest.fn().mockReturnValue('test.db'),
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn(),
  runAsync: jest.fn(),
  execAsync: jest.fn(),
  withTransactionAsync: jest.fn(),
};

// Mock database with null state (for testing uninitialized db)
let mockDbIsReady = true;
let mockDbInstance: any = mockDb;

jest.mock('../../../../contexts/DatabaseContext', () => ({
  useDatabase: () => ({
    db: mockDbInstance,
    isReady: mockDbIsReady,
  }),
}));

jest.mock('../../../../utils/encryption', () => ({
  encryptContent: (content: string) => mockEncryptContent(content),
  decryptContent: (content: string) => mockDecryptContent(content),
}));

jest.mock('../../../../services/syncService', () => ({
  addToSyncQueue: (...args: unknown[]) => mockAddToSyncQueue(...args),
}));

jest.mock('../../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../../utils/id', () => ({
  generateId: (prefix: string) => mockGenerateId(prefix),
}));

// Mock STEP_PROMPTS with 12 steps
jest.mock('@/shared', () => ({
  STEP_PROMPTS: [
    {
      step: 1,
      prompts: Array(35).fill('Step 1 question'),
      title: 'Powerlessness',
      principle: 'Honesty',
    },
    { step: 2, prompts: Array(30).fill('Step 2 question'), title: 'Hope', principle: 'Hope' },
    { step: 3, prompts: Array(30).fill('Step 3 question'), title: 'Surrender', principle: 'Faith' },
    {
      step: 4,
      prompts: Array(70).fill('Step 4 question'),
      title: 'Inventory',
      principle: 'Courage',
    },
    {
      step: 5,
      prompts: Array(25).fill('Step 5 question'),
      title: 'Admission',
      principle: 'Integrity',
    },
    {
      step: 6,
      prompts: Array(25).fill('Step 6 question'),
      title: 'Readiness',
      principle: 'Willingness',
    },
    {
      step: 7,
      prompts: Array(25).fill('Step 7 question'),
      title: 'Humility',
      principle: 'Humility',
    },
    {
      step: 8,
      prompts: Array(35).fill('Step 8 question'),
      title: 'Willingness to Amend',
      principle: 'Brotherly Love',
    },
    {
      step: 9,
      prompts: Array(35).fill('Step 9 question'),
      title: 'Making Amends',
      principle: 'Justice',
    },
    {
      step: 10,
      prompts: Array(25).fill('Step 10 question'),
      title: 'Daily Inventory',
      principle: 'Perseverance',
    },
    {
      step: 11,
      prompts: Array(20).fill('Step 11 question'),
      title: 'Prayer and Meditation',
      principle: 'Spiritual Awareness',
    },
    {
      step: 12,
      prompts: Array(20).fill('Step 12 question'),
      title: 'Service',
      principle: 'Service',
    },
  ],
}));

// Import hooks after mocking
import { useStepWork, useSaveStepAnswer, useStepProgress } from '../useStepWork';
import { logger as mockLogger } from '../../../../utils/logger';

describe('useStepWork', () => {
  const testUserId = 'user-123';
  const stepNumber = 1;
  let queryClient: QueryClient;

  const createWrapper = () => {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock database state
    mockDbIsReady = true;
    mockDbInstance = {
      getDatabaseName: jest.fn().mockReturnValue('test.db'),
      getFirstAsync: jest.fn(),
      getAllAsync: jest.fn(),
      runAsync: jest.fn(),
      execAsync: jest.fn(),
      withTransactionAsync: jest.fn(),
    };

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });

    mockEncryptContent.mockImplementation((content: string) =>
      Promise.resolve(`encrypted_${content}`),
    );
    mockDecryptContent.mockImplementation((content: string) =>
      Promise.resolve(content?.replace('encrypted_', '')),
    );
    mockAddToSyncQueue.mockResolvedValue(undefined);
    mockGenerateId.mockReturnValue('step-test-id-123');
    mockDbInstance.getAllAsync.mockResolvedValue([]);
    mockDbInstance.getFirstAsync.mockResolvedValue(null);
    mockDbInstance.runAsync.mockResolvedValue({ lastInsertRowId: 1, changes: 1 });
  });

  afterEach(async () => {
    // Cancel pending queries and flush React Query timer-driven updates inside act()
    queryClient.cancelQueries();
    queryClient.clear();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Ensure database mock is restored
    mockDbInstance = mockDb;
    mockDbIsReady = true;
  });

  describe('useStepWork (Query Hook)', () => {
    it('should return empty questions and 0% progress when no data', async () => {
      mockDbInstance.getAllAsync.mockResolvedValue([]);

      const { result } = renderHook(() => useStepWork(testUserId, stepNumber), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions).toEqual([]);
      expect(result.current.progress).toBe(0);
      expect(result.current.error).toBe(null);
    });

    it('should fetch and decrypt step work', async () => {
      const stepWork = [
        {
          id: 'step-1-q1',
          user_id: testUserId,
          step_number: 1,
          question_number: 1,
          encrypted_answer: 'encrypted_My answer to question 1',
          is_complete: 1,
          completed_at: '2025-01-01T12:00:00Z',
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T12:00:00Z',
          sync_status: 'synced',
          supabase_id: 'sb-1',
        },
        {
          id: 'step-1-q2',
          user_id: testUserId,
          step_number: 1,
          question_number: 2,
          encrypted_answer: 'encrypted_My answer to question 2',
          is_complete: 0,
          completed_at: null,
          created_at: '2025-01-02T10:00:00Z',
          updated_at: '2025-01-02T10:00:00Z',
          sync_status: 'pending',
          supabase_id: null,
        },
      ];

      mockDbInstance.getAllAsync.mockResolvedValue(stepWork);

      const { result } = renderHook(() => useStepWork(testUserId, stepNumber), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions).toHaveLength(2);
      expect(result.current.questions[0].answer).toBe('My answer to question 1');
      expect(result.current.questions[0].is_complete).toBe(true);
      expect(result.current.questions[1].answer).toBe('My answer to question 2');
      expect(result.current.questions[1].is_complete).toBe(false);
      expect(result.current.progress).toBe(50); // 1 of 2 complete
    });

    it('should handle null answers (empty/unanswered questions)', async () => {
      const stepWork = [
        {
          id: 'step-1-q1',
          user_id: testUserId,
          step_number: 1,
          question_number: 1,
          encrypted_answer: null,
          is_complete: 0,
          completed_at: null,
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T10:00:00Z',
          sync_status: 'synced',
          supabase_id: null,
        },
      ];

      mockDbInstance.getAllAsync.mockResolvedValue(stepWork);

      const { result } = renderHook(() => useStepWork(testUserId, stepNumber), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.questions[0].answer).toBe(null);
      expect(result.current.questions[0].is_complete).toBe(false);
    });

    it('should order questions by question_number ASC', async () => {
      // Mock decryptContent to return proper answers
      mockDecryptContent.mockResolvedValueOnce('Answer 3').mockResolvedValueOnce('Answer 1');

      const stepWork = [
        {
          id: 'step-1-q3',
          user_id: testUserId,
          step_number: 1,
          question_number: 3,
          encrypted_answer: 'encrypted_Answer 3',
          is_complete: 1,
          completed_at: '2025-01-01T12:00:00Z',
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T12:00:00Z',
          sync_status: 'synced',
          supabase_id: null,
        },
        {
          id: 'step-1-q1',
          user_id: testUserId,
          step_number: 1,
          question_number: 1,
          encrypted_answer: 'encrypted_Answer 1',
          is_complete: 1,
          completed_at: '2025-01-01T12:00:00Z',
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T12:00:00Z',
          sync_status: 'synced',
          supabase_id: null,
        },
      ];

      mockDbInstance.getAllAsync.mockResolvedValue(stepWork);

      const { result } = renderHook(() => useStepWork(testUserId, stepNumber), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // The SQL query should order by question_number ASC
      expect(mockDbInstance.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY question_number ASC'),
        expect.any(Array),
      );
    });

    it('should calculate progress percentage correctly', async () => {
      const stepWork = [
        { is_complete: 1 },
        { is_complete: 1 },
        { is_complete: 0 },
        { is_complete: 0 },
      ];

      mockDbInstance.getAllAsync.mockResolvedValue(stepWork);

      const { result } = renderHook(() => useStepWork(testUserId, stepNumber), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.progress).toBe(50); // 2 of 4 complete
    });

    it('should return 0 progress when no questions exist', async () => {
      mockDbInstance.getAllAsync.mockResolvedValue([]);

      const { result } = renderHook(() => useStepWork(testUserId, stepNumber), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.progress).toBe(0);
    });

    it('should not fetch when database is not ready', async () => {
      mockDbIsReady = false;

      renderHook(() => useStepWork(testUserId, stepNumber), {
        wrapper: createWrapper(),
      });

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify no db call was made since isReady is false
      expect(mockDbInstance.getAllAsync).not.toHaveBeenCalled();

      // Restore for other tests
      mockDbIsReady = true;
    });

    it('should handle database errors gracefully', async () => {
      mockDbInstance.getAllAsync.mockRejectedValue(new Error('Database connection failed'));

      const { result } = renderHook(() => useStepWork(testUserId, stepNumber), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to fetch step work', expect.any(Error));
    });

    it('should handle decryption errors gracefully', async () => {
      const stepWork = [
        {
          id: 'step-1-q1',
          user_id: testUserId,
          step_number: 1,
          question_number: 1,
          encrypted_answer: 'corrupted_data',
          is_complete: 1,
          completed_at: '2025-01-01T12:00:00Z',
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T12:00:00Z',
          sync_status: 'synced',
          supabase_id: null,
        },
      ];

      mockDbInstance.getAllAsync.mockResolvedValue(stepWork);
      mockDecryptContent.mockRejectedValue(new Error('Decryption failed'));

      const { result } = renderHook(() => useStepWork(testUserId, stepNumber), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should filter by user_id and step_number', async () => {
      mockDbInstance.getAllAsync.mockResolvedValue([]);

      renderHook(() => useStepWork(testUserId, stepNumber), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockDbInstance.getAllAsync).toHaveBeenCalledWith(
          expect.stringContaining('WHERE user_id = ? AND step_number = ?'),
          [testUserId, stepNumber],
        );
      });
    });

    it('should query with ORDER BY question_number ASC', async () => {
      mockDbInstance.getAllAsync.mockResolvedValue([]);

      renderHook(() => useStepWork(testUserId, stepNumber), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockDbInstance.getAllAsync).toHaveBeenCalledWith(
          expect.stringContaining('ORDER BY question_number ASC'),
          expect.any(Array),
        );
      });
    });
  });

  describe('useSaveStepAnswer (Mutation Hook)', () => {
    it('should create new answer (insert)', async () => {
      mockDbInstance.getFirstAsync.mockResolvedValue(null); // No existing answer

      const { result } = renderHook(() => useSaveStepAnswer(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.saveAnswer(1, 1, 'My new answer', true);
      });

      expect(mockEncryptContent).toHaveBeenCalledWith('My new answer');
      expect(mockDbInstance.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO step_work'),
        expect.arrayContaining([
          expect.any(String), // id
          testUserId,
          1, // step_number
          1, // question_number
          'encrypted_My new answer',
          1, // is_complete
          expect.any(String), // completed_at
          expect.any(String), // created_at
          expect.any(String), // updated_at
          'pending',
        ]),
      );
      expect(mockAddToSyncQueue).toHaveBeenCalledWith(
        mockDbInstance,
        'step_work',
        expect.any(String),
        'insert',
      );
      expect(mockLogger.info).toHaveBeenCalledWith('Step answer saved', {
        stepNumber: 1,
        questionNumber: 1,
      });
    });

    it('should update existing answer (upsert)', async () => {
      mockDbInstance.getFirstAsync.mockResolvedValue({ id: 'existing-id-123' });

      const { result } = renderHook(() => useSaveStepAnswer(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.saveAnswer(1, 1, 'Updated answer', false);
      });

      expect(mockEncryptContent).toHaveBeenCalledWith('Updated answer');
      expect(mockDbInstance.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE step_work'),
        expect.arrayContaining([
          'encrypted_Updated answer',
          0, // is_complete
          null, // completed_at (not complete)
          expect.any(String), // updated_at
          'pending',
          testUserId,
          1, // step_number
          1, // question_number
        ]),
      );
      expect(mockAddToSyncQueue).toHaveBeenCalledWith(
        mockDbInstance,
        'step_work',
        'existing-id-123',
        'update',
      );
    });

    it('should encrypt answer before saving', async () => {
      mockDbInstance.getFirstAsync.mockResolvedValue(null);
      const sensitiveAnswer = 'This is a very personal reflection about my addiction.';

      const { result } = renderHook(() => useSaveStepAnswer(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.saveAnswer(1, 1, sensitiveAnswer, true);
      });

      expect(mockEncryptContent).toHaveBeenCalledWith(sensitiveAnswer);
      expect(mockDbInstance.runAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([`encrypted_${sensitiveAnswer}`]),
      );
    });

    it('should invalidate cache after save', async () => {
      mockDbInstance.getFirstAsync.mockResolvedValue(null);
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useSaveStepAnswer(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.saveAnswer(2, 3, 'Answer', true);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['step_work', testUserId, 2],
      });
    });

    it('should set completed_at when marking complete', async () => {
      mockDbInstance.getFirstAsync.mockResolvedValue(null);

      const { result } = renderHook(() => useSaveStepAnswer(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.saveAnswer(1, 1, 'Complete answer', true);
      });

      const insertCall = mockDbInstance.runAsync.mock.calls[0];
      expect(insertCall[1][5]).toBeTruthy(); // completed_at should be set (not null)
    });

    it('should set completed_at to null when marking incomplete', async () => {
      mockDbInstance.getFirstAsync.mockResolvedValue({ id: 'existing-id' });

      const { result } = renderHook(() => useSaveStepAnswer(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.saveAnswer(1, 1, 'Incomplete answer', false);
      });

      const updateCall = mockDbInstance.runAsync.mock.calls[0];
      expect(updateCall[1][2]).toBeNull(); // completed_at should be null
    });

    it('should handle save errors and log them', async () => {
      mockDbInstance.getFirstAsync.mockResolvedValue(null);
      mockDbInstance.runAsync.mockRejectedValue(new Error('Save failed'));

      const { result } = renderHook(() => useSaveStepAnswer(testUserId), {
        wrapper: createWrapper(),
      });

      // Clear previous logger calls
      (mockLogger.error as jest.Mock).mockClear();

      await act(async () => {
        await expect(result.current.saveAnswer(1, 1, 'Answer', true)).rejects.toThrow(
          'Save failed',
        );
      });

      // Wait for the error to be logged
      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to save step answer',
          expect.any(Error),
        );
      });
    });

    it('should throw error when database is not initialized', async () => {
      mockDbInstance = null;

      const { result } = renderHook(() => useSaveStepAnswer(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await expect(result.current.saveAnswer(1, 1, 'Answer', true)).rejects.toThrow(
          'Database not initialized',
        );
      });

      // Restore
      mockDbInstance = mockDb;
    });

    it('should track pending state', async () => {
      let resolveRunAsync: (value: unknown) => void;
      const runAsyncPromise = new Promise((resolve) => {
        resolveRunAsync = resolve;
      });
      mockDbInstance.getFirstAsync.mockResolvedValue(null);
      mockDbInstance.runAsync.mockReturnValue(runAsyncPromise);

      const { result } = renderHook(() => useSaveStepAnswer(testUserId), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(false);

      act(() => {
        result.current.saveAnswer(1, 1, 'Answer', true);
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      resolveRunAsync!({ lastInsertRowId: 1, changes: 1 });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });

    it('should handle empty string answers', async () => {
      mockDbInstance.getFirstAsync.mockResolvedValue(null);

      const { result } = renderHook(() => useSaveStepAnswer(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.saveAnswer(1, 1, '', false);
      });

      expect(mockEncryptContent).toHaveBeenCalledWith('');
    });

    it('should handle special characters in answers', async () => {
      mockDbInstance.getFirstAsync.mockResolvedValue(null);
      const specialAnswer = 'Special chars: "quotes" & <tags> \n newlines \t tabs';

      const { result } = renderHook(() => useSaveStepAnswer(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.saveAnswer(1, 1, specialAnswer, true);
      });

      expect(mockEncryptContent).toHaveBeenCalledWith(specialAnswer);
    });

    it('should handle emoji in answers', async () => {
      mockDbInstance.getFirstAsync.mockResolvedValue(null);
      const emojiAnswer = 'Feeling grateful 🙏 and blessed 🎉 today!';

      const { result } = renderHook(() => useSaveStepAnswer(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.saveAnswer(1, 1, emojiAnswer, true);
      });

      expect(mockEncryptContent).toHaveBeenCalledWith(emojiAnswer);
    });

    it('should handle very long answers', async () => {
      mockDbInstance.getFirstAsync.mockResolvedValue(null);
      const longAnswer = 'A'.repeat(10000);

      const { result } = renderHook(() => useSaveStepAnswer(testUserId), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.saveAnswer(1, 1, longAnswer, true);
      });

      expect(mockEncryptContent).toHaveBeenCalledWith(longAnswer);
    });
  });

  describe('useStepProgress (Overall Progress Hook)', () => {
    it('should return default values when no data', async () => {
      mockDbInstance.getAllAsync.mockResolvedValue([]);

      const { result } = renderHook(() => useStepProgress(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stepsCompleted).toEqual([]);
      expect(result.current.currentStep).toBe(1);
      expect(result.current.overallProgress).toBe(0);
      expect(result.current.stepDetails).toHaveLength(12);
    });

    it('should calculate step progress correctly', async () => {
      // Simulate: Step 1 has 3 answers, Step 2 has 1 answer
      const progressData = [
        { step_number: 1, answered: 3 },
        { step_number: 2, answered: 1 },
      ];

      mockDbInstance.getAllAsync.mockResolvedValue(progressData);

      const { result } = renderHook(() => useStepProgress(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stepDetails).toHaveLength(12);
      expect(result.current.stepDetails[0].stepNumber).toBe(1);
      expect(result.current.stepDetails[0].answered).toBe(3);
      expect(result.current.stepDetails[1].answered).toBe(1);
    });

    it('should identify completed steps', async () => {
      // Step 1 fully completed (35 prompts from mock)
      const progressData = [{ step_number: 1, answered: 35 }];

      mockDbInstance.getAllAsync.mockResolvedValue(progressData);

      const { result } = renderHook(() => useStepProgress(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stepsCompleted).toContain(1);
    });

    it('should identify current step (first incomplete)', async () => {
      // Step 1 fully completed, Step 2 not started
      const progressData = [{ step_number: 1, answered: 35 }];

      mockDbInstance.getAllAsync.mockResolvedValue(progressData);

      const { result } = renderHook(() => useStepProgress(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentStep).toBe(2);
    });

    it('should calculate per-step progress percentage', async () => {
      // Step 1: 17 out of 35 answered = ~49%
      const progressData = [{ step_number: 1, answered: 17 }];

      mockDbInstance.getAllAsync.mockResolvedValue(progressData);

      const { result } = renderHook(() => useStepProgress(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const step1Detail = result.current.stepDetails[0];
      expect(step1Detail.percent).toBe(49); // Math.round(17/35 * 100)
    });

    it('should calculate overall progress across all 12 steps', async () => {
      // 3 steps fully completed out of 12 = 25%
      const progressData = [
        { step_number: 1, answered: 35 },
        { step_number: 2, answered: 30 },
        { step_number: 3, answered: 30 },
      ];

      mockDbInstance.getAllAsync.mockResolvedValue(progressData);

      const { result } = renderHook(() => useStepProgress(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.overallProgress).toBe(25); // 3/12 * 100
    });

    it('should handle database errors gracefully', async () => {
      mockDbInstance.getAllAsync.mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useStepProgress(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stepsCompleted).toEqual([]);
      expect(result.current.currentStep).toBe(1);
      expect(result.current.overallProgress).toBe(0);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to calculate step progress',
        expect.any(Error),
      );
    });

    it('should return default values when database is null', async () => {
      mockDbInstance = null;

      const { result } = renderHook(() => useStepProgress(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stepsCompleted).toEqual([]);
      expect(result.current.currentStep).toBe(1);
      expect(result.current.overallProgress).toBe(0);
      expect(result.current.stepDetails).toEqual([]);

      // Restore
      mockDbInstance = mockDb;
    });

    it('should query with correct SQL and parameters', async () => {
      mockDbInstance.getAllAsync.mockResolvedValue([]);

      renderHook(() => useStepProgress(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockDbInstance.getAllAsync).toHaveBeenCalledWith(expect.stringContaining('SELECT'), [
          testUserId,
        ]);
      });
    });

    it('should handle partial progress on multiple steps', async () => {
      const progressData = [
        { step_number: 1, answered: 17 }, // ~49% complete
        { step_number: 2, answered: 15 }, // 50% complete
        { step_number: 4, answered: 70 }, // Complete
      ];

      mockDbInstance.getAllAsync.mockResolvedValue(progressData);

      const { result } = renderHook(() => useStepProgress(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stepDetails[0].percent).toBe(49);
      expect(result.current.stepDetails[1].percent).toBe(50);
      expect(result.current.stepsCompleted).toContain(4);
    });
  });

  describe('Integration and Edge Cases', () => {
    it('should handle all 12 steps in progress calculation', async () => {
      mockDbInstance.getAllAsync.mockResolvedValue([]);

      const { result } = renderHook(() => useStepProgress(testUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stepDetails).toHaveLength(12);
      for (let i = 0; i < 12; i++) {
        expect(result.current.stepDetails[i].stepNumber).toBe(i + 1);
      }
    });

    it('should handle empty answers with is_complete flag', async () => {
      mockDbInstance.getFirstAsync.mockResolvedValue(null);

      const { result } = renderHook(() => useSaveStepAnswer(testUserId), {
        wrapper: createWrapper(),
      });

      // Save with isComplete=true but empty answer
      await act(async () => {
        await result.current.saveAnswer(1, 1, '', true);
      });

      const insertCall = mockDbInstance.runAsync.mock.calls[0];
      expect(insertCall[1][4]).toBe('encrypted_'); // encrypted_answer
      expect(insertCall[1][5]).toBe(1); // is_complete
      expect(insertCall[1][6]).toBeTruthy(); // completed_at should be set
    });

    it('should handle step numbers 1-12', async () => {
      mockDbInstance.getFirstAsync.mockResolvedValue(null);

      const { result } = renderHook(() => useSaveStepAnswer(testUserId), {
        wrapper: createWrapper(),
      });

      // Test step 12
      await act(async () => {
        await result.current.saveAnswer(12, 1, 'Step 12 answer', true);
      });

      const insertCall = mockDbInstance.runAsync.mock.calls[0];
      expect(insertCall[1][2]).toBe(12); // step_number
      expect(insertCall[1][3]).toBe(1); // question_number
    });
  });
});
