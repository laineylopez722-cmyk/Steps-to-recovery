/**
 * Step 8/9 Amends Tracker
 * Track people to make amends to and progress.
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import type { AmendsEntry } from '../types';
import { ds } from '../../../design-system/tokens/ds';

interface AmendsTrackerProps {
  entries: AmendsEntry[];
  onAdd: (entry: Omit<AmendsEntry, 'status' | 'completedAt'>) => Promise<void>;
  onUpdate: (entry: AmendsEntry) => Promise<void>;
}

const AMENDS_TYPES = [
  { id: 'direct', label: 'Direct', description: 'Face-to-face amends' },
  { id: 'indirect', label: 'Indirect', description: 'When direct would cause harm' },
  { id: 'living', label: 'Living', description: 'Changed behavior over time' },
  { id: 'impossible', label: 'Impossible', description: 'Person deceased or unreachable' },
];

export function AmendsTracker({ entries, onAdd, onUpdate }: AmendsTrackerProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({
    who: '',
    harm: '',
    amendsType: 'direct' as AmendsEntry['amendsType'],
    notes: '',
  });

  const handleAdd = async () => {
    if (newEntry.who && newEntry.harm) {
      await onAdd(newEntry);
      setNewEntry({ who: '', harm: '', amendsType: 'direct', notes: '' });
      setShowAdd(false);
    }
  };

  const toggleStatus = async (entry: AmendsEntry) => {
    const nextStatus =
      entry.status === 'not_started'
        ? 'in_progress'
        : entry.status === 'in_progress'
          ? 'complete'
          : 'not_started';

    await onUpdate({
      ...entry,
      status: nextStatus,
      completedAt: nextStatus === 'complete' ? new Date().toISOString() : undefined,
    });
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'text-green-500';
      case 'in_progress':
        return 'text-amber-500';
      default:
        return 'text-gray-500';
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return '✓';
      case 'in_progress':
        return '◐';
      default:
        return '○';
    }
  };

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-800">
        <View>
          <Text className="text-white text-xl font-bold">Amends List</Text>
          <Text className="text-gray-500 text-sm">
            {entries.filter((e) => e.status === 'complete').length} of {entries.length} complete
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowAdd(true)}
          className="bg-amber-500 rounded-full w-10 h-10 items-center justify-center"
        >
          <Text className="text-black text-2xl font-bold">+</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={entries}
        keyExtractor={(item) => item.who}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => toggleStatus(item)}
            className="flex-row items-center px-4 py-4 border-b border-gray-800"
          >
            <Text
              className={`text-2xl mr-3 ${
                item.status === 'complete'
                  ? 'text-green-500'
                  : item.status === 'in_progress'
                    ? 'text-amber-500'
                    : 'text-gray-500'
              }`}
            >
              {statusIcon(item.status)}
            </Text>
            <View className="flex-1">
              <Text className="text-white font-medium">{item.who}</Text>
              <Text className="text-gray-400 text-sm" numberOfLines={1}>
                {item.harm}
              </Text>
              <Text className={`text-xs mt-1 ${statusColor(item.status)}`}>
                {item.amendsType.charAt(0).toUpperCase() + item.amendsType.slice(1)} amends
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <Text className="text-gray-500 text-center">
              No amends entries yet.{'\n'}Tap + to add someone.
            </Text>
          </View>
        }
      />

      {/* Add Modal - simplified inline */}
      {showAdd && (
        <View className="absolute inset-0 bg-black/95 p-4">
          <Text className="text-white text-xl font-bold mb-6">Add Amends Entry</Text>

          <Text className="text-gray-400 mb-2">Who do you owe amends to?</Text>
          <TextInput
            value={newEntry.who}
            onChangeText={(v) => setNewEntry((p) => ({ ...p, who: v }))}
            placeholder="Name"
            placeholderTextColor={ds.colors.textTertiary}
            className="bg-gray-800 rounded-xl p-4 text-white mb-4"
          />

          <Text className="text-gray-400 mb-2">What harm did you cause?</Text>
          <TextInput
            value={newEntry.harm}
            onChangeText={(v) => setNewEntry((p) => ({ ...p, harm: v }))}
            placeholder="Describe the harm..."
            placeholderTextColor={ds.colors.textTertiary}
            multiline
            className="bg-gray-800 rounded-xl p-4 text-white mb-4 min-h-[80px]"
            textAlignVertical="top"
          />

          <Text className="text-gray-400 mb-2">Type of amends</Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {AMENDS_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                onPress={() =>
                  setNewEntry((p) => ({ ...p, amendsType: type.id as AmendsEntry['amendsType'] }))
                }
                className={`px-4 py-2 rounded-full border ${
                  newEntry.amendsType === type.id
                    ? 'bg-amber-500/20 border-amber-500'
                    : 'border-gray-700'
                }`}
              >
                <Text
                  className={newEntry.amendsType === type.id ? 'text-amber-500' : 'text-gray-400'}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setShowAdd(false)}
              className="flex-1 bg-gray-800 rounded-xl py-4"
            >
              <Text className="text-white text-center">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAdd}
              disabled={!newEntry.who || !newEntry.harm}
              className={`flex-1 rounded-xl py-4 ${newEntry.who && newEntry.harm ? 'bg-amber-500' : 'bg-gray-700'}`}
            >
              <Text
                className={`text-center font-medium ${newEntry.who && newEntry.harm ? 'text-black' : 'text-gray-500'}`}
              >
                Add
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
