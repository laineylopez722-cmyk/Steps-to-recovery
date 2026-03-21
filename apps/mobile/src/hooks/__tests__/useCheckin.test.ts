/**
 * useCheckin Hook Test Suite
 *
 * Tests check-in functionality including:
 * - Returns checkin state
 * - checkinStreak calculation
 * - Mood and craving trend computation
 * - Loading state
 * - Check-in rate calculation
 */

// Mock store functions before imports
const mockLoadTodayCheckin = jest.fn();
const mockLoadHistory = jest.fn();
const mockSubmitCheckin = jest.fn();

jest.mock('@/shared', () => ({
  useCheckinStore: jest.fn(() => ({
    todayCheckin: null,
    history: [],
    isLoading: false,
    error: null,
    checkinStreak: 0,
    averageMood: 0,
    averageCraving: 0,
    loadTodayCheckin: mockLoadTodayCheckin,
    loadHistory: mockLoadHistory,
    submitCheckin: mockSubmitCheckin,
  })),
}));

import { renderHook } from '@testing-library/react-native';
import { useCheckin } from '../useCheckin';
import { useCheckinStore } from '@/shared';

const mockUseCheckinStore = useCheckinStore as jest.MockedFunction<typeof useCheckinStore>;

interface MockDailyCheckin {
  id: string;
  date: Date;
  mood: number;
  cravingLevel: number;
  isCheckedIn: boolean;
  createdAt: Date;
}

