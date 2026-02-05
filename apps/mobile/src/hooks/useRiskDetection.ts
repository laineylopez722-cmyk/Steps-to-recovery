/**
 * useRiskDetection Hook
 * 
 * React hook for risk pattern detection with automatic refresh
 * Manages detection state, caching, and periodic checks
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { detectRiskPatterns, dismissPattern, notifySponsor, wasRecentlyDismissed } from '../services/riskDetectionService';
import type { RiskDetectionResult, RiskPattern, RiskPatternType } from '../services/riskDetectionService';
import { logger } from '../utils/logger';

// ========================================
// Query Keys
// ========================================

const RISK_DETECTION_KEY = 'riskDetection';

const getRiskDetectionKey = (userId: string) => [RISK_DETECTION_KEY, userId];

// ========================================
// Hook
// ========================================

export interface UseRiskDetectionResult {
  // State
  result: RiskDetectionResult | null;
  isLoading: boolean;
  error: Error | null;
  
  // Primary pattern (highest severity/priority)
  primaryPattern: RiskPattern | null;
  
  // Actions
  refresh: () => Promise<void>;
  dismiss: (patternType: RiskPatternType) => Promise<void>;
  notifySponsorAbout: (pattern: RiskPattern) => Promise<{ success: boolean; error?: string }>;
  
  // Utilities
  hasHighRisk: boolean;
  hasAnyRisk: boolean;
  patternCount: number;
}

export function useRiskDetection(userId: string | undefined): UseRiskDetectionResult {
  const queryClient = useQueryClient();
  const [filteredPatterns, setFilteredPatterns] = useState<RiskPattern[]>([]);

  // Query for risk detection
  const {
    data: result,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: getRiskDetectionKey(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      return await detectRiskPatterns(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: 30 * 60 * 1000, // Re-check every 30 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Filter out recently dismissed patterns
  useEffect(() => {
    if (!result || !userId) {
      setFilteredPatterns([]);
      return;
    }

    const filterDismissed = async () => {
      const filtered: RiskPattern[] = [];
      
      for (const pattern of result.patterns) {
        const dismissed = await wasRecentlyDismissed(userId, pattern.type);
        if (!dismissed) {
          filtered.push(pattern);
        }
      }
      
      setFilteredPatterns(filtered);
    };

    filterDismissed();
  }, [result, userId]);

  // Get primary pattern (highest priority)
  const primaryPattern = filteredPatterns.length > 0 ? filteredPatterns[0] : null;

  // Refresh detection
  const refresh = useCallback(async () => {
    if (!userId) return;
    await refetch();
  }, [userId, refetch]);

  // Dismiss pattern mutation
  const dismissMutation = useMutation({
    mutationFn: async (patternType: RiskPatternType) => {
      if (!userId) throw new Error('User ID required');
      await dismissPattern(userId, patternType);
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: getRiskDetectionKey(userId || '') });
    },
    onError: (error) => {
      logger.error('useRiskDetection: Dismiss failed', { error });
    },
  });

  // Notify sponsor mutation
  const notifySponsorMutation = useMutation({
    mutationFn: async (pattern: RiskPattern) => {
      if (!userId) throw new Error('User ID required');
      return await notifySponsor(userId, pattern);
    },
    onError: (error) => {
      logger.error('useRiskDetection: Notify sponsor failed', { error });
    },
  });

  // Dismiss handler
  const dismiss = useCallback(
    async (patternType: RiskPatternType) => {
      await dismissMutation.mutateAsync(patternType);
    },
    [dismissMutation]
  );

  // Notify sponsor handler
  const notifySponsorAbout = useCallback(
    async (pattern: RiskPattern) => {
      return await notifySponsorMutation.mutateAsync(pattern);
    },
    [notifySponsorMutation]
  );

  // Computed values
  const hasHighRisk = filteredPatterns.some((p) => p.severity === 'high');
  const hasAnyRisk = filteredPatterns.length > 0;
  const patternCount = filteredPatterns.length;

  return {
    result: result || null,
    isLoading,
    error: error as Error | null,
    primaryPattern,
    refresh,
    dismiss,
    notifySponsorAbout,
    hasHighRisk,
    hasAnyRisk,
    patternCount,
  };
}

// ========================================
// Utility Hook: Auto-check on mount
// ========================================

/**
 * Automatically check for risks on component mount
 * Useful for dashboard/home screen
 */
export function useAutoRiskDetection(userId: string | undefined): UseRiskDetectionResult {
  const detection = useRiskDetection(userId);

  useEffect(() => {
    if (userId) {
      detection.refresh();
    }
  }, [userId]); // Only run on mount/userId change

  return detection;
}
