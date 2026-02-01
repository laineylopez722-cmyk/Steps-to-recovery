/**
 * Mock Supabase client for testing
 */

export const mockSupabaseQuery = {
  data: null as unknown,
  error: null as unknown,
  count: null as number | null,
};

export const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockImplementation(() => Promise.resolve(mockSupabaseQuery)),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockImplementation(() => Promise.resolve(mockSupabaseQuery)),
  auth: {
    getUser: jest.fn(),
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
  },
};

export function resetMockSupabase() {
  mockSupabaseQuery.data = null;
  mockSupabaseQuery.error = null;
  mockSupabaseQuery.count = null;

  Object.values(mockSupabase).forEach((fn) => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      (fn as jest.Mock).mockClear();
    }
  });
}

jest.mock('../../lib/supabase', () => ({
  supabase: mockSupabase,
}));
