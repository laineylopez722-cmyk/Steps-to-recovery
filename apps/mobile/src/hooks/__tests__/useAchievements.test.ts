/**
 * useAchievements Hook Test Suite
 *
 * Tests achievement functionality including:
 * - Returns achievement state
 * - checkAchievements triggers correctly
 * - Loading state
 * - Keytag tracking
 * - Achievement filtering (unlocked, in-progress, locked)
 */

// Mock store functions before imports
const mockInitialize = jest.fn();
const mockLoadAchievements = jest.fn();
const mockUpdateKeytagsForDays = jest.fn();
const mockCheckAutoAchievements = jest.fn();
const mockSelfCheckAchievement = jest.fn();
const mockSaveReflection = jest.fn();
const mockGetReflection = jest.fn();
const mockDismissRecentUnlock = jest.fn();
const mockGetAchievementsByCategory = jest.fn();
const mockGetReadingStreak = jest.fn();

jest.mock('@/shared', () => ({
  useAchievementStore: jest.fn(() => ({
    achievements: [],
    keytags: [],
    isLoading: false,
    isInitialized: false,
    totalUnlocked: 0,
    totalAchievements: 50,
    totalKeytags: 9,
    earnedKeytags: 0,
    recentUnlock: null,
    categoryProgress: {},
    initialize: mockInitialize,
    loadAchievements: mockLoadAchievements,
    updateKeytagsForDays: mockUpdateKeytagsForDays,
    checkAutoAchievements: mockCheckAutoAchievements,
    selfCheckAchievement: mockSelfCheckAchievement,
    saveReflection: mockSaveReflection,
    getReflection: mockGetReflection,
    dismissRecentUnlock: mockDismissRecentUnlock,
    getAchievementsByCategory: mockGetAchievementsByCategory,
  })),
  useContactStore: jest.fn(() => ({ contacts: [] })),
  useMeetingStore: jest.fn(() => ({ meetings: [] })),
  useRegularMeetingStore: jest.fn(() => ({ meetings: [] })),
  useStepWorkStore: jest.fn(() => ({ progress: [] })),
  useTenthStepStore: jest.fn(() => ({ currentStreak: 0 })),
  usePhoneStore: jest.fn(() => ({ callHistory: [] })),
  getReadingStreak: (...args: unknown[]) => mockGetReadingStreak(...args),
}));

jest.mock('../useSobriety', () => ({
  useSobriety: jest.fn(() => ({
    soberDays: 0,
  })),
}));

