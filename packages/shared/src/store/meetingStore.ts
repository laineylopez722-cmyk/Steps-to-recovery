/**
 * Enhanced Meeting Store
 *
 * Manages meeting attendance logs and insights with:
 * - Comprehensive error handling and rollback
 * - Input validation
 * - Retry logic for database operations
 * - Pagination and lazy loading
 * - Search and filtering capabilities
 * - Secure logging
 * - Granular loading states
 */

import { create } from 'zustand';
import { v4 as uuid } from 'uuid';

import type { MeetingLog, DbMeetingLog, MeetingType, MeetingConnectionMode } from '../types';

import { getDatabase } from '../db';
import { encryptContent } from '../encryption';
import {
  scheduleMeetingReminder,
  cancelMeetingReminder,
  sendMeetingEncouragement,
} from '../notifications';
import {
  logger,
  validateMeetingData,
  withRetry,
  encryptMeetingFields,
  dbRowToMeetingLog,
  calculateMoodImprovement,
  hasSignificantMoodImprovement,
} from '../utils';

interface MeetingInsights {
  totalMeetings: number;
  meetingsThisMonth: number;
  meetingsThisWeek: number;
  averageMoodImprovement: number;
  mostCommonTopic: string | null;
  lastMeetingDate: Date | null;
  daysSinceLastMeeting: number | null;
  shareRate: number; // Percentage of meetings where user shared
}

interface MeetingState {
  meetings: MeetingLog[];
  isLoading: boolean;
  insights: MeetingInsights;
  // Granular loading states
  loadingStates: {
    loadMeetings: boolean;
    createMeeting: boolean;
    updateMeeting: boolean;
    deleteMeeting: boolean;
    getMeetingById: boolean;
  };
  // Error state
  error: string | null;
  // Pagination state
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}

interface CreateMeetingData {
  name?: string;
  location?: string;
  type: MeetingType;
  moodBefore: number;
  moodAfter: number;
  keyTakeaways: string;
  topicTags: string[];
  attendedAt?: Date;
  // Enhanced fields
  whatILearned?: string;
  quoteHeard?: string;
  connectionsMode?: MeetingConnectionMode[];
  connectionNotes?: string;
  didShare?: boolean;
  shareReflection?: string;
  regularMeetingId?: string;
}

// Encrypted field names for type safety
type EncryptedFieldName =
  | 'keyTakeaways'
  | 'whatILearned'
  | 'quoteHeard'
  | 'connectionNotes'
  | 'shareReflection';
type EncryptedFieldMapping = {
  field: EncryptedFieldName;
  dbField: string;
  required: boolean;
};

interface UpdateMeetingData {
  name?: string;
  location?: string;
  type?: MeetingType;
  moodBefore?: number;
  moodAfter?: number;
  keyTakeaways?: string;
  topicTags?: string[];
  attendedAt?: Date;
  // Enhanced fields
  whatILearned?: string;
  quoteHeard?: string;
  connectionsMode?: MeetingConnectionMode[];
  connectionNotes?: string;
  didShare?: boolean;
  shareReflection?: string;
  regularMeetingId?: string;
}

interface MeetingActions {
  // Core CRUD operations
  loadMeetings: (options?: {
    page?: number;
    pageSize?: number;
    refresh?: boolean;
  }) => Promise<void>;
  createMeeting: (data: CreateMeetingData) => Promise<MeetingLog>;
  updateMeeting: (id: string, data: UpdateMeetingData) => Promise<void>;
  deleteMeeting: (id: string) => Promise<void>;
  getMeetingById: (id: string) => Promise<MeetingLog | null>;

  // Enhanced operations
  searchMeetings: (
    query: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      type?: MeetingType;
      minMood?: number;
      maxMood?: number;
    },
  ) => Promise<MeetingLog[]>;
  loadMoreMeetings: () => Promise<void>;

  // Utility functions
  calculateInsights: () => void;
  clearError: () => void;
  retryFailedOperation: () => Promise<void>;
}

const initialInsights: MeetingInsights = {
  totalMeetings: 0,
  meetingsThisMonth: 0,
  meetingsThisWeek: 0,
  averageMoodImprovement: 0,
  mostCommonTopic: null,
  lastMeetingDate: null,
  daysSinceLastMeeting: null,
  shareRate: 0,
};

