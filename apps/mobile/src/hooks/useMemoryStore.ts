/**
 * Memory Store Hook
 * 
 * Manages the AI companion's memory of the user.
 * Stores extracted memories from journal entries, check-ins, and chats.
 * Provides query functions for the AI to retrieve relevant context.
 */

import { useState, useCallback, useEffect } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import type { Memory, MemoryType } from '../features/journal/utils/memoryExtraction';

// Memory summary for AI context
export interface MemorySummary {
  // Key people in user's life
  people: Array<{
    name: string;
    relationship?: string;
    lastMentioned: Date;
  }>;
  
  // Known triggers
  triggers: string[];
  
  // Coping strategies that work
  copingStrategies: string[];
  
  // Recent victories
  recentVictories: Array<{
    content: string;
    date: Date;
  }>;
  
  // Current struggles
  currentStruggles: string[];
  
  // Goals
  goals: string[];
  
  // Key insights
  insights: string[];
  
  // Emotional patterns
  emotionalTrends: {
    positive: string[];
    negative: string[];
  };
}

export interface UseMemoryStoreReturn {
  // Add new memories
  addMemories: (memories: Memory[]) => Promise<void>;
  
  // Get all memories
  getAllMemories: () => Promise<Memory[]>;
  
  // Get memories by type
  getMemoriesByType: (type: MemoryType) => Promise<Memory[]>;
  
  // Get recent memories
  getRecentMemories: (days?: number) => Promise<Memory[]>;
  
  // Search memories
  searchMemories: (query: string) => Promise<Memory[]>;
  
  // Get AI-ready summary
  getMemorySummary: () => Promise<MemorySummary>;
  
  // Generate context string for AI
  generateAIContext: () => Promise<string>;
  
  // Update a memory
  updateMemory: (id: string, updates: Partial<Memory>) => Promise<void>;
  
  // Delete a memory
  deleteMemory: (id: string) => Promise<void>;
  
  isLoading: boolean;
}

