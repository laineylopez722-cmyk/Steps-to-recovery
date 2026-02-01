/**
 * Reflection Card Component
 * Shows past journal entries for reflection ("Look Back")
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouterCompat } from '../../utils/navigationHelper';
import { LegacyCard as Card } from '../ui';
import { useJournalStore } from '@recovery/shared';
import { decryptContent } from '../../utils/encryption';
import type { JournalEntry } from '@recovery/shared';

interface ReflectionCardProps {
  daysAgo?: number; // Default 30
  className?: string;
}

export function ReflectionCard({ daysAgo = 30, className = '' }: ReflectionCardProps) {
  const router = useRouterCompat();
  const { entries } = useJournalStore();
  const [pastEntry, setPastEntry] = useState<JournalEntry | null>(null);
  const [excerpt, setExcerpt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    findPastEntry();
  }, [entries, daysAgo]);

  const findPastEntry = async () => {
    setIsLoading(true);

    // Calculate target date range (within 2 days of the target)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysAgo);

    const rangeStart = new Date(targetDate);
    rangeStart.setDate(rangeStart.getDate() - 2);

    const rangeEnd = new Date(targetDate);
    rangeEnd.setDate(rangeEnd.getDate() + 2);

    // Find entries in that range
    const entriesInRange = entries.filter((entry) => {
      const entryDate = new Date(entry.createdAt);
      return entryDate >= rangeStart && entryDate <= rangeEnd;
    });

    if (entriesInRange.length > 0) {
      // Pick a random entry from that time
      const entry = entriesInRange[Math.floor(Math.random() * entriesInRange.length)];
      setPastEntry(entry);

      // Decrypt and get excerpt
      try {
        const decrypted = await decryptContent(entry.content);
        // Get first 100 characters
        const truncated = decrypted.length > 100 ? decrypted.substring(0, 100) + '...' : decrypted;
        setExcerpt(truncated);
      } catch {
        setExcerpt('(Encrypted content)');
      }
    } else {
      setPastEntry(null);
      setExcerpt('');
    }

    setIsLoading(false);
  };

  if (isLoading || !pastEntry) {
    return null;
  }

  const entryDate = new Date(pastEntry.createdAt);
  const actualDaysAgo = Math.floor(
    (new Date().getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  return (
    <Card
      variant="outlined"
      className={`border-secondary-200 dark:border-secondary-800 ${className}`}
    >
      <View className="flex-row items-start gap-3">
        <View className="w-10 h-10 rounded-full bg-secondary-100 dark:bg-secondary-900/30 items-center justify-center">
          <Text className="text-lg">📖</Text>
        </View>

        <View className="flex-1">
          <Text className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">
            Look Back • {actualDaysAgo} days ago
          </Text>

          <Text className="text-surface-700 dark:text-surface-300 text-sm mb-2" numberOfLines={2}>
            "{excerpt}"
          </Text>

          <TouchableOpacity
            onPress={() => router.push(`/journal/${pastEntry.id}`)}
            className="self-start"
          >
            <Text className="text-secondary-600 dark:text-secondary-400 text-sm font-medium">
              Read & Reflect →
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}
