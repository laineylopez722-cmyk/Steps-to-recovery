import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { secureStorage } from '../adapters/secureStorage';
import { performLogoutCleanup } from '../utils/logoutCleanup';
import { setSentryUser } from '../lib/sentry';
import { useDatabase } from './DatabaseContext';
import { logger } from '../utils/logger';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: AuthError | null;
  initialized: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { db, isReady } = useDatabase();
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
    error: null,
    initialized: false,
  });

  useEffect(() => {
    const loadSession = async (): Promise<void> => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        // Initialize secure storage with session token (web only)
        if (session?.access_token && session?.user?.id) {
          try {
            await secureStorage.initializeWithSession(session.user.id, session.access_token);
          } catch (storageError) {
            logger.warn('Secure storage init failed during session load', storageError);
          }
        }

        // Set Sentry user context for error tracking
        setSentryUser(session?.user?.id ?? null);

        setState((prev) => ({
          ...prev,
          session: session ?? prev.session,
          user: session?.user ?? prev.user ?? null,
          loading: false,
          initialized: true,
          error: error ?? null,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          initialized: true,
          error: error as AuthError,
        }));
      }
    };

    void loadSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        // Initialize or clear secure storage based on session state
        if (session?.access_token && session?.user?.id) {
          await secureStorage.initializeWithSession(session.user.id, session.access_token);
        } else {
          await secureStorage.clearSession();
        }
      } catch (storageError) {
        logger.warn('Secure storage update failed during auth change', storageError);
      } finally {
        // Update Sentry user context
        setSentryUser(session?.user?.id ?? null);

        setState((prev) => ({
          ...prev,
          session,
          user: session?.user ?? null,
          error: null,
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      if (data?.session?.access_token && data?.session?.user?.id) {
        try {
          await secureStorage.initializeWithSession(
            data.session.user.id,
            data.session.access_token,
          );
        } catch (storageError) {
          logger.warn('Secure storage init failed during sign-in', storageError);
        }

        setSentryUser(data.session.user.id);
        setState((prev) => ({
          ...prev,
          session: data.session,
          user: data.session.user,
          initialized: true,
          error: null,
        }));
      }
    } catch (error) {
      setState((prev) => ({ ...prev, error: error as AuthError }));
      throw error;
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;

      const session = data?.session;
      if (session?.access_token && session?.user?.id) {
        try {
          await secureStorage.initializeWithSession(session.user.id, session.access_token);
        } catch (storageError) {
          logger.warn('Secure storage init failed during sign-up', storageError);
        }

        setSentryUser(session.user.id);
        setState((prev) => ({
          ...prev,
          session: session,
          user: session.user,
          initialized: true,
          error: null,
        }));
      }
    } catch (error) {
      setState((prev) => ({ ...prev, error: error as AuthError }));
      throw error;
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      // Perform complete logout cleanup (encryption keys + session + local data)
      await performLogoutCleanup({ db: isReady ? (db ?? undefined) : undefined });

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      setState((prev) => ({ ...prev, error: error as AuthError }));
      throw error;
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [db, isReady]);

  const resetPassword = useCallback(async (email: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error) {
      setState((prev) => ({ ...prev, error: error as AuthError }));
      throw error;
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
