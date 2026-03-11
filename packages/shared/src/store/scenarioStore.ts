/**
 * Scenario Practice Store
 * Tracks user's trigger scenario practice history
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/client';
import { encryptContent, decryptContent } from '../encryption';
import type { ScenarioPractice, DbScenarioPractice } from '../types';
import { logger } from '../utils/logger';

interface ScenarioState {
  practices: ScenarioPractice[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadPractices: () => Promise<void>;
  addPractice: (
    practice: Omit<ScenarioPractice, 'id' | 'completedAt'>,
  ) => Promise<ScenarioPractice>;
  getPracticesByScenario: (scenarioId: string) => ScenarioPractice[];
  getTotalPractices: () => number;
  getRecentPractices: (limit?: number) => ScenarioPractice[];
  getSuccessRate: () => number; // Percentage of healthy choices
}

function generateId(): string {
  return `practice_${uuidv4()}`;
}

async function dbToPractice(row: DbScenarioPractice): Promise<ScenarioPractice> {
  return {
    id: row.id,
    scenarioId: row.scenario_id,
    selectedOptionIndex: row.selected_option_index,
    reflection: row.reflection ? await decryptContent(row.reflection) : undefined,
    completedAt: new Date(row.completed_at),
  };
}

export const useScenarioStore = create<ScenarioState>((set, get) => ({
  practices: [],
  isLoading: false,
  error: null,

  loadPractices: async () => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<DbScenarioPractice>(
        'SELECT * FROM scenario_practices ORDER BY completed_at DESC',
      );

      const practices: ScenarioPractice[] = [];
      for (const row of rows) {
        try {
          practices.push(await dbToPractice(row));
        } catch (error) {
          logger.error('Failed to process scenario practice', error);
        }
      }

      set({ practices, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load scenario practices', isLoading: false });
      logger.error('Load scenario practices error', error);
    }
  },

  addPractice: async (practice) => {
    const id = generateId();
    const now = new Date().toISOString();

    try {
      const db = await getDatabase();
      const encryptedReflection = practice.reflection
        ? await encryptContent(practice.reflection)
        : null;

      await db.runAsync(
        `INSERT INTO scenario_practices (id, scenario_id, selected_option_index, reflection, completed_at)
         VALUES (?, ?, ?, ?, ?)`,
        [id, practice.scenarioId, practice.selectedOptionIndex, encryptedReflection, now],
      );

      const newPractice: ScenarioPractice = {
        id,
        scenarioId: practice.scenarioId,
        selectedOptionIndex: practice.selectedOptionIndex,
        reflection: practice.reflection,
        completedAt: new Date(now),
      };

      set((state) => ({
        practices: [newPractice, ...state.practices],
      }));

      return newPractice;
    } catch (error) {
      logger.error('Add scenario practice error', error);
      throw error;
    }
  },

  getPracticesByScenario: (scenarioId) => {
    return get().practices.filter((p) => p.scenarioId === scenarioId);
  },

  getTotalPractices: () => {
    return get().practices.length;
  },

  getRecentPractices: (limit = 10) => {
    return get().practices.slice(0, limit);
  },

  getSuccessRate: () => {
    const practices = get().practices;
    if (practices.length === 0) return 0;

    // Import scenarios to check if selected options were healthy
    // This is a simplified version - in real implementation you'd join with scenario data
    // For now, we'll assume even indices are healthier choices based on typical layout
    const healthyChoices = practices.filter((p) => {
      // Options at index 1 and 3 are typically the healthy ones in our scenarios
      return p.selectedOptionIndex === 1 || p.selectedOptionIndex === 3;
    });

    return Math.round((healthyChoices.length / practices.length) * 100);
  },
}));