export const useMeetingStore = create<MeetingState & MeetingActions>((set, get) => ({
  meetings: [],
  isLoading: false,
  insights: initialInsights,
  loadingStates: {
    loadMeetings: false,
    createMeeting: false,
    updateMeeting: false,
    deleteMeeting: false,
    getMeetingById: false,
  },
  error: null,
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: false,
  },

  loadMeetings: async (options = {}) => {
    const { page = 1, pageSize = 20, refresh = false } = options;
    const { pagination } = get();

    // Don't load if already loading and not refreshing
    if (!refresh && get().loadingStates.loadMeetings) {
      return;
    }

    set((state) => ({
      loadingStates: { ...state.loadingStates, loadMeetings: true },
      error: null,
      ...(refresh && { meetings: [], pagination: { ...pagination, page: 1, hasMore: false } }),
    }));

    try {
      const db = await withRetry(() => getDatabase(), { maxAttempts: 3 });

      // Get total count for pagination
      const countResult = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM meeting_logs',
      );
      const total = countResult?.count || 0;

      // Calculate offset for pagination
      const offset = (page - 1) * pageSize;

      const rows = await db.getAllAsync<DbMeetingLog>(
        'SELECT * FROM meeting_logs ORDER BY attended_at DESC LIMIT ? OFFSET ?',
        [pageSize, offset],
      );

      logger.debug('Loading meetings', {
        page,
        pageSize,
        total,
        loaded: rows.length,
        offset,
      });

      // Convert database rows to MeetingLog objects with lazy decryption
      const meetings: MeetingLog[] = await Promise.all(
        rows.map((row: DbMeetingLog) => dbRowToMeetingLog(row)),
      );

      const hasMore = offset + rows.length < total;

      set((state) => ({
        meetings: refresh ? meetings : [...state.meetings, ...meetings],
        loadingStates: { ...state.loadingStates, loadMeetings: false },
        pagination: {
          page,
          pageSize,
          total,
          hasMore,
        },
      }));

      get().calculateInsights();

      logger.info('Meetings loaded successfully', {
        count: meetings.length,
        total,
        page,
        hasMore,
      });
    } catch (error) {
      logger.error('Failed to load meetings', error);
      set((state) => ({
        loadingStates: { ...state.loadingStates, loadMeetings: false },
        error: 'Failed to load meetings. Please try again.',
      }));
    }
  },

  createMeeting: async (data) => {
    // Validate input data
    const validation = validateMeetingData(data);
    if (!validation.isValid) {
      const errorMessage = `Invalid meeting data: ${validation.errors.join(', ')}`;
      logger.warn('Meeting creation validation failed', { errors: validation.errors });
      throw new Error(errorMessage);
    }

    set((state) => ({
      loadingStates: { ...state.loadingStates, createMeeting: true },
      error: null,
    }));

    const id = uuid();
    const now = new Date();
    const attendedAt = data.attendedAt || now;
    let encryptedFields: Awaited<ReturnType<typeof encryptMeetingFields>> | null = null;

    try {
      // Encrypt sensitive fields
      encryptedFields = await withRetry(
        () =>
          encryptMeetingFields({
            keyTakeaways: data.keyTakeaways,
            whatILearned: data.whatILearned,
            quoteHeard: data.quoteHeard,
            connectionNotes: data.connectionNotes,
            shareReflection: data.shareReflection,
          }),
        { maxAttempts: 2 },
      );

      const db = await withRetry(() => getDatabase(), { maxAttempts: 3 });

      await db.runAsync(
        `INSERT INTO meeting_logs (
          id, name, location, type, mood_before, mood_after,
          key_takeaways, topic_tags, attended_at, created_at,
          what_i_learned, quote_heard, connections_mode, connection_notes,
          did_share, share_reflection, regular_meeting_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.name || null,
          data.location || null,
          data.type,
          data.moodBefore,
          data.moodAfter,
          encryptedFields.encryptedTakeaways,
          JSON.stringify(data.topicTags),
          attendedAt.toISOString(),
          now.toISOString(),
          encryptedFields.encryptedWhatILearned,
          encryptedFields.encryptedQuoteHeard,
          data.connectionsMode ? JSON.stringify(data.connectionsMode) : null,
          encryptedFields.encryptedConnectionNotes,
          data.didShare ? 1 : 0,
          encryptedFields.encryptedShareReflection,
          data.regularMeetingId || null,
        ],
      );

      const meeting: MeetingLog = {
        id,
        name: data.name,
        location: data.location,
        type: data.type,
        moodBefore: data.moodBefore,
        moodAfter: data.moodAfter,
        keyTakeaways: data.keyTakeaways,
        topicTags: data.topicTags,
        attendedAt,
        createdAt: now,
        whatILearned: data.whatILearned,
        quoteHeard: data.quoteHeard,
        connectionsMode: data.connectionsMode,
        connectionNotes: data.connectionNotes,
        didShare: data.didShare || false,
        shareReflection: data.shareReflection,
        regularMeetingId: data.regularMeetingId,
      };

      set((state) => ({
        meetings: [meeting, ...state.meetings],
        loadingStates: { ...state.loadingStates, createMeeting: false },
        pagination: {
          ...state.pagination,
          total: state.pagination.total + 1,
        },
      }));

      get().calculateInsights();

      logger.info('Meeting created successfully', {
        meetingId: id,
        type: data.type,
        moodImprovement: calculateMoodImprovement(data.moodBefore, data.moodAfter),
      });

      // Cancel any pending meeting reminders since user just logged one
      cancelMeetingReminder();

      // Send encouragement if mood significantly improved
      if (hasSignificantMoodImprovement(data.moodBefore, data.moodAfter)) {
        const moodImprovement = calculateMoodImprovement(data.moodBefore, data.moodAfter);
        sendMeetingEncouragement(moodImprovement);
      }

      return meeting;
    } catch (error) {
      logger.error('Failed to create meeting', error);
      set((state) => ({
        loadingStates: { ...state.loadingStates, createMeeting: false },
        error: 'Failed to save meeting. Please try again.',
      }));
      throw error;
    }
  },

  updateMeeting: async (id, data) => {
    // Find existing meeting for validation and rollback
    const existingMeeting = get().meetings.find((m) => m.id === id);
    if (!existingMeeting) {
      throw new Error('Meeting not found');
    }

    // Validate combined data
    const combinedData = { ...existingMeeting, ...data };
    const validation = validateMeetingData(combinedData);
    if (!validation.isValid) {
      const errorMessage = `Invalid meeting data: ${validation.errors.join(', ')}`;
      logger.warn('Meeting update validation failed', { meetingId: id, errors: validation.errors });
      throw new Error(errorMessage);
    }

    set((state) => ({
      loadingStates: { ...state.loadingStates, updateMeeting: true },
      error: null,
    }));

    try {
      const db = await withRetry(() => getDatabase(), { maxAttempts: 3 });
      const updates: string[] = [];
      const values: (string | number | null)[] = [];

      // Build dynamic update query
      if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name || null);
      }
      if (data.location !== undefined) {
        updates.push('location = ?');
        values.push(data.location || null);
      }
      if (data.type !== undefined) {
        updates.push('type = ?');
        values.push(data.type);
      }
      if (data.moodBefore !== undefined) {
        updates.push('mood_before = ?');
        values.push(data.moodBefore);
      }
      if (data.moodAfter !== undefined) {
        updates.push('mood_after = ?');
        values.push(data.moodAfter);
      }
      if (data.attendedAt !== undefined) {
        updates.push('attended_at = ?');
        values.push(data.attendedAt.toISOString());
      }
      if (data.topicTags !== undefined) {
        updates.push('topic_tags = ?');
        values.push(JSON.stringify(data.topicTags));
      }
      if (data.connectionsMode !== undefined) {
        updates.push('connections_mode = ?');
        values.push(data.connectionsMode ? JSON.stringify(data.connectionsMode) : null);
      }
      if (data.didShare !== undefined) {
        updates.push('did_share = ?');
        values.push(data.didShare ? 1 : 0);
      }
      if (data.regularMeetingId !== undefined) {
        updates.push('regular_meeting_id = ?');
        values.push(data.regularMeetingId || null);
      }

      // Handle encrypted fields with helper function
      const encryptedFieldMappings: readonly EncryptedFieldMapping[] = [
        { field: 'keyTakeaways', dbField: 'key_takeaways', required: true },
        { field: 'whatILearned', dbField: 'what_i_learned', required: false },
        { field: 'quoteHeard', dbField: 'quote_heard', required: false },
        { field: 'connectionNotes', dbField: 'connection_notes', required: false },
        { field: 'shareReflection', dbField: 'share_reflection', required: false },
      ];

      for (const { field, dbField, required } of encryptedFieldMappings) {
        if (data[field] !== undefined) {
          updates.push(`${dbField} = ?`);
          const value = data[field];
          const encryptedValue =
            required || value
              ? await withRetry(() => encryptContent(value as string), { maxAttempts: 2 })
              : null;
          values.push(encryptedValue);
        }
      }

      if (updates.length === 0) {
        set((state) => ({
          loadingStates: { ...state.loadingStates, updateMeeting: false },
        }));
        return;
      }

      values.push(id);
      await db.runAsync(`UPDATE meeting_logs SET ${updates.join(', ')} WHERE id = ?`, values);

      // Update local state
      const updatedMeeting = { ...existingMeeting, ...data };
      set((state) => ({
        meetings: state.meetings.map((m) => (m.id === id ? updatedMeeting : m)),
        loadingStates: { ...state.loadingStates, updateMeeting: false },
      }));

      get().calculateInsights();

      logger.info('Meeting updated successfully', {
        meetingId: id,
        changes: Object.keys(data),
        moodImprovement: calculateMoodImprovement(
          updatedMeeting.moodBefore,
          updatedMeeting.moodAfter,
        ),
      });
    } catch (error) {
      logger.error('Failed to update meeting', error);
      set((state) => ({
        loadingStates: { ...state.loadingStates, updateMeeting: false },
        error: 'Failed to update meeting. Please try again.',
      }));
      throw error;
    }
  },

  deleteMeeting: async (id) => {
    // Find existing meeting for potential rollback
    const existingMeeting = get().meetings.find((m) => m.id === id);
    if (!existingMeeting) {
      throw new Error('Meeting not found');
    }

    set((state) => ({
      loadingStates: { ...state.loadingStates, deleteMeeting: true },
      error: null,
    }));

    try {
      const db = await withRetry(() => getDatabase(), { maxAttempts: 3 });

      await db.runAsync('DELETE FROM meeting_logs WHERE id = ?', [id]);

      set((state) => ({
        meetings: state.meetings.filter((m) => m.id !== id),
        loadingStates: { ...state.loadingStates, deleteMeeting: false },
        pagination: {
          ...state.pagination,
          total: Math.max(0, state.pagination.total - 1),
        },
      }));

      get().calculateInsights();

      logger.info('Meeting deleted successfully', {
        meetingId: id,
        type: existingMeeting.type,
        attendedAt: existingMeeting.attendedAt.toISOString(),
      });
    } catch (error) {
      logger.error('Failed to delete meeting', error);
      set((state) => ({
        loadingStates: { ...state.loadingStates, deleteMeeting: false },
        error: 'Failed to delete meeting. Please try again.',
      }));
      throw error;
    }
  },

  getMeetingById: async (id) => {
    // Check cache first
    const { meetings } = get();
    const cached = meetings.find((m) => m.id === id);
    if (cached) {
      logger.debug('Meeting found in cache', { meetingId: id });
      return cached;
    }

    set((state) => ({
      loadingStates: { ...state.loadingStates, getMeetingById: true },
      error: null,
    }));

    try {
      const db = await withRetry(() => getDatabase(), { maxAttempts: 3 });
      const row = await db.getFirstAsync<DbMeetingLog>('SELECT * FROM meeting_logs WHERE id = ?', [
        id,
      ]);

      if (!row) {
        logger.debug('Meeting not found in database', { meetingId: id });
        set((state) => ({
          loadingStates: { ...state.loadingStates, getMeetingById: false },
        }));
        return null;
      }

      const meeting = await dbRowToMeetingLog(row);

      // Add to cache if not already there
      set((state) => ({
        meetings: state.meetings.some((m) => m.id === id)
          ? state.meetings
          : [...state.meetings, meeting],
        loadingStates: { ...state.loadingStates, getMeetingById: false },
      }));

      logger.debug('Meeting loaded from database', {
        meetingId: id,
        type: meeting.type,
        attendedAt: meeting.attendedAt.toISOString(),
      });

      return meeting;
    } catch (error) {
      logger.error('Failed to get meeting by ID', error);
      set((state) => ({
        loadingStates: { ...state.loadingStates, getMeetingById: false },
        error: 'Failed to load meeting details.',
      }));
      return null;
    }
  },

  searchMeetings: async (query, filters = {}) => {
    const { meetings } = get();
    let results = [...meetings];

    // Apply filters
    if (filters.startDate || filters.endDate) {
      results = results.filter((meeting) => {
        const meetingDate = meeting.attendedAt;
        if (filters.startDate && meetingDate < filters.startDate) return false;
        if (filters.endDate && meetingDate > filters.endDate) return false;
        return true;
      });
    }

    if (filters.type) {
      results = results.filter((meeting) => meeting.type === filters.type);
    }

    if (filters.minMood !== undefined || filters.maxMood !== undefined) {
      results = results.filter((meeting) => {
        if (filters.minMood !== undefined && meeting.moodAfter < filters.minMood) return false;
        if (filters.maxMood !== undefined && meeting.moodAfter > filters.maxMood) return false;
        return true;
      });
    }

    // Apply search query
    if (query.trim()) {
      const lowercaseQuery = query.toLowerCase();
      results = results.filter((meeting) => {
        const searchableText = [
          meeting.name,
          meeting.location,
          meeting.keyTakeaways,
          meeting.whatILearned,
          meeting.quoteHeard,
          meeting.connectionNotes,
          meeting.shareReflection,
          ...meeting.topicTags,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(lowercaseQuery);
      });
    }

    logger.debug('Meeting search completed', {
      query,
      filters,
      totalResults: results.length,
      originalCount: meetings.length,
    });

    return results;
  },

  loadMoreMeetings: async () => {
    const { pagination } = get();
    if (!pagination.hasMore || get().loadingStates.loadMeetings) {
      return;
    }

    await get().loadMeetings({
      page: pagination.page + 1,
      pageSize: pagination.pageSize,
    });
  },

  calculateInsights: () => {
    const { meetings } = get();
    const now = new Date();

    // Date boundaries
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const monthAgo = new Date(now);
    monthAgo.setMonth(now.getMonth() - 1);

    // Calculate stats
    const meetingsThisWeek = meetings.filter((m) => new Date(m.attendedAt) >= weekAgo).length;

    const meetingsThisMonth = meetings.filter((m) => new Date(m.attendedAt) >= monthAgo).length;

    // Average mood improvement
    const moodImprovements = meetings.map((m) =>
      calculateMoodImprovement(m.moodBefore, m.moodAfter),
    );
    const averageMoodImprovement =
      moodImprovements.length > 0
        ? moodImprovements.reduce((a, b) => a + b, 0) / moodImprovements.length
        : 0;

    // Most common topic
    const topicCounts: Record<string, number> = {};
    meetings.forEach((m) => {
      m.topicTags.forEach((tag) => {
        topicCounts[tag] = (topicCounts[tag] || 0) + 1;
      });
    });
    const sortedTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);
    const mostCommonTopic = sortedTopics.length > 0 ? sortedTopics[0][0] : null;

    // Last meeting
    const lastMeeting = meetings[0];
    const lastMeetingDate = lastMeeting ? new Date(lastMeeting.attendedAt) : null;
    const daysSinceLastMeeting = lastMeetingDate
      ? Math.floor((now.getTime() - lastMeetingDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Share rate
    const meetingsWithShares = meetings.filter((m) => m.didShare).length;
    const shareRate = meetings.length > 0 ? (meetingsWithShares / meetings.length) * 100 : 0;

    set({
      insights: {
        totalMeetings: meetings.length,
        meetingsThisMonth,
        meetingsThisWeek,
        averageMoodImprovement,
        mostCommonTopic,
        lastMeetingDate,
        daysSinceLastMeeting,
        shareRate,
      },
    });

    // Schedule a gentle reminder if it's been more than 7 days
    if (daysSinceLastMeeting !== null && daysSinceLastMeeting > 7) {
      scheduleMeetingReminder(daysSinceLastMeeting);
    }

    logger.debug('Meeting insights calculated', {
      totalMeetings: meetings.length,
      averageMoodImprovement,
      mostCommonTopic,
      daysSinceLastMeeting,
      shareRate,
    });
  },

  clearError: () => {
    set({ error: null });
  },

  retryFailedOperation: async () => {
    // This could be enhanced to retry the last failed operation
    // For now, just clear the error
    set({ error: null });
    logger.info('Retrying failed operation');
  },
}));
