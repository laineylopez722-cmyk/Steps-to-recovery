/**
 * Weekly Report Hook
 *
 * Provides React Query wrappers for generating and fetching weekly
 * recovery reports. Reports are encrypted at rest.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { useAuth } from '../../../contexts/AuthContext';
import {
  generateWeeklyReport,
  getWeeklyReports,
} from '../../../services/weeklyReportService';
import type { WeeklyReport } from '../../ai-companion/services/weeklyReport';
import { logger } from '../../../utils/logger';

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function useWeeklyReport(): {
  currentReport: WeeklyReport | null;
  pastReports: WeeklyReport[];
  isLoading: boolean;
  isGenerating: boolean;
  generate: () => void;
  error: Error | null;
} {
  const { db, isReady } = useDatabase();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? '';

  const pastQuery = useQuery({
    queryKey: ['weekly-reports', userId],
    queryFn: async () => {
      if (!db) return [];
      return getWeeklyReports(db, userId, 12);
    },
    enabled: isReady && !!db && !!userId,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!db) throw new Error('Database not ready');
      const weekStart = getWeekStart();
      return generateWeeklyReport(db, userId, weekStart);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-reports', userId] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Failed to generate weekly report', { message });
    },
  });

  const reports = pastQuery.data ?? [];
  const weekStart = getWeekStart().toISOString().split('T')[0] ?? '';
  const currentReport = reports.find((r) => r.weekStarting === weekStart) ?? null;

  return {
    currentReport,
    pastReports: reports,
    isLoading: pastQuery.isLoading,
    isGenerating: generateMutation.isPending,
    generate: () => generateMutation.mutate(),
    error: (pastQuery.error as Error | null),
  };
}