export function useMemoryStore(userId: string): UseMemoryStoreReturn {
  const { db, isReady } = useDatabase();
  const [isLoading, setIsLoading] = useState(false);
  
  // Ensure memory table exists
  useEffect(() => {
    if (!db || !isReady) return;
    
    const initTable = async () => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS memories (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            type TEXT NOT NULL,
            content TEXT NOT NULL,
            context TEXT,
            confidence REAL DEFAULT 0.5,
            source TEXT DEFAULT 'journal',
            source_id TEXT,
            key TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
          CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id);
          CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
          CREATE INDEX IF NOT EXISTS idx_memories_key ON memories(key);
        `);
      } catch (err) {
        console.error('Failed to init memory table:', err);
      }
    };
    
    initTable();
  }, [db, isReady]);
  
  const addMemories = useCallback(async (memories: Memory[]) => {
    if (!db || !isReady || memories.length === 0) return;
    
    setIsLoading(true);
    try {
      for (const memory of memories) {
        // Check if memory with same key exists (for deduplication)
        if (memory.key) {
          const existing = await db.getFirstAsync<{ id: string }>(
            'SELECT id FROM memories WHERE user_id = ? AND key = ?',
            [userId, memory.key]
          );
          
          if (existing) {
            // Update existing memory
            await db.runAsync(
              `UPDATE memories SET 
                content = ?, context = ?, confidence = ?, updated_at = ?
              WHERE id = ?`,
              [
                memory.content,
                memory.context || null,
                memory.confidence,
                new Date().toISOString(),
                existing.id,
              ]
            );
            continue;
          }
        }
        
        // Insert new memory
        await db.runAsync(
          `INSERT INTO memories 
            (id, user_id, type, content, context, confidence, source, source_id, key, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            memory.id,
            userId,
            memory.type,
            memory.content,
            memory.context || null,
            memory.confidence,
            memory.source,
            memory.sourceId || null,
            memory.key || null,
            memory.createdAt.toISOString(),
            memory.updatedAt.toISOString(),
          ]
        );
      }
    } catch (err) {
      console.error('Failed to add memories:', err);
    } finally {
      setIsLoading(false);
    }
  }, [db, isReady, userId]);
  
  const getAllMemories = useCallback(async (): Promise<Memory[]> => {
    if (!db || !isReady) return [];
    
    try {
      const rows = await db.getAllAsync<any>(
        'SELECT * FROM memories WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      return rows.map(rowToMemory);
    } catch (err) {
      console.error('Failed to get memories:', err);
      return [];
    }
  }, [db, isReady, userId]);
  
  const getMemoriesByType = useCallback(async (type: MemoryType): Promise<Memory[]> => {
    if (!db || !isReady) return [];
    
    try {
      const rows = await db.getAllAsync<any>(
        'SELECT * FROM memories WHERE user_id = ? AND type = ? ORDER BY created_at DESC',
        [userId, type]
      );
      return rows.map(rowToMemory);
    } catch (err) {
      console.error('Failed to get memories by type:', err);
      return [];
    }
  }, [db, isReady, userId]);
  
  const getRecentMemories = useCallback(async (days = 7): Promise<Memory[]> => {
    if (!db || !isReady) return [];
    
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    try {
      const rows = await db.getAllAsync<any>(
        'SELECT * FROM memories WHERE user_id = ? AND created_at > ? ORDER BY created_at DESC',
        [userId, cutoff.toISOString()]
      );
      return rows.map(rowToMemory);
    } catch (err) {
      console.error('Failed to get recent memories:', err);
      return [];
    }
  }, [db, isReady, userId]);
  
  const searchMemories = useCallback(async (query: string): Promise<Memory[]> => {
    if (!db || !isReady || !query.trim()) return [];
    
    try {
      const rows = await db.getAllAsync<any>(
        `SELECT * FROM memories 
        WHERE user_id = ? AND (content LIKE ? OR context LIKE ?)
        ORDER BY confidence DESC, created_at DESC
        LIMIT 20`,
        [userId, `%${query}%`, `%${query}%`]
      );
      return rows.map(rowToMemory);
    } catch (err) {
      console.error('Failed to search memories:', err);
      return [];
    }
  }, [db, isReady, userId]);
  
  const getMemorySummary = useCallback(async (): Promise<MemorySummary> => {
    if (!db || !isReady) {
      return emptyMemorySummary();
    }
    
    try {
      const all = await getAllMemories();
      
      const summary: MemorySummary = {
        people: [],
        triggers: [],
        copingStrategies: [],
        recentVictories: [],
        currentStruggles: [],
        goals: [],
        insights: [],
        emotionalTrends: { positive: [], negative: [] },
      };
      
      for (const memory of all) {
        switch (memory.type) {
          case 'person':
            summary.people.push({
              name: memory.content,
              lastMentioned: memory.updatedAt,
            });
            break;
          case 'trigger':
            if (!summary.triggers.includes(memory.content)) {
              summary.triggers.push(memory.content);
            }
            break;
          case 'coping_strategy':
            if (!summary.copingStrategies.includes(memory.content)) {
              summary.copingStrategies.push(memory.content);
            }
            break;
          case 'victory':
            summary.recentVictories.push({
              content: memory.content,
              date: memory.createdAt,
            });
            break;
          case 'struggle':
            if (!summary.currentStruggles.includes(memory.content)) {
              summary.currentStruggles.push(memory.content);
            }
            break;
          case 'goal':
            if (!summary.goals.includes(memory.content)) {
              summary.goals.push(memory.content);
            }
            break;
          case 'insight':
            summary.insights.push(memory.content);
            break;
          case 'emotion':
            // Parse emotions
            const emotions = memory.content.split(',').map(e => e.trim());
            for (const emotion of emotions) {
              if (['happy', 'grateful', 'proud', 'hopeful', 'calm'].some(p => emotion.includes(p))) {
                if (!summary.emotionalTrends.positive.includes(emotion)) {
                  summary.emotionalTrends.positive.push(emotion);
                }
              } else {
                if (!summary.emotionalTrends.negative.includes(emotion)) {
                  summary.emotionalTrends.negative.push(emotion);
                }
              }
            }
            break;
        }
      }
      
      // Limit arrays
      summary.people = summary.people.slice(0, 10);
      summary.triggers = summary.triggers.slice(0, 10);
      summary.copingStrategies = summary.copingStrategies.slice(0, 10);
      summary.recentVictories = summary.recentVictories.slice(0, 5);
      summary.currentStruggles = summary.currentStruggles.slice(0, 5);
      summary.goals = summary.goals.slice(0, 5);
      summary.insights = summary.insights.slice(0, 5);
      
      return summary;
    } catch (err) {
      console.error('Failed to get memory summary:', err);
      return emptyMemorySummary();
    }
  }, [db, isReady, getAllMemories]);
  
  const generateAIContext = useCallback(async (): Promise<string> => {
    const summary = await getMemorySummary();
    
    const parts: string[] = [];
    
    if (summary.people.length > 0) {
      parts.push(`People in their life: ${summary.people.map(p => p.name).join(', ')}`);
    }
    
    if (summary.triggers.length > 0) {
      parts.push(`Known triggers: ${summary.triggers.join(', ')}`);
    }
    
    if (summary.copingStrategies.length > 0) {
      parts.push(`Coping strategies that work: ${summary.copingStrategies.join(', ')}`);
    }
    
    if (summary.recentVictories.length > 0) {
      parts.push(`Recent wins: ${summary.recentVictories.map(v => v.content).join('; ')}`);
    }
    
    if (summary.currentStruggles.length > 0) {
      parts.push(`Current struggles: ${summary.currentStruggles.join(', ')}`);
    }
    
    if (summary.goals.length > 0) {
      parts.push(`Goals: ${summary.goals.join(', ')}`);
    }
    
    if (summary.insights.length > 0) {
      parts.push(`Key insights: ${summary.insights.join('; ')}`);
    }
    
    return parts.join('\n');
  }, [getMemorySummary]);
  
  const updateMemory = useCallback(async (id: string, updates: Partial<Memory>) => {
    if (!db || !isReady) return;
    
    try {
      const fields: string[] = [];
      const values: any[] = [];
      
      if (updates.content !== undefined) {
        fields.push('content = ?');
        values.push(updates.content);
      }
      if (updates.context !== undefined) {
        fields.push('context = ?');
        values.push(updates.context);
      }
      if (updates.confidence !== undefined) {
        fields.push('confidence = ?');
        values.push(updates.confidence);
      }
      
      fields.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);
      
      await db.runAsync(
        `UPDATE memories SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    } catch (err) {
      console.error('Failed to update memory:', err);
    }
  }, [db, isReady]);
  
  const deleteMemory = useCallback(async (id: string) => {
    if (!db || !isReady) return;
    
    try {
      await db.runAsync('DELETE FROM memories WHERE id = ?', [id]);
    } catch (err) {
      console.error('Failed to delete memory:', err);
    }
  }, [db, isReady]);
  
  return {
    addMemories,
    getAllMemories,
    getMemoriesByType,
    getRecentMemories,
    searchMemories,
    getMemorySummary,
    generateAIContext,
    updateMemory,
    deleteMemory,
    isLoading,
  };
}

// Helpers

function rowToMemory(row: any): Memory {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as MemoryType,
    content: row.content,
    context: row.context,
    confidence: row.confidence,
    source: row.source,
    sourceId: row.source_id,
    key: row.key,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function emptyMemorySummary(): MemorySummary {
  return {
    people: [],
    triggers: [],
    copingStrategies: [],
    recentVictories: [],
    currentStruggles: [],
    goals: [],
    insights: [],
    emotionalTrends: { positive: [], negative: [] },
  };
}
