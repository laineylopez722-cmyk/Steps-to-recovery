import type * as HapticsModule from '../haptics';

const mockImpactAsync = jest.fn().mockResolvedValue(undefined);
const mockNotificationAsync = jest.fn().mockResolvedValue(undefined);
const mockSelectionAsync = jest.fn().mockResolvedValue(undefined);

// Helpers to load haptics module with a specific platform
function loadHapticsForPlatform(os: string): typeof HapticsModule {
  jest.resetModules();

  jest.doMock('react-native', () => ({
    Platform: { OS: os },
  }));
  jest.doMock('@/platform/haptics', () => ({
    impactAsync: mockImpactAsync,
    ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
    notificationAsync: mockNotificationAsync,
    NotificationFeedbackType: { Success: 'success', Error: 'error', Warning: 'warning' },
    selectionAsync: mockSelectionAsync,
  }));

  return require('../haptics') as typeof HapticsModule;
}

describe('haptics utilities (native platform)', () => {
  let haptics: ReturnType<typeof loadHapticsForPlatform>;

  beforeEach(() => {
    jest.clearAllMocks();
    haptics = loadHapticsForPlatform('ios');
  });

  describe('hapticLight', () => {
    it('calls impactAsync with Light style', async () => {
      await haptics.hapticLight();
      expect(mockImpactAsync).toHaveBeenCalledWith('light');
    });
  });

  describe('hapticMedium', () => {
    it('calls impactAsync with Medium style', async () => {
      await haptics.hapticMedium();
      expect(mockImpactAsync).toHaveBeenCalledWith('medium');
    });
  });

  describe('hapticHeavy', () => {
    it('calls impactAsync with Heavy style', async () => {
      await haptics.hapticHeavy();
      expect(mockImpactAsync).toHaveBeenCalledWith('heavy');
    });
  });

  describe('hapticSuccess', () => {
    it('calls notificationAsync with Success type', async () => {
      await haptics.hapticSuccess();
      expect(mockNotificationAsync).toHaveBeenCalledWith('success');
    });
  });

  describe('hapticError', () => {
    it('calls notificationAsync with Error type', async () => {
      await haptics.hapticError();
      expect(mockNotificationAsync).toHaveBeenCalledWith('error');
    });
  });

  describe('hapticWarning', () => {
    it('calls notificationAsync with Warning type', async () => {
      await haptics.hapticWarning();
      expect(mockNotificationAsync).toHaveBeenCalledWith('warning');
    });
  });

  describe('hapticSelection', () => {
    it('calls selectionAsync', async () => {
      await haptics.hapticSelection();
      expect(mockSelectionAsync).toHaveBeenCalled();
    });
  });

  describe('hapticButtonPress', () => {
    it('calls light impact for low importance', async () => {
      await haptics.hapticButtonPress('low');
      expect(mockImpactAsync).toHaveBeenCalledWith('light');
    });

    it('calls medium impact for medium importance (default)', async () => {
      await haptics.hapticButtonPress();
      expect(mockImpactAsync).toHaveBeenCalledWith('medium');
    });

    it('calls heavy impact for high importance', async () => {
      await haptics.hapticButtonPress('high');
      expect(mockImpactAsync).toHaveBeenCalledWith('heavy');
    });
  });

  describe('hapticImpact', () => {
    it('calls light for light style', async () => {
      await haptics.hapticImpact('light');
      expect(mockImpactAsync).toHaveBeenCalledWith('light');
    });

    it('calls heavy for heavy style', async () => {
      await haptics.hapticImpact('heavy');
      expect(mockImpactAsync).toHaveBeenCalledWith('heavy');
    });

    it('defaults to medium when no style given', async () => {
      await haptics.hapticImpact();
      expect(mockImpactAsync).toHaveBeenCalledWith('medium');
    });
  });

  describe('aliases', () => {
    it('hapticTick calls selectionAsync', async () => {
      await haptics.hapticTick();
      expect(mockSelectionAsync).toHaveBeenCalled();
    });

    it('hapticCelebration calls notificationAsync with Success', async () => {
      await haptics.hapticCelebration();
      expect(mockNotificationAsync).toHaveBeenCalledWith('success');
    });

    it('hapticThreshold calls notificationAsync with Warning', async () => {
      await haptics.hapticThreshold();
      expect(mockNotificationAsync).toHaveBeenCalledWith('warning');
    });
  });

  describe('error handling', () => {
    it('silently catches errors from impactAsync', async () => {
      mockImpactAsync.mockRejectedValueOnce(new Error('Haptics unavailable'));
      await expect(haptics.hapticLight()).resolves.toBeUndefined();
    });

    it('silently catches errors from notificationAsync', async () => {
      mockNotificationAsync.mockRejectedValueOnce(new Error('Haptics unavailable'));
      await expect(haptics.hapticSuccess()).resolves.toBeUndefined();
    });

    it('silently catches errors from selectionAsync', async () => {
      mockSelectionAsync.mockRejectedValueOnce(new Error('Haptics unavailable'));
      await expect(haptics.hapticSelection()).resolves.toBeUndefined();
    });
  });
});

describe('haptics on web platform', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not call haptic APIs on web', async () => {
    const webHaptics = loadHapticsForPlatform('web');

    await webHaptics.hapticLight();
    await webHaptics.hapticMedium();
    await webHaptics.hapticSuccess();
    await webHaptics.hapticSelection();

    expect(mockImpactAsync).not.toHaveBeenCalled();
    expect(mockNotificationAsync).not.toHaveBeenCalled();
    expect(mockSelectionAsync).not.toHaveBeenCalled();
  });
});

