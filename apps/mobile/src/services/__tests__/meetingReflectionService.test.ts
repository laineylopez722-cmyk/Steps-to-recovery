import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';
import {
  calculateMoodLift,
  getAllReflections,
  getRandomPostPrompt,
  getRandomPrePrompt,
  getReflectionForCheckin,
  hasReflection,
  savePostMeetingReflection,
  savePreMeetingReflection,
  type MeetingReflection,
  type PostMeetingPrompts,
  type PreMeetingPrompts,
} from '../meetingReflectionService';

jest.mock('../../lib/supabase');
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

interface SupabaseLikeError {
  message: string;
}

describe('meetingReflectionService', () => {
  const userId = 'user-123';
  const checkinId = 'checkin-123';
  const prePrompts: PreMeetingPrompts = {
    intention: 'Listen with an open mind',
    mood: 3,
    hope: 'Leave with one practical action',
  };
  const postPrompts: PostMeetingPrompts = {
    keyTakeaway: 'Consistency beats intensity',
    mood: 4,
    gratitude: 'Shared honesty in the room',
    willApply: 'Call sponsor before evening',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('savePreMeetingReflection', () => {
    it('saves pre-meeting prompts successfully', async () => {
      const insert = jest.fn().mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({ insert });

      const result = await savePreMeetingReflection(userId, checkinId, prePrompts);

      expect(result).toEqual({ success: true });
      expect(supabase.from).toHaveBeenCalledWith('meeting_reflections');
      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          checkin_id: checkinId,
          pre_intention: prePrompts.intention,
          pre_mood: prePrompts.mood,
          pre_hope: prePrompts.hope,
          created_at: expect.any(String),
          updated_at: expect.any(String),
        }),
      );
      expect(logger.info).toHaveBeenCalledWith('Meeting reflection: Pre-meeting saved', {
        userId,
        checkinId,
      });
    });

    it('returns failure when insert reports error', async () => {
      const error: SupabaseLikeError = { message: 'insert failed' };
      const insert = jest.fn().mockResolvedValue({ error });
      (supabase.from as jest.Mock).mockReturnValue({ insert });

      const result = await savePreMeetingReflection(userId, checkinId, prePrompts);

      expect(result).toEqual({ success: false, error: 'insert failed' });
      expect(logger.warn).toHaveBeenCalledWith('Meeting reflection: Pre-meeting save failed', {
        error,
      });
    });
  });

  describe('savePostMeetingReflection', () => {
    function createUpdateChain(
      response: {
        data: Array<{ id: string }> | null;
        error: SupabaseLikeError | null;
      },
    ): {
      update: jest.Mock;
      insert: jest.Mock;
      eq: jest.Mock;
      select: jest.Mock;
    } {
      const select = jest.fn().mockResolvedValue(response);
      const eq = jest.fn();
      const chain = { eq, select };
      eq.mockReturnValue(chain);

      const update = jest.fn().mockReturnValue(chain);
      const insert = jest.fn();

      return { update, insert, eq, select };
    }

    it('updates existing reflection row when pre-reflection exists', async () => {
      const { update, insert, eq, select } = createUpdateChain({
        data: [{ id: 'reflection-1' }],
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({ update, insert });

      const result = await savePostMeetingReflection(userId, checkinId, postPrompts);

      expect(result).toEqual({ success: true });
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          post_key_takeaway: postPrompts.keyTakeaway,
          post_mood: postPrompts.mood,
          post_gratitude: postPrompts.gratitude,
          post_will_apply: postPrompts.willApply,
          updated_at: expect.any(String),
        }),
      );
      expect(eq).toHaveBeenNthCalledWith(1, 'checkin_id', checkinId);
      expect(eq).toHaveBeenNthCalledWith(2, 'user_id', userId);
      expect(select).toHaveBeenCalledWith('id');
      expect(insert).not.toHaveBeenCalled();
    });

    it('inserts a new row when update matches zero rows', async () => {
      const { update, insert, eq } = createUpdateChain({
        data: [],
        error: null,
      });
      insert.mockResolvedValue({ error: null });

      (supabase.from as jest.Mock).mockReturnValue({ update, insert });

      const result = await savePostMeetingReflection(userId, checkinId, postPrompts);

      expect(result).toEqual({ success: true });
      expect(eq).toHaveBeenCalledTimes(2);
      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          checkin_id: checkinId,
          post_key_takeaway: postPrompts.keyTakeaway,
          post_mood: postPrompts.mood,
          post_gratitude: postPrompts.gratitude,
          post_will_apply: postPrompts.willApply,
          created_at: expect.any(String),
          updated_at: expect.any(String),
        }),
      );
    });

    it('returns failure when update reports an error', async () => {
      const updateError: SupabaseLikeError = { message: 'update failed' };
      const { update, insert } = createUpdateChain({
        data: null,
        error: updateError,
      });

      (supabase.from as jest.Mock).mockReturnValue({ update, insert });

      const result = await savePostMeetingReflection(userId, checkinId, postPrompts);

      expect(result).toEqual({ success: false, error: 'update failed' });
      expect(insert).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith('Meeting reflection: Post-meeting save failed', {
        error: updateError,
      });
    });

    it('returns failure when fallback insert fails', async () => {
      const { update, insert } = createUpdateChain({
        data: [],
        error: null,
      });
      const insertError: SupabaseLikeError = { message: 'insert fallback failed' };
      insert.mockResolvedValue({ error: insertError });

      (supabase.from as jest.Mock).mockReturnValue({ update, insert });

      const result = await savePostMeetingReflection(userId, checkinId, postPrompts);

      expect(result).toEqual({ success: false, error: 'insert fallback failed' });
      expect(logger.warn).toHaveBeenCalledWith(
        'Meeting reflection: Post-meeting insert fallback failed',
        { error: insertError },
      );
    });
  });

  describe('query helpers', () => {
    it('gets reflection for a check-in', async () => {
      const reflection: MeetingReflection = {
        id: 'reflection-1',
        user_id: userId,
        checkin_id: checkinId,
        pre_intention: 'Be present',
        pre_mood: 2,
        pre_hope: 'Find perspective',
        post_key_takeaway: 'Keep showing up',
        post_mood: 4,
        post_gratitude: 'Community',
        post_will_apply: 'Share honestly',
        created_at: '2026-02-01T00:00:00.000Z',
        updated_at: '2026-02-01T01:00:00.000Z',
      };

      const single = jest.fn().mockResolvedValue({ data: reflection, error: null });
      const eq = jest.fn();
      const queryChain = { eq, single };
      eq.mockReturnValue(queryChain);
      const select = jest.fn().mockReturnValue(queryChain);

      (supabase.from as jest.Mock).mockReturnValue({ select });

      const result = await getReflectionForCheckin(userId, checkinId);

      expect(result).toEqual(reflection);
      expect(select).toHaveBeenCalledWith('*');
      expect(eq).toHaveBeenNthCalledWith(1, 'user_id', userId);
      expect(eq).toHaveBeenNthCalledWith(2, 'checkin_id', checkinId);
    });

    it('returns null when check-in reflection query errors', async () => {
      const single = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'query failed' },
      });
      const eq = jest.fn();
      const queryChain = { eq, single };
      eq.mockReturnValue(queryChain);
      const select = jest.fn().mockReturnValue(queryChain);

      (supabase.from as jest.Mock).mockReturnValue({ select });

      const result = await getReflectionForCheckin(userId, checkinId);

      expect(result).toBeNull();
    });

    it('gets all reflections for a user ordered by created_at desc', async () => {
      const rows = [
        {
          id: 'r2',
          user_id: userId,
          checkin_id: 'c2',
          created_at: '2026-02-02T00:00:00.000Z',
          updated_at: '2026-02-02T00:00:00.000Z',
        },
        {
          id: 'r1',
          user_id: userId,
          checkin_id: 'c1',
          created_at: '2026-02-01T00:00:00.000Z',
          updated_at: '2026-02-01T00:00:00.000Z',
        },
      ];

      const order = jest.fn().mockResolvedValue({ data: rows, error: null });
      const eq = jest.fn();
      const queryChain = { eq, order };
      eq.mockReturnValue(queryChain);
      const select = jest.fn().mockReturnValue(queryChain);

      (supabase.from as jest.Mock).mockReturnValue({ select });

      const result = await getAllReflections(userId);

      expect(result).toEqual(rows);
      expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('hasReflection returns true only when a reflection exists', async () => {
      const single = jest
        .fn()
        .mockResolvedValueOnce({
          data: {
            id: 'r1',
            user_id: userId,
            checkin_id: checkinId,
            created_at: '2026-02-01T00:00:00.000Z',
            updated_at: '2026-02-01T00:00:00.000Z',
          },
          error: null,
        })
        .mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

      const eq = jest.fn();
      const queryChain = { eq, single };
      eq.mockReturnValue(queryChain);
      const select = jest.fn().mockReturnValue(queryChain);

      (supabase.from as jest.Mock).mockReturnValue({ select });

      const exists = await hasReflection(userId, checkinId);
      const missing = await hasReflection(userId, 'missing-checkin');

      expect(exists).toBe(true);
      expect(missing).toBe(false);
    });
  });

  describe('pure helpers', () => {
    it('calculates mood lift when both moods are present', () => {
      const reflection: MeetingReflection = {
        id: 'reflection-1',
        user_id: userId,
        checkin_id: checkinId,
        pre_mood: 2,
        post_mood: 5,
        created_at: '2026-02-01T00:00:00.000Z',
        updated_at: '2026-02-01T00:00:00.000Z',
      };

      expect(calculateMoodLift(reflection)).toBe(3);
    });

    it('returns null mood lift when one side is missing', () => {
      const reflection: MeetingReflection = {
        id: 'reflection-2',
        user_id: userId,
        checkin_id: checkinId,
        pre_mood: 2,
        created_at: '2026-02-01T00:00:00.000Z',
        updated_at: '2026-02-01T00:00:00.000Z',
      };

      expect(calculateMoodLift(reflection)).toBeNull();
    });

    it('returns prompt values from approved pre/post prompt sets', () => {
      const allowedPrePrompts = [
        'What do you hope to get from this meeting?',
        "What's on your mind as you arrive?",
        'What intention are you setting for this meeting?',
        'What would make this meeting valuable for you?',
      ];
      const allowedPostPrompts = [
        "What's one thing you'll remember from today?",
        'What resonated most with you?',
        'What was your biggest takeaway?',
        'What spoke to you today?',
      ];

      for (let index = 0; index < 20; index++) {
        expect(allowedPrePrompts).toContain(getRandomPrePrompt());
        expect(allowedPostPrompts).toContain(getRandomPostPrompt());
      }
    });
  });
});
