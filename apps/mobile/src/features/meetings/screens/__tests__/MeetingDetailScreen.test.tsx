import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import type { CachedMeeting } from '../../types/meeting';
import { MeetingDetailScreen } from '../MeetingDetailScreen';

const mockUseDatabase = jest.fn();
const mockUseAuth = jest.fn();
const mockUseFavoriteMeetings = jest.fn();
const mockUseMeetingCheckIns = jest.fn();
const mockUseMeetingCheckInStatus = jest.fn();
const mockGetCachedMeetingById = jest.fn();
const mockSavePreMeetingReflection = jest.fn();

jest.mock('../../../../contexts/DatabaseContext', () => ({
  useDatabase: () => mockUseDatabase(),
}));

jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../hooks/useFavoriteMeetings', () => ({
  useFavoriteMeetings: () => mockUseFavoriteMeetings(),
}));

jest.mock('../../hooks/useMeetingCheckIns', () => ({
  useMeetingCheckIns: () => mockUseMeetingCheckIns(),
  useMeetingCheckInStatus: (...args: unknown[]) => mockUseMeetingCheckInStatus(...args),
}));

jest.mock('../../services/meetingCacheService', () => ({
  getCachedMeetingById: (...args: unknown[]) => mockGetCachedMeetingById(...args),
}));

jest.mock('../../../../services/meetingReflectionService', () => ({
  savePreMeetingReflection: (...args: unknown[]) => mockSavePreMeetingReflection(...args),
}));

jest.mock('../../../../design-system/hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      background: '#000000',
      text: '#FFFFFF',
      textSecondary: '#B3B3B3',
      primary: '#00AA88',
      border: '#222222',
      surface: '#111111',
      danger: '#DD3333',
    },
    typography: {
      h1: {},
      h2: {},
      h3: {},
      body: {},
      caption: {},
    },
  }),
}));

jest.mock('../../../../design-system/components/Button', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Button: ({
    children,
    onPress,
    disabled,
    accessibilityLabel,
  }: any) => {
    const React = require('react');
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        <Text>{children}</Text>
      </Pressable>
    );
  },
}));

jest.mock('../../../../design-system/components/Badge', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Badge: ({ children }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    return <Text>{children}</Text>;
  },
}));

jest.mock('../../../../design-system/components/TextArea', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TextArea: ({
    value,
    onChangeText,
    accessibilityLabel,
    editable,
  }: any) => {
    const React = require('react');
    const { TextInput } = require('react-native');
    return (
      <TextInput
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel={accessibilityLabel}
        editable={editable}
      />
    );
  },
}));

jest.mock('../../../../design-system/components/Card', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Card: ({ children }: any) => {
    const React = require('react');
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

jest.mock('../../components/PreMeetingReflectionModal', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PreMeetingReflectionModal: ({
    visible,
    onComplete,
    onSkip,
  }: any) => {
    const React = require('react');
    const { View, Text, Pressable } = require('react-native');
    return (
    visible ? (
      <View>
        <Text>PreMeetingReflectionModal</Text>
        <Pressable
          onPress={() =>
            onComplete({
              intention: 'Be present',
              mood: 4,
              hope: 'Connection',
            })
          }
        >
          <Text>pre-complete</Text>
        </Pressable>
        <Pressable onPress={onSkip}>
          <Text>pre-skip</Text>
        </Pressable>
      </View>
    ) : null
    );
  },
}));

jest.mock('../../components/CheckInModal', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  CheckInModal: ({
    visible,
    onConfirm,
    onClose,
  }: any) => {
    const React = require('react');
    const { View, Text, Pressable } = require('react-native');
    return (
    visible ? (
      <View>
        <Text>CheckInModal</Text>
        <Pressable
          onPress={() => {
            void Promise.resolve(onConfirm('integration notes')).then((result) => {
              if (result !== false) {
                onClose();
              }
            });
          }}
        >
          <Text>checkin-confirm</Text>
        </Pressable>
        <Pressable onPress={onClose}>
          <Text>checkin-cancel</Text>
        </Pressable>
      </View>
    ) : null
    );
  },
}));

