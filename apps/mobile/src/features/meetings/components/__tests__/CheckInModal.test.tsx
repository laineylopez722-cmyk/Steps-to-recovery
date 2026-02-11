import type React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import type { MeetingWithDetails } from '../../types/meeting';
import { CheckInModal } from '../CheckInModal';

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent: (Component: React.ComponentType) => Component,
    },
    FadeIn: {
      duration: () => ({}),
    },
    FadeOut: {
      duration: () => ({}),
    },
    SlideInDown: {
      springify: () => ({
        damping: () => ({}),
      }),
    },
    SlideOutDown: {
      duration: () => ({}),
    },
    ZoomIn: {
      springify: () => ({
        damping: () => ({}),
      }),
    },
  };
});

jest.mock('../../../../design-system/components/GradientButton', () => ({
  GradientButton: ({ title, onPress, disabled, accessibilityLabel }: any) => {
    const React = require('react');
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityRole="button"
      >
        <Text>{title}</Text>
      </Pressable>
    );
  },
}));

jest.mock('../../../../design-system/components/GlassCard', () => ({
  GlassCard: ({ children }: any) => {
    const _React = require('react');
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

describe('CheckInModal', () => {
  const meeting: MeetingWithDetails = {
    id: 'meeting-1',
    name: 'Downtown Recovery Group',
    location: 'Community Hall',
    address: '123 Main St',
    city: 'Austin',
    state: 'TX',
    postal_code: '78701',
    country: 'US',
    latitude: 30.2672,
    longitude: -97.7431,
    day_of_week: 2,
    time: '19:00',
    types: '["O","D"]',
    notes: null,
    cached_at: '2026-02-09T00:00:00.000Z',
    cache_region: '30.2672,-97.7431,10',
    created_at: '2026-02-09T00:00:00.000Z',
    updated_at: '2026-02-09T00:00:00.000Z',
    is_favorite: false,
    distance_miles: null,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('does not close when onConfirm returns false', async () => {
    const onClose = jest.fn();
    const onConfirm = jest.fn().mockResolvedValue(false);

    render(
      <CheckInModal
        visible
        meeting={meeting}
        onClose={onClose}
        onConfirm={onConfirm}
        isLoading={false}
      />,
    );

    fireEvent.changeText(screen.getByLabelText('Meeting notes'), '  tough day  ');
    fireEvent.press(screen.getByText('Confirm Check-In'));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith('tough day');
    });

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByText('Checked In! 🎉')).toBeNull();
  });

  it('shows success state and closes after confirm succeeds', async () => {
    const onClose = jest.fn();
    const onConfirm = jest.fn().mockResolvedValue(true);
    const hapticsSpy = jest.spyOn(Haptics, 'notificationAsync').mockResolvedValue(undefined);

    render(
      <CheckInModal
        visible
        meeting={meeting}
        onClose={onClose}
        onConfirm={onConfirm}
        isLoading={false}
      />,
    );

    fireEvent.changeText(screen.getByLabelText('Meeting notes'), 'helpful shares');
    fireEvent.press(screen.getByText('Confirm Check-In'));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith('helpful shares');
    });
    expect(hapticsSpy).toHaveBeenCalled();
    expect(screen.getByText('Checked In! 🎉')).toBeTruthy();

    jest.advanceTimersByTime(1500);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('closes immediately when cancel is pressed', () => {
    const onClose = jest.fn();
    const onConfirm = jest.fn().mockResolvedValue(true);

    render(
      <CheckInModal
        visible
        meeting={meeting}
        onClose={onClose}
        onConfirm={onConfirm}
        isLoading={false}
      />,
    );

    fireEvent.press(screen.getByText('Cancel'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('prevents confirm while loading', () => {
    const onClose = jest.fn();
    const onConfirm = jest.fn().mockResolvedValue(true);

    render(
      <CheckInModal visible meeting={meeting} onClose={onClose} onConfirm={onConfirm} isLoading />,
    );

    fireEvent.press(screen.getByText('Checking In...'));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
