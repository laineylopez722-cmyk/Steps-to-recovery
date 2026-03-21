/**
 * useSobriety Hook Test Suite
 *
 * Tests sobriety functionality including:
 * - Returns sobriety calculations (soberDays, soberHours, etc.)
 * - Milestone detection
 * - Next milestone calculation
 * - Formatted duration display
 */

// Mock store and shared functions before imports
const mockLoadProfile = jest.fn();
const mockCreateProfile = jest.fn();
const mockUpdateProfile = jest.fn();
const mockCalculateSobriety = jest.fn();

const mockGetNextMilestone = jest.fn();
const mockGetLatestMilestone = jest.fn();
const mockGetAchievedMilestones = jest.fn();
const mockScheduleMilestoneNotification = jest.fn();

jest.mock('@/shared', () => ({
  useProfileStore: jest.fn(() => ({
    profile: null,
    soberDays: 0,
    soberHours: 0,
    soberMinutes: 0,
    isLoading: false,
    loadProfile: mockLoadProfile,
    createProfile: mockCreateProfile,
    updateProfile: mockUpdateProfile,
    calculateSobriety: mockCalculateSobriety,
  })),
  useSettingsStore: jest.fn(() => null),
  getNextMilestone: (...args: unknown[]) => mockGetNextMilestone(...args),
  getLatestMilestone: (...args: unknown[]) => mockGetLatestMilestone(...args),
  getAchievedMilestones: (...args: unknown[]) => mockGetAchievedMilestones(...args),
  scheduleMilestoneNotification: (...args: unknown[]) => mockScheduleMilestoneNotification(...args),
}));

import { renderHook } from '@testing-library/react-native';
import { useSobriety } from '../useSobriety';
import { useProfileStore, useSettingsStore } from '@/shared';

const mockUseProfileStore = useProfileStore as jest.MockedFunction<typeof useProfileStore>;
const _mockUseSettingsStore = useSettingsStore as jest.MockedFunction<typeof useSettingsStore>;