function createMockCheckin(overrides: Partial<MockDailyCheckin> = {}): MockDailyCheckin {
  return {
    id: `checkin-${Date.now()}`,
    date: new Date(),
    mood: 7,
    cravingLevel: 3,
    isCheckedIn: true,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('useCheckin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial checkin state', () => {
    const { result } = renderHook(() => useCheckin());

    expect(result.current.todayCheckin).toBeNull();
    expect(result.current.history).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.hasCheckedInToday).toBe(false);
    expect(result.current.checkinStreak).toBe(0);
    expect(result.current.averageMood).toBe(0);
    expect(result.current.averageCraving).toBe(0);
  });

  it('should call loadTodayCheckin and loadHistory on mount', () => {
    renderHook(() => useCheckin());

    expect(mockLoadTodayCheckin).toHaveBeenCalled();
    expect(mockLoadHistory).toHaveBeenCalledWith(30);
  });

  it('should return checkinStreak from store', () => {
    mockUseCheckinStore.mockReturnValue({
      todayCheckin: null,
      history: [],
      isLoading: false,
      error: null,
      checkinStreak: 5,
      averageMood: 7.5,
      averageCraving: 2.1,
      loadTodayCheckin: mockLoadTodayCheckin,
      loadHistory: mockLoadHistory,
      submitCheckin: mockSubmitCheckin,
    } as ReturnType<typeof useCheckinStore>);

    const { result } = renderHook(() => useCheckin());

    expect(result.current.checkinStreak).toBe(5);
    expect(result.current.averageMood).toBe(7.5);
    expect(result.current.averageCraving).toBe(2.1);
  });

  it('should detect hasCheckedInToday when todayCheckin exists', () => {
    const todayCheckin = createMockCheckin({ isCheckedIn: true });

    mockUseCheckinStore.mockReturnValue({
      todayCheckin,
      history: [],
      isLoading: false,
      error: null,
      checkinStreak: 1,
      averageMood: 7,
      averageCraving: 3,
      loadTodayCheckin: mockLoadTodayCheckin,
      loadHistory: mockLoadHistory,
      submitCheckin: mockSubmitCheckin,
    } as ReturnType<typeof useCheckinStore>);

    const { result } = renderHook(() => useCheckin());

    expect(result.current.hasCheckedInToday).toBe(true);
  });

  it('should return loading state from store', () => {
    mockUseCheckinStore.mockReturnValue({
      todayCheckin: null,
      history: [],
      isLoading: true,
      error: null,
      checkinStreak: 0,
      averageMood: 0,
      averageCraving: 0,
      loadTodayCheckin: mockLoadTodayCheckin,
      loadHistory: mockLoadHistory,
      submitCheckin: mockSubmitCheckin,
    } as ReturnType<typeof useCheckinStore>);

    const { result } = renderHook(() => useCheckin());

    expect(result.current.isLoading).toBe(true);
  });

  it('should compute mood trend as neutral with insufficient history', () => {
    mockUseCheckinStore.mockReturnValue({
      todayCheckin: null,
      history: [createMockCheckin({ mood: 8 })],
      isLoading: false,
      error: null,
      checkinStreak: 1,
      averageMood: 8,
      averageCraving: 2,
      loadTodayCheckin: mockLoadTodayCheckin,
      loadHistory: mockLoadHistory,
      submitCheckin: mockSubmitCheckin,
    } as ReturnType<typeof useCheckinStore>);

    const { result } = renderHook(() => useCheckin());

    expect(result.current.moodTrend).toBe('neutral');
  });

  it('should compute positive mood trend when recent week is higher', () => {
    const recentWeek = Array.from({ length: 7 }, (_, i) =>
      createMockCheckin({ id: `recent-${i}`, mood: 8, isCheckedIn: true }),
    );
    const previousWeek = Array.from({ length: 7 }, (_, i) =>
      createMockCheckin({ id: `prev-${i}`, mood: 5, isCheckedIn: true }),
    );

    mockUseCheckinStore.mockReturnValue({
      todayCheckin: null,
      history: [...recentWeek, ...previousWeek],
      isLoading: false,
      error: null,
      checkinStreak: 14,
      averageMood: 6.5,
      averageCraving: 3,
      loadTodayCheckin: mockLoadTodayCheckin,
      loadHistory: mockLoadHistory,
      submitCheckin: mockSubmitCheckin,
    } as ReturnType<typeof useCheckinStore>);

    const { result } = renderHook(() => useCheckin());

    expect(result.current.moodTrend).toBe('positive');
  });

  it('should compute checkin rate correctly', () => {
    const history = [
      createMockCheckin({ isCheckedIn: true }),
      createMockCheckin({ isCheckedIn: true }),
      createMockCheckin({ isCheckedIn: false }),
      createMockCheckin({ isCheckedIn: true }),
    ];

    mockUseCheckinStore.mockReturnValue({
      todayCheckin: null,
      history,
      isLoading: false,
      error: null,
      checkinStreak: 0,
      averageMood: 0,
      averageCraving: 0,
      loadTodayCheckin: mockLoadTodayCheckin,
      loadHistory: mockLoadHistory,
      submitCheckin: mockSubmitCheckin,
    } as ReturnType<typeof useCheckinStore>);

    const { result } = renderHook(() => useCheckin());

    expect(result.current.checkinRate).toBe(75);
  });

  it('should return 0 checkin rate with empty history', () => {
    mockUseCheckinStore.mockReturnValue({
      todayCheckin: null,
      history: [],
      isLoading: false,
      error: null,
      checkinStreak: 0,
      averageMood: 0,
      averageCraving: 0,
      loadTodayCheckin: mockLoadTodayCheckin,
      loadHistory: mockLoadHistory,
      submitCheckin: mockSubmitCheckin,
    } as ReturnType<typeof useCheckinStore>);

    const { result } = renderHook(() => useCheckin());

    expect(result.current.checkinRate).toBe(0);
  });

  it('should compute negative craving trend when recent cravings are higher', () => {
    const recentWeek = Array.from({ length: 7 }, (_, i) =>
      createMockCheckin({ id: `recent-${i}`, cravingLevel: 8, isCheckedIn: true }),
    );
    const previousWeek = Array.from({ length: 7 }, (_, i) =>
      createMockCheckin({ id: `prev-${i}`, cravingLevel: 3, isCheckedIn: true }),
    );

    mockUseCheckinStore.mockReturnValue({
      todayCheckin: null,
      history: [...recentWeek, ...previousWeek],
      isLoading: false,
      error: null,
      checkinStreak: 14,
      averageMood: 6,
      averageCraving: 5.5,
      loadTodayCheckin: mockLoadTodayCheckin,
      loadHistory: mockLoadHistory,
      submitCheckin: mockSubmitCheckin,
    } as ReturnType<typeof useCheckinStore>);

    const { result } = renderHook(() => useCheckin());

    // Higher recent cravings = 'negative' trend
    expect(result.current.cravingTrend).toBe('negative');
  });

  it('should expose submitCheckin action', () => {
    const { result } = renderHook(() => useCheckin());

    expect(result.current.submitCheckin).toBe(mockSubmitCheckin);
  });
});