jest.mock('../useCheckin', () => ({
  useCheckin: jest.fn(() => ({
    checkinStreak: 0,
  })),
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import { renderHook, act } from '@testing-library/react-native';
import { useAchievements } from '../useAchievements';
import {
  useAchievementStore,
  useContactStore,
  useMeetingStore,
  useRegularMeetingStore,
} from '@/shared';
import { useSobriety } from '../useSobriety';
import { useCheckin } from '../useCheckin';

const mockUseAchievementStore = useAchievementStore as jest.MockedFunction<
  typeof useAchievementStore
>;
const mockUseSobriety = useSobriety as jest.MockedFunction<typeof useSobriety>;
const mockUseCheckin = useCheckin as jest.MockedFunction<typeof useCheckin>;
const mockUseContactStore = useContactStore as jest.MockedFunction<typeof useContactStore>;
const mockUseMeetingStore = useMeetingStore as jest.MockedFunction<typeof useMeetingStore>;
const mockUseRegularMeetingStore = useRegularMeetingStore as jest.MockedFunction<
  typeof useRegularMeetingStore
>;

interface MockAchievement {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: string;
  unlockType: string;
  status: 'locked' | 'in_progress' | 'unlocked';
  unlockedAt?: Date;
}

function createMockAchievement(overrides: Partial<MockAchievement> = {}): MockAchievement {
  return {
    id: `achievement-${Date.now()}`,
    category: 'sobriety',
    title: 'Test Achievement',
    description: 'Test description',
    icon: '🏆',
    unlockType: 'automatic',
    status: 'locked',
    ...overrides,
  };
}

describe('useAchievements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetReadingStreak.mockResolvedValue(0);
    mockCheckAutoAchievements.mockResolvedValue([]);
  });

  it('should return initial achievement state', () => {
    const { result } = renderHook(() => useAchievements());

    expect(result.current.achievements).toEqual([]);
    expect(result.current.keytags).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.totalUnlocked).toBe(0);
    expect(result.current.totalAchievements).toBe(50);
  });

  it('should initialize achievements on mount when not initialized', () => {
    renderHook(() => useAchievements());

    expect(mockInitialize).toHaveBeenCalled();
  });

  it('should not re-initialize when already initialized', () => {
    mockUseAchievementStore.mockReturnValue({
      achievements: [],
      keytags: [],
      isLoading: false,
      isInitialized: true,
      totalUnlocked: 0,
      totalAchievements: 50,
      totalKeytags: 9,
      earnedKeytags: 0,
      recentUnlock: null,
      categoryProgress: {},
      initialize: mockInitialize,
      loadAchievements: mockLoadAchievements,
      updateKeytagsForDays: mockUpdateKeytagsForDays,
      checkAutoAchievements: mockCheckAutoAchievements,
      selfCheckAchievement: mockSelfCheckAchievement,
      saveReflection: mockSaveReflection,
      getReflection: mockGetReflection,
      dismissRecentUnlock: mockDismissRecentUnlock,
      getAchievementsByCategory: mockGetAchievementsByCategory,
    } as unknown as ReturnType<typeof useAchievementStore>);

    renderHook(() => useAchievements());

    expect(mockInitialize).not.toHaveBeenCalled();
  });

  it('should return loading state', () => {
    mockUseAchievementStore.mockReturnValue({
      achievements: [],
      keytags: [],
      isLoading: true,
      isInitialized: true,
      totalUnlocked: 0,
      totalAchievements: 50,
      totalKeytags: 9,
      earnedKeytags: 0,
      recentUnlock: null,
      categoryProgress: {},
      initialize: mockInitialize,
      loadAchievements: mockLoadAchievements,
      updateKeytagsForDays: mockUpdateKeytagsForDays,
      checkAutoAchievements: mockCheckAutoAchievements,
      selfCheckAchievement: mockSelfCheckAchievement,
      saveReflection: mockSaveReflection,
      getReflection: mockGetReflection,
      dismissRecentUnlock: mockDismissRecentUnlock,
      getAchievementsByCategory: mockGetAchievementsByCategory,
    } as unknown as ReturnType<typeof useAchievementStore>);

    const { result } = renderHook(() => useAchievements());

    expect(result.current.isLoading).toBe(true);
  });

  it('should update keytags when sober days change', () => {
    mockUseSobriety.mockReturnValue({
      soberDays: 30,
    } as ReturnType<typeof useSobriety>);

    renderHook(() => useAchievements());

    expect(mockUpdateKeytagsForDays).toHaveBeenCalledWith(30);
  });

  it('should filter unlocked achievements', () => {
    const achievements = [
      createMockAchievement({ id: 'a1', status: 'unlocked' }),
      createMockAchievement({ id: 'a2', status: 'locked' }),
      createMockAchievement({ id: 'a3', status: 'in_progress' }),
      createMockAchievement({ id: 'a4', status: 'unlocked' }),
    ];

    mockUseAchievementStore.mockReturnValue({
      achievements,
      keytags: [],
      isLoading: false,
      isInitialized: true,
      totalUnlocked: 2,
      totalAchievements: 50,
      totalKeytags: 9,
      earnedKeytags: 0,
      recentUnlock: null,
      categoryProgress: {},
      initialize: mockInitialize,
      loadAchievements: mockLoadAchievements,
      updateKeytagsForDays: mockUpdateKeytagsForDays,
      checkAutoAchievements: mockCheckAutoAchievements,
      selfCheckAchievement: mockSelfCheckAchievement,
      saveReflection: mockSaveReflection,
      getReflection: mockGetReflection,
      dismissRecentUnlock: mockDismissRecentUnlock,
      getAchievementsByCategory: mockGetAchievementsByCategory,
    } as unknown as ReturnType<typeof useAchievementStore>);

    const { result } = renderHook(() => useAchievements());

    expect(result.current.unlockedAchievements).toHaveLength(2);
    expect(result.current.inProgressAchievements).toHaveLength(1);
    expect(result.current.lockedAchievements).toHaveLength(1);
  });

  it('should trigger checkAchievements and return newly unlocked', async () => {
    const newAchievement = createMockAchievement({
      id: 'new-1',
      status: 'unlocked',
      title: '30 Days Clean',
    });

    mockCheckAutoAchievements.mockResolvedValue([newAchievement]);

    mockUseAchievementStore.mockReturnValue({
      achievements: [],
      keytags: [],
      isLoading: false,
      isInitialized: true,
      totalUnlocked: 0,
      totalAchievements: 50,
      totalKeytags: 9,
      earnedKeytags: 0,
      recentUnlock: null,
      categoryProgress: {},
      initialize: mockInitialize,
      loadAchievements: mockLoadAchievements,
      updateKeytagsForDays: mockUpdateKeytagsForDays,
      checkAutoAchievements: mockCheckAutoAchievements,
      selfCheckAchievement: mockSelfCheckAchievement,
      saveReflection: mockSaveReflection,
      getReflection: mockGetReflection,
      dismissRecentUnlock: mockDismissRecentUnlock,
      getAchievementsByCategory: mockGetAchievementsByCategory,
    } as unknown as ReturnType<typeof useAchievementStore>);

    const { result } = renderHook(() => useAchievements());

    let unlocked: unknown[] = [];
    await act(async () => {
      unlocked = await result.current.triggerCheck();
    });

    expect(unlocked).toEqual([newAchievement]);
    expect(mockCheckAutoAchievements).toHaveBeenCalled();
  });

  it('should identify next keytag to earn', () => {
    const keytags = [
      { id: 'kt1', days: 1, isEarned: true, color: 'white', title: 'Welcome' },
      { id: 'kt2', days: 30, isEarned: true, color: 'orange', title: '30 Days' },
      { id: 'kt3', days: 60, isEarned: false, color: 'green', title: '60 Days' },
      { id: 'kt4', days: 90, isEarned: false, color: 'red', title: '90 Days' },
    ];

    mockUseAchievementStore.mockReturnValue({
      achievements: [],
      keytags,
      isLoading: false,
      isInitialized: true,
      totalUnlocked: 0,
      totalAchievements: 50,
      totalKeytags: 9,
      earnedKeytags: 2,
      recentUnlock: null,
      categoryProgress: {},
      initialize: mockInitialize,
      loadAchievements: mockLoadAchievements,
      updateKeytagsForDays: mockUpdateKeytagsForDays,
      checkAutoAchievements: mockCheckAutoAchievements,
      selfCheckAchievement: mockSelfCheckAchievement,
      saveReflection: mockSaveReflection,
      getReflection: mockGetReflection,
      dismissRecentUnlock: mockDismissRecentUnlock,
      getAchievementsByCategory: mockGetAchievementsByCategory,
    } as unknown as ReturnType<typeof useAchievementStore>);

    const { result } = renderHook(() => useAchievements());

    expect(result.current.nextKeytag?.id).toBe('kt3');
    expect(result.current.currentKeytag?.id).toBe('kt2');
  });

  it('should expose action functions', () => {
    const { result } = renderHook(() => useAchievements());

    expect(result.current.loadAchievements).toBeDefined();
    expect(result.current.selfCheckAchievement).toBeDefined();
    expect(result.current.saveReflection).toBeDefined();
    expect(result.current.getReflection).toBeDefined();
    expect(result.current.dismissRecentUnlock).toBeDefined();
    expect(result.current.getAchievementsByCategory).toBeDefined();
  });

  it('should not check achievements when not initialized', async () => {
    mockUseAchievementStore.mockReturnValue({
      achievements: [],
      keytags: [],
      isLoading: false,
      isInitialized: false,
      totalUnlocked: 0,
      totalAchievements: 50,
      totalKeytags: 9,
      earnedKeytags: 0,
      recentUnlock: null,
      categoryProgress: {},
      initialize: mockInitialize,
      loadAchievements: mockLoadAchievements,
      updateKeytagsForDays: mockUpdateKeytagsForDays,
      checkAutoAchievements: mockCheckAutoAchievements,
      selfCheckAchievement: mockSelfCheckAchievement,
      saveReflection: mockSaveReflection,
      getReflection: mockGetReflection,
      dismissRecentUnlock: mockDismissRecentUnlock,
      getAchievementsByCategory: mockGetAchievementsByCategory,
    } as unknown as ReturnType<typeof useAchievementStore>);

    mockUseSobriety.mockReturnValue({
      soberDays: 0,
    } as ReturnType<typeof useSobriety>);

    const { result } = renderHook(() => useAchievements());

    let unlocked: unknown[] = [];
    await act(async () => {
      unlocked = await result.current.checkAchievements();
    });

    expect(unlocked).toEqual([]);
    expect(mockCheckAutoAchievements).not.toHaveBeenCalled();
  });

  it('should build context from app state for achievement checks', async () => {
    mockUseSobriety.mockReturnValue({
      soberDays: 90,
    } as ReturnType<typeof useSobriety>);

    mockUseCheckin.mockReturnValue({
      checkinStreak: 7,
    } as ReturnType<typeof useCheckin>);

    mockUseContactStore.mockReturnValue({
      contacts: [
        { id: '1', name: 'Sponsor', role: 'sponsor', phone: '555-0001' },
        { id: '2', name: 'Friend', role: 'fellow', phone: '555-0002' },
      ],
    } as ReturnType<typeof useContactStore>);

    mockUseMeetingStore.mockReturnValue({
      meetings: [
        { id: 'm1', didShare: true },
        { id: 'm2', didShare: false },
      ],
    } as ReturnType<typeof useMeetingStore>);

    mockUseRegularMeetingStore.mockReturnValue({
      meetings: [{ id: 'rm1', isHomeGroup: true }],
    } as ReturnType<typeof useRegularMeetingStore>);

    mockCheckAutoAchievements.mockResolvedValue([]);
    mockGetReadingStreak.mockResolvedValue(5);

    mockUseAchievementStore.mockReturnValue({
      achievements: [],
      keytags: [],
      isLoading: false,
      isInitialized: true,
      totalUnlocked: 0,
      totalAchievements: 50,
      totalKeytags: 9,
      earnedKeytags: 0,
      recentUnlock: null,
      categoryProgress: {},
      initialize: mockInitialize,
      loadAchievements: mockLoadAchievements,
      updateKeytagsForDays: mockUpdateKeytagsForDays,
      checkAutoAchievements: mockCheckAutoAchievements,
      selfCheckAchievement: mockSelfCheckAchievement,
      saveReflection: mockSaveReflection,
      getReflection: mockGetReflection,
      dismissRecentUnlock: mockDismissRecentUnlock,
      getAchievementsByCategory: mockGetAchievementsByCategory,
    } as unknown as ReturnType<typeof useAchievementStore>);

    const { result } = renderHook(() => useAchievements());

    await act(async () => {
      await result.current.checkAchievements();
    });

    expect(mockCheckAutoAchievements).toHaveBeenCalledWith(
      expect.objectContaining({
        soberDays: 90,
        checkinStreak: 7,
        contactsCount: 2,
        hasSponsor: true,
        hasHomeGroup: true,
        meetingsCount: 2,
        readingStreak: 5,
        meetingsWithShares: 1,
      }),
    );
  });
});