jest.mock('../../components/PostMeetingReflectionModal', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PostMeetingReflectionModal: ({
    visible,
    preMood,
    onComplete,
    onClose,
  }: any) => {
    const React = require('react');
    const { View, Text, Pressable } = require('react-native');
    return (
    visible ? (
      <View>
        <Text>PostMeetingReflectionModal</Text>
        <Text>{`preMood:${String(preMood)}`}</Text>
        <Pressable onPress={onComplete}>
          <Text>post-complete</Text>
        </Pressable>
        <Pressable onPress={onClose}>
          <Text>post-close</Text>
        </Pressable>
      </View>
    ) : null
    );
  },
}));

describe('MeetingDetailScreen integration flow', () => {
  const mockNavigate = jest.fn();
  const mockCheckInAsync = jest.fn();
  const meeting: CachedMeeting = {
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
    day_of_week: 1,
    time: '19:00',
    types: '["O","D"]',
    notes: null,
    cached_at: '2026-02-09T00:00:00.000Z',
    cache_region: '30.2672,-97.7431,10',
    created_at: '2026-02-09T00:00:00.000Z',
    updated_at: '2026-02-09T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseDatabase.mockReturnValue({ db: { getDatabaseName: () => 'test.db' } });
    mockUseAuth.mockReturnValue({ user: { id: 'user-123' } });
    mockUseFavoriteMeetings.mockReturnValue({
      isFavorite: jest.fn().mockReturnValue(false),
      addFavorite: jest.fn().mockResolvedValue(undefined),
      removeFavorite: jest.fn().mockResolvedValue(undefined),
      updateNotes: jest.fn().mockResolvedValue(undefined),
      getFavoriteNotes: jest.fn().mockResolvedValue(null),
    });
    mockUseMeetingCheckIns.mockReturnValue({
      checkInAsync: mockCheckInAsync,
      isCheckingIn: false,
    });
    mockUseMeetingCheckInStatus.mockReturnValue({
      hasCheckedIn: false,
      isLoading: false,
    });
    mockGetCachedMeetingById.mockResolvedValue(meeting);
    mockSavePreMeetingReflection.mockResolvedValue({ success: true });
  });

  function renderScreen(): ReturnType<typeof render> {
    return render(
      <MeetingDetailScreen
        route={{ key: 'MeetingDetail-key', name: 'MeetingDetail', params: { meetingId: meeting.id } }}
        navigation={{ navigate: mockNavigate } as never}
      />,
    );
  }

  it('orchestrates pre-reflection -> check-in -> post-reflection in order', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    mockCheckInAsync.mockResolvedValue({
      checkIn: {
        id: 'checkin-555',
      },
      newAchievements: ['first_meeting'],
    });

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Downtown Recovery Group')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Check In'));

    await waitFor(() => {
      expect(screen.getByText('PreMeetingReflectionModal')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('pre-complete'));

    await waitFor(() => {
      expect(screen.getByText('CheckInModal')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('checkin-confirm'));

    await waitFor(() => {
      expect(mockCheckInAsync).toHaveBeenCalledWith({
        meetingId: meeting.id,
        meetingName: meeting.name,
        meetingAddress: meeting.address ?? undefined,
        checkInType: 'manual',
        notes: 'integration notes',
      });
    });

    expect(mockSavePreMeetingReflection).toHaveBeenCalledWith('user-123', 'checkin-555', {
      intention: 'Be present',
      mood: 4,
      hope: 'Connection',
    });

    await waitFor(() => {
      expect(screen.getByText('PostMeetingReflectionModal')).toBeTruthy();
    });
    expect(screen.getByText('preMood:4')).toBeTruthy();

    fireEvent.press(screen.getByText('post-complete'));

    await waitFor(() => {
      expect(screen.queryByText('PostMeetingReflectionModal')).toBeNull();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Reflection saved',
      'Great work showing up for your recovery today.',
    );
  });

  it('supports skipping pre-reflection and still opens post-reflection after check-in', async () => {
    mockCheckInAsync.mockResolvedValue({
      checkIn: {
        id: 'checkin-777',
      },
      newAchievements: [],
    });

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Downtown Recovery Group')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Check In'));
    await waitFor(() => {
      expect(screen.getByText('PreMeetingReflectionModal')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('pre-skip'));

    await waitFor(() => {
      expect(screen.getByText('CheckInModal')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('checkin-confirm'));

    await waitFor(() => {
      expect(mockCheckInAsync).toHaveBeenCalled();
    });

    expect(mockSavePreMeetingReflection).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText('PostMeetingReflectionModal')).toBeTruthy();
    });
    expect(screen.getByText('preMood:undefined')).toBeTruthy();
  });
});
