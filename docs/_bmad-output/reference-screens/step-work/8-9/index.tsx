/**
 * Eighth/Ninth Step Amends Tracker
 * Track people to make amends to and progress
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, Button } from '../../../components/ui';
import { useAmendsStore } from '../../../lib/store';
import type { AmendsType, AmendsStatus } from '../../../lib/types';

const STATUS_CONFIG: Record<AmendsStatus, {
  label: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  not_willing: {
    label: 'Not Yet Willing',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    description: 'Praying for willingness',
  },
  willing: {
    label: 'Willing',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    description: 'Ready but not yet started',
  },
  planned: {
    label: 'Planned',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    description: 'Have a plan to make amends',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    description: 'Making living amends',
  },
  made: {
    label: 'Made',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    description: 'Amends completed',
  },
};

const AMENDS_TYPES: { value: AmendsType; label: string; description: string }[] = [
  { value: 'direct', label: 'Direct', description: 'Face-to-face or direct communication' },
  { value: 'indirect', label: 'Indirect', description: 'When direct would cause harm' },
  { value: 'living', label: 'Living', description: 'Changed behavior over time' },
];

interface DecryptedAmend {
  id: string;
  person: string;
  harm: string;
  amendsType: AmendsType;
  status: AmendsStatus;
  notes?: string;
  madeAt?: Date;
}

export default function AmendsTrackerScreen() {
  const router = useRouter();
  const { entries, loadEntries, createEntry, updateEntry, markAmendsMade, deleteEntry, getDecryptedEntry, getStats, isLoading } = useAmendsStore();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [decryptedEntries, setDecryptedEntries] = useState<DecryptedAmend[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<AmendsStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [person, setPerson] = useState('');
  const [harm, setHarm] = useState('');
  const [amendsType, setAmendsType] = useState<AmendsType>('direct');
  const [status, setStatus] = useState<AmendsStatus>('not_willing');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadEntries();
  }, []);

  // Decrypt entries for display
  useEffect(() => {
    const decryptEntries = async () => {
      const decrypted: DecryptedAmend[] = [];
      
      for (const entry of entries) {
        const dec = await getDecryptedEntry(entry.id);
        if (dec) {
          decrypted.push({
            id: entry.id,
            person: dec.person,
            harm: dec.harm,
            amendsType: entry.amendsType,
            status: entry.status,
            notes: dec.notes,
            madeAt: entry.madeAt,
          });
        }
      }
      
      setDecryptedEntries(decrypted);
    };

    decryptEntries();
  }, [entries]);

  const stats = getStats();
  const filteredEntries = selectedStatus === 'all'
    ? decryptedEntries
    : decryptedEntries.filter(e => e.status === selectedStatus);

  const handleSave = async () => {
    if (!person.trim()) {
      Alert.alert('Required', 'Please enter the person\'s name');
      return;
    }

    try {
      await createEntry(person.trim(), harm.trim(), amendsType, status, notes.trim() || undefined);
      
      // Reset form
      setPerson('');
      setHarm('');
      setAmendsType('direct');
      setStatus('not_willing');
      setNotes('');
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to save amends entry:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    }
  };

  const handleStatusChange = async (id: string, newStatus: AmendsStatus) => {
    if (newStatus === 'made') {
      Alert.alert(
        'Mark Amends as Made',
        'Are you sure you want to mark this amends as made?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, Made',
            onPress: () => markAmendsMade(id),
          },
        ]
      );
    } else {
      await updateEntry(id, { status: newStatus });
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Entry',
      `Are you sure you want to delete the amends entry for "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteEntry(id),
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Text className="text-primary-600 text-base">← Back</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              Amends Tracker
            </Text>
            <Text className="text-surface-500 text-sm">
              Steps 8 & 9 - Making Amends
            </Text>
          </View>
        </View>

        {/* Stats Overview */}
        <Card variant="elevated" className="mb-6 bg-primary-50 dark:bg-primary-900/20">
          <View className="flex-row items-center justify-between">
            <View className="items-center flex-1">
              <Text className="text-3xl font-bold text-primary-600">{stats.total}</Text>
              <Text className="text-xs text-surface-500">Total</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-3xl font-bold text-amber-600">{stats.willing + stats.planned}</Text>
              <Text className="text-xs text-surface-500">In Process</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-3xl font-bold text-green-600">{stats.made}</Text>
              <Text className="text-xs text-surface-500">Made</Text>
            </View>
          </View>
          
          {/* Progress bar */}
          {stats.total > 0 && (
            <View className="mt-4">
              <View className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                <View 
                  className="h-2 bg-green-500 rounded-full"
                  style={{ width: `${(stats.made / stats.total) * 100}%` }}
                />
              </View>
              <Text className="text-xs text-surface-500 text-center mt-1">
                {Math.round((stats.made / stats.total) * 100)}% complete
              </Text>
            </View>
          )}
        </Card>

        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          <TouchableOpacity
            onPress={() => setSelectedStatus('all')}
            className={`px-4 py-2 rounded-full mr-2 ${
              selectedStatus === 'all'
                ? 'bg-primary-500'
                : 'bg-surface-100 dark:bg-surface-800'
            }`}
          >
            <Text className={selectedStatus === 'all' ? 'text-white' : 'text-surface-600 dark:text-surface-400'}>
              All ({stats.total})
            </Text>
          </TouchableOpacity>
          {(Object.keys(STATUS_CONFIG) as AmendsStatus[]).map((statusKey) => {
            const count = stats[statusKey === 'not_willing' ? 'notWilling' : statusKey === 'in_progress' ? 'inProgress' : statusKey];
            return (
              <TouchableOpacity
                key={statusKey}
                onPress={() => setSelectedStatus(statusKey)}
                className={`px-4 py-2 rounded-full mr-2 ${
                  selectedStatus === statusKey
                    ? 'bg-primary-500'
                    : 'bg-surface-100 dark:bg-surface-800'
                }`}
              >
                <Text className={selectedStatus === statusKey ? 'text-white' : 'text-surface-600 dark:text-surface-400'}>
                  {STATUS_CONFIG[statusKey].label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Add Button */}
        <Button
          title="+ Add Person to Amends List"
          onPress={() => setShowAddModal(true)}
          variant="outline"
          className="mb-4"
        />

        {/* Amends List */}
        {filteredEntries.length === 0 ? (
          <Card variant="outlined" className="mt-4">
            <View className="items-center py-8">
              <Text className="text-4xl mb-4">📝</Text>
              <Text className="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-2">
                No Amends {selectedStatus !== 'all' ? `(${STATUS_CONFIG[selectedStatus].label})` : ''} Yet
              </Text>
              <Text className="text-surface-500 text-center">
                {selectedStatus === 'all'
                  ? 'Start building your list of people to make amends to'
                  : `No amends with status "${STATUS_CONFIG[selectedStatus].label}"`}
              </Text>
            </View>
          </Card>
        ) : (
          filteredEntries.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              onPress={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              activeOpacity={0.7}
            >
              <Card variant="default" className={`mb-3 ${STATUS_CONFIG[entry.status].bgColor}`}>
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-base font-semibold text-surface-900 dark:text-surface-100">
                        {entry.person}
                      </Text>
                      <View className="bg-surface-200 dark:bg-surface-700 px-2 py-0.5 rounded">
                        <Text className={`text-xs font-medium ${STATUS_CONFIG[entry.status].color}`}>
                          {STATUS_CONFIG[entry.status].label}
                        </Text>
                      </View>
                    </View>
                    {expandedId !== entry.id && (
                      <Text className="text-sm text-surface-500 mt-1" numberOfLines={2}>
                        {entry.harm || 'No details added'}
                      </Text>
                    )}
                  </View>
                  <Text className="text-surface-400 ml-2">
                    {expandedId === entry.id ? '▲' : '▼'}
                  </Text>
                </View>

                {expandedId === entry.id && (
                  <View className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
                    <View className="mb-3">
                      <Text className="text-xs font-medium text-surface-500 uppercase mb-1">
                        What I Did / The Harm
                      </Text>
                      <Text className="text-sm text-surface-700 dark:text-surface-300">
                        {entry.harm || 'Not specified'}
                      </Text>
                    </View>

                    <View className="mb-3">
                      <Text className="text-xs font-medium text-surface-500 uppercase mb-1">
                        Type of Amends
                      </Text>
                      <Text className="text-sm text-surface-700 dark:text-surface-300 capitalize">
                        {entry.amendsType}
                      </Text>
                    </View>

                    {entry.notes && (
                      <View className="mb-3">
                        <Text className="text-xs font-medium text-surface-500 uppercase mb-1">
                          Notes
                        </Text>
                        <Text className="text-sm text-surface-700 dark:text-surface-300">
                          {entry.notes}
                        </Text>
                      </View>
                    )}

                    {entry.madeAt && (
                      <View className="mb-3">
                        <Text className="text-xs font-medium text-surface-500 uppercase mb-1">
                          Made On
                        </Text>
                        <Text className="text-sm text-green-600">
                          {entry.madeAt.toLocaleDateString()}
                        </Text>
                      </View>
                    )}

                    {/* Status Change Buttons */}
                    <View className="mb-3">
                      <Text className="text-xs font-medium text-surface-500 uppercase mb-2">
                        Update Status
                      </Text>
                      <View className="flex-row flex-wrap gap-2">
                        {(Object.keys(STATUS_CONFIG) as AmendsStatus[]).map((statusKey) => (
                          <TouchableOpacity
                            key={statusKey}
                            onPress={() => handleStatusChange(entry.id, statusKey)}
                            className={`px-3 py-1.5 rounded-lg ${
                              entry.status === statusKey
                                ? 'bg-primary-500'
                                : 'bg-surface-200 dark:bg-surface-700'
                            }`}
                          >
                            <Text
                              className={`text-xs ${
                                entry.status === statusKey
                                  ? 'text-white'
                                  : 'text-surface-600 dark:text-surface-400'
                              }`}
                            >
                              {STATUS_CONFIG[statusKey].label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDelete(entry.id, entry.person)}
                      className="mt-2 self-end"
                    >
                      <Text className="text-red-500 text-sm">Delete Entry</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          ))
        )}

        {/* Guidance */}
        <Card variant="outlined" className="mt-4 mb-8">
          <Text className="text-base font-semibold text-surface-900 dark:text-surface-100 mb-2">
            📖 Making Amends
          </Text>
          <Text className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
            "Made direct amends to such people wherever possible, except when to do so would injure them or others."
          </Text>
          <Text className="text-sm text-surface-500 mt-2 italic">
            Always discuss amends with your sponsor before making them.
          </Text>
        </Card>

        <View className="h-6" />
      </ScrollView>

      {/* Add Entry Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <View className="px-4 py-4 border-b border-surface-200 dark:border-surface-700 flex-row items-center justify-between">
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text className="text-surface-500">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                Add to Amends List
              </Text>
              <TouchableOpacity onPress={handleSave}>
                <Text className="text-primary-600 font-semibold">Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-4 py-4" keyboardShouldPersistTaps="handled">
              {/* Person */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Person's Name *
                </Text>
                <TextInput
                  value={person}
                  onChangeText={setPerson}
                  placeholder="Who do you need to make amends to?"
                  placeholderTextColor="#9ca3af"
                  className="bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-100"
                />
              </View>

              {/* Harm */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  What I Did / The Harm
                </Text>
                <TextInput
                  value={harm}
                  onChangeText={setHarm}
                  placeholder="What did you do that harmed this person?"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={4}
                  className="bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-100 min-h-[100px]"
                  textAlignVertical="top"
                />
              </View>

              {/* Amends Type */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Type of Amends
                </Text>
                <View className="gap-2">
                  {AMENDS_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      onPress={() => setAmendsType(type.value)}
                      className={`p-3 rounded-xl border ${
                        amendsType === type.value
                          ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-500'
                          : 'bg-surface-100 dark:bg-surface-800 border-surface-200 dark:border-surface-700'
                      }`}
                    >
                      <Text className={`font-medium ${
                        amendsType === type.value
                          ? 'text-primary-700 dark:text-primary-300'
                          : 'text-surface-700 dark:text-surface-300'
                      }`}>
                        {type.label}
                      </Text>
                      <Text className="text-xs text-surface-500 mt-0.5">
                        {type.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Initial Status */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Current Status
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {(Object.keys(STATUS_CONFIG) as AmendsStatus[]).filter(s => s !== 'made').map((statusKey) => (
                    <TouchableOpacity
                      key={statusKey}
                      onPress={() => setStatus(statusKey)}
                      className={`px-4 py-2 rounded-lg ${
                        status === statusKey
                          ? 'bg-primary-500'
                          : 'bg-surface-100 dark:bg-surface-800'
                      }`}
                    >
                      <Text className={status === statusKey ? 'text-white' : 'text-surface-600 dark:text-surface-400'}>
                        {STATUS_CONFIG[statusKey].label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Notes */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Notes (Optional)
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any additional notes about this amends..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                  className="bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-100 min-h-[80px]"
                  textAlignVertical="top"
                />
              </View>

              <View className="h-8" />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