describe('useSobriety', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetNextMilestone.mockReturnValue(null);
    mockGetLatestMilestone.mockReturnValue(null);
    mockGetAchievedMilestones.mockReturnValue([]);
  });

  it('should call loadProfile on mount', () => {
    renderHook(() => useSobriety());

    expect(mockLoadProfile).toHaveBeenCalled();
  });

  it('should return sobriety calculations from store', () => {
    mockUseProfileStore.mockReturnValue({
      profile: { id: '1', sobrietyDate: new Date('2024-01-01') },
      soberDays: 45,
      soberHours: 12,
      soberMinutes: 30,
      isLoading: false,
      loadProfile: mockLoadProfile,
      createProfile: mockCreateProfile,
      updateProfile: mockUpdateProfile,
      calculateSobriety: mockCalculateSobriety,
    } as ReturnType<typeof useProfileStore>);

    const { result } = renderHook(() => useSobriety());

    expect(result.current.soberDays).toBe(45);
    expect(result.current.soberHours).toBe(12);
    expect(result.current.soberMinutes).toBe(30);
  });

  it('should return loading state', () => {
    mockUseProfileStore.mockReturnValue({
      profile: null,
      soberDays: 0,
      soberHours: 0,
      soberMinutes: 0,
      isLoading: true,
      loadProfile: mockLoadProfile,
      createProfile: mockCreateProfile,
      updateProfile: mockUpdateProfile,
      calculateSobriety: mockCalculateSobriety,
    } as ReturnType<typeof useProfileStore>);

    const { result } = renderHook(() => useSobriety());

    expect(result.current.isLoading).toBe(true);
  });

  it('should detect next milestone', () => {
    mockUseProfileStore.mockReturnValue({
      profile: { id: '1', sobrietyDate: new Date('2024-01-01') },
      soberDays: 25,
      soberHours: 0,
      soberMinutes: 0,
      isLoading: false,
      loadProfile: mockLoadProfile,
      createProfile: mockCreateProfile,
      updateProfile: mockUpdateProfile,
      calculateSobriety: mockCalculateSobriety,
    } as ReturnType<typeof useProfileStore>);

    mockGetNextMilestone.mockReturnValue({ days: 30, title: '30 Days' });
    mockGetLatestMilestone.mockReturnValue({ days: 14, title: '14 Days' });

    const { result } = renderHook(() => useSobriety());

    expect(result.current.nextMilestone).toEqual({ days: 30, title: '30 Days' });
    expect(result.current.daysUntilNextMilestone).toBe(5);
  });

  it('should calculate progress to next milestone', () => {
    mockUseProfileStore.mockReturnValue({
      profile: { id: '1', sobrietyDate: new Date('2024-01-01') },
      soberDays: 22,
      soberHours: 0,
      soberMinutes: 0,
      isLoading: false,
      loadProfile: mockLoadProfile,
      createProfile: mockCreateProfile,
      updateProfile: mockUpdateProfile,
      calculateSobriety: mockCalculateSobriety,
    } as ReturnType<typeof useProfileStore>);

    mockGetNextMilestone.mockReturnValue({ days: 30, title: '30 Days' });
    mockGetLatestMilestone.mockReturnValue({ days: 14, title: '14 Days' });

    const { result } = renderHook(() => useSobriety());

    // Progress: (22 - 14) / (30 - 14) = 8/16 = 50%
    expect(result.current.progressToNextMilestone).toBe(50);
  });

  it('should return achieved milestones', () => {
    mockUseProfileStore.mockReturnValue({
      profile: { id: '1', sobrietyDate: new Date('2024-01-01') },
      soberDays: 45,
      soberHours: 0,
      soberMinutes: 0,
      isLoading: false,
      loadProfile: mockLoadProfile,
      createProfile: mockCreateProfile,
      updateProfile: mockUpdateProfile,
      calculateSobriety: mockCalculateSobriety,
    } as ReturnType<typeof useProfileStore>);

    const milestones = [
      { days: 1, title: '1 Day' },
      { days: 7, title: '1 Week' },
      { days: 14, title: '2 Weeks' },
      { days: 30, title: '30 Days' },
    ];
    mockGetAchievedMilestones.mockReturnValue(milestones);

    const { result } = renderHook(() => useSobriety());

    expect(result.current.achievedMilestones).toEqual(milestones);
  });

  describe('formattedDuration', () => {
    function setupWithDays(
      days: number,
    ): ReturnType<typeof renderHook<ReturnType<typeof useSobriety>, unknown>> {
      mockUseProfileStore.mockReturnValue({
        profile: { id: '1', sobrietyDate: new Date('2024-01-01') },
        soberDays: days,
        soberHours: 0,
        soberMinutes: 0,
        isLoading: false,
        loadProfile: mockLoadProfile,
        createProfile: mockCreateProfile,
        updateProfile: mockUpdateProfile,
        calculateSobriety: mockCalculateSobriety,
      } as ReturnType<typeof useProfileStore>);

      return renderHook(() => useSobriety());
    }

    it('should format 1 day correctly', () => {
      const { result } = setupWithDays(1);
      expect(result.current.formattedDuration).toBe('1 day');
    });

    it('should format multiple days correctly', () => {
      const { result } = setupWithDays(15);
      expect(result.current.formattedDuration).toBe('15 days');
    });

    it('should format exactly 30 days as 1 month', () => {
      const { result } = setupWithDays(30);
      expect(result.current.formattedDuration).toBe('1 month');
    });

    it('should format months and days', () => {
      const { result } = setupWithDays(45);
      // 45 / 30 = 1 month, 15 remaining
      expect(result.current.formattedDuration).toBe('1 month, 15 days');
    });

    it('should format exactly 365 days as 1 year', () => {
      const { result } = setupWithDays(365);
      expect(result.current.formattedDuration).toBe('1 year');
    });

    it('should format years and days', () => {
      const { result } = setupWithDays(400);
      // 400 / 365 = 1 year, 35 remaining
      expect(result.current.formattedDuration).toBe('1 year, 35 days');
    });

    it('should format multiple years', () => {
      const { result } = setupWithDays(730);
      expect(result.current.formattedDuration).toBe('2 years');
    });

    it('should format 0 days', () => {
      const { result } = setupWithDays(0);
      expect(result.current.formattedDuration).toBe('0 days');
    });
  });

  it('should return null for daysUntilNextMilestone when no next milestone', () => {
    mockGetNextMilestone.mockReturnValue(null);

    const { result } = renderHook(() => useSobriety());

    expect(result.current.daysUntilNextMilestone).toBeNull();
  });

  it('should expose createProfile and updateProfile actions', () => {
    const { result } = renderHook(() => useSobriety());

    expect(result.current.createProfile).toBe(mockCreateProfile);
    expect(result.current.updateProfile).toBe(mockUpdateProfile);
  });
});
