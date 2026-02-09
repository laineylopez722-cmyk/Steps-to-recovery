/**
 * Fourth Step Inventory Type Screen
 * List and add entries for resentments, fears, or sex conduct
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card, Button } from '../../../../components/ui';
import { useFourthStepStore, AFFECTS_OPTIONS } from '../../../../lib/store/fourthStepStore';
import type { FourthStepType } from '../../../../lib/types';

const TYPE_CONFIG: Record<FourthStepType, {
  title: string;
  icon: string;
  color: string;
  bgColor: string;
  whoLabel: string;
  causeLabel: string;
  affectsLabel: string;
  myPartLabel: string;
  whoPlaceholder: string;
  causePlaceholder: string;
  myPartPlaceholder: string;
}> = {
  resentment: {
    title: 'Resentments',
    icon: '😤',
    color: 'bg-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    whoLabel: 'I resent...',
    causeLabel: 'The Cause',
    affectsLabel: 'It Affects My...',
    myPartLabel: 'My Part In It',
    whoPlaceholder: 'Person, institution, or principle...',
    causePlaceholder: 'What did they do? Be specific...',
    myPartPlaceholder: 'What was MY part in this resentment?',
  },
  fear: {
    title: 'Fears',
    icon: '😰',
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    whoLabel: 'I fear...',
    causeLabel: 'Why?',
    affectsLabel: 'It Affects My...',
    myPartLabel: 'What I Can Do',
    whoPlaceholder: 'What are you afraid of?',
    causePlaceholder: 'Why does this scare you?',
    myPartPlaceholder: 'How can you address this fear?',
  },
  sex_conduct: {
    title: 'Relationships',
    icon: '💔',
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    whoLabel: 'Who was involved?',
    causeLabel: 'What Happened',
    affectsLabel: 'Who I Hurt',
    myPartLabel: 'My Ideal',
    whoPlaceholder: 'Name of person...',
    causePlaceholder: 'What did I do? Where was I wrong?',
    myPartPlaceholder: 'What would the ideal behavior have been?',
  },
};

interface DecryptedEntry {
  id: string;
  who: string;
  cause: string;
  affects: string[];
  myPart: string;
}

export default function FourthStepTypeScreen() {
  const router = useRouter();
  const { type: typeParam } = useLocalSearchParams<{ type: string }>();
  const inventoryType = (typeParam || 'resentment') as FourthStepType;
  const config = TYPE_CONFIG[inventoryType];

  const { entries, loadEntriesByType, createEntry, deleteEntry, getDecryptedEntry, isLoading } = useFourthStepStore();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [decryptedEntries, setDecryptedEntries] = useState<DecryptedEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [who, setWho] = useState('');
  const [cause, setCause] = useState('');
  const [selectedAffects, setSelectedAffects] = useState<string[]>([]);
  const [myPart, setMyPart] = useState('');

  // Load entries
  useEffect(() => {
    loadEntriesByType(inventoryType);
  }, [inventoryType]);

  // Decrypt entries for display
  useEffect(() => {
    const decryptEntries = async () => {
      const typeEntries = entries.filter(e => e.type === inventoryType);
      const decrypted: DecryptedEntry[] = [];
      
      for (const entry of typeEntries) {
        const dec = await getDecryptedEntry(entry.id);
        if (dec) {
          decrypted.push({
            id: entry.id,
            who: dec.who,
            cause: dec.cause,
            affects: entry.affects,
            myPart: dec.myPart,
          });
        }
      }
      
      setDecryptedEntries(decrypted);
    };

    decryptEntries();
  }, [entries, inventoryType]);

  const handleToggleAffect = (affect: string) => {
    setSelectedAffects(prev =>
      prev.includes(affect)
        ? prev.filter(a => a !== affect)
        : [...prev, affect]
    );
  };

  const handleSave = async () => {
    if (!who.trim()) {
      Alert.alert('Required', `Please enter ${config.whoLabel.toLowerCase()}`);
      return;
    }

    try {
      await createEntry(inventoryType, who.trim(), cause.trim(), selectedAffects, myPart.trim());
      
      // Reset form
      setWho('');
      setCause('');
      setSelectedAffects([]);
      setMyPart('');
      setShowAddModal(false);
      
      // Reload entries
      await loadEntriesByType(inventoryType);
    } catch (error) {
      console.error('Failed to save entry:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Entry',
      `Are you sure you want to delete the entry for "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteEntry(id);
            await loadEntriesByType(inventoryType);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <View className="px-4 py-4 border-b border-surface-200 dark:border-surface-700">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Text className="text-primary-600 text-base">← Back</Text>
          </TouchableOpacity>
          <View className="flex-1 flex-row items-center gap-2">
            <View className={`w-8 h-8 rounded-full ${config.color} items-center justify-center`}>
              <Text className="text-lg">{config.icon}</Text>
            </View>
            <Text className="text-xl font-bold text-surface-900 dark:text-surface-100">
              {config.title}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            className="bg-primary-500 px-4 py-2 rounded-xl"
          >
            <Text className="text-white font-medium">+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Entry List */}
      <ScrollView className="flex-1 px-4 py-4">
        {decryptedEntries.length === 0 ? (
          <Card variant="outlined" className="mt-4">
            <View className="items-center py-8">
              <Text className="text-4xl mb-4">{config.icon}</Text>
              <Text className="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-2">
                No {config.title} Yet
              </Text>
              <Text className="text-surface-500 text-center mb-4">
                Tap the + Add button to start your inventory
              </Text>
              <Button
                title={`Add ${config.title.slice(0, -1)}`}
                onPress={() => setShowAddModal(true)}
                size="sm"
              />
            </View>
          </Card>
        ) : (
          decryptedEntries.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              onPress={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              activeOpacity={0.7}
            >
              <Card variant="default" className={`mb-3 ${config.bgColor}`}>
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-surface-900 dark:text-surface-100">
                      {entry.who}
                    </Text>
                    {!expandedId || expandedId !== entry.id ? (
                      <Text className="text-sm text-surface-500 mt-1" numberOfLines={2}>
                        {entry.cause || 'No details added'}
                      </Text>
                    ) : null}
                  </View>
                  <Text className="text-surface-400 ml-2">
                    {expandedId === entry.id ? '▲' : '▼'}
                  </Text>
                </View>

                {expandedId === entry.id && (
                  <View className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
                    <View className="mb-3">
                      <Text className="text-xs font-medium text-surface-500 uppercase mb-1">
                        {config.causeLabel}
                      </Text>
                      <Text className="text-sm text-surface-700 dark:text-surface-300">
                        {entry.cause || 'Not specified'}
                      </Text>
                    </View>

                    <View className="mb-3">
                      <Text className="text-xs font-medium text-surface-500 uppercase mb-1">
                        {config.affectsLabel}
                      </Text>
                      <View className="flex-row flex-wrap gap-1">
                        {entry.affects.length > 0 ? (
                          entry.affects.map((affect) => (
                            <View
                              key={affect}
                              className="bg-surface-200 dark:bg-surface-700 px-2 py-1 rounded"
                            >
                              <Text className="text-xs text-surface-700 dark:text-surface-300">
                                {affect}
                              </Text>
                            </View>
                          ))
                        ) : (
                          <Text className="text-sm text-surface-500">Not specified</Text>
                        )}
                      </View>
                    </View>

                    <View className="mb-3">
                      <Text className="text-xs font-medium text-surface-500 uppercase mb-1">
                        {config.myPartLabel}
                      </Text>
                      <Text className="text-sm text-surface-700 dark:text-surface-300">
                        {entry.myPart || 'Not specified'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDelete(entry.id, entry.who)}
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

        <View className="h-8" />
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
            {/* Modal Header */}
            <View className="px-4 py-4 border-b border-surface-200 dark:border-surface-700 flex-row items-center justify-between">
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text className="text-surface-500">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                Add {config.title.slice(0, -1)}
              </Text>
              <TouchableOpacity onPress={handleSave}>
                <Text className="text-primary-600 font-semibold">Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-4 py-4" keyboardShouldPersistTaps="handled">
              {/* Who/What */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  {config.whoLabel} *
                </Text>
                <TextInput
                  value={who}
                  onChangeText={setWho}
                  placeholder={config.whoPlaceholder}
                  placeholderTextColor="#9ca3af"
                  className="bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-100"
                />
              </View>

              {/* Cause */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  {config.causeLabel}
                </Text>
                <TextInput
                  value={cause}
                  onChangeText={setCause}
                  placeholder={config.causePlaceholder}
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={4}
                  className="bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-100 min-h-[100px]"
                  textAlignVertical="top"
                />
              </View>

              {/* Affects (checkboxes) */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  {config.affectsLabel}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {AFFECTS_OPTIONS.map((affect) => (
                    <TouchableOpacity
                      key={affect}
                      onPress={() => handleToggleAffect(affect)}
                      className={`px-3 py-2 rounded-lg border ${
                        selectedAffects.includes(affect)
                          ? 'bg-primary-500 border-primary-500'
                          : 'bg-surface-100 dark:bg-surface-800 border-surface-200 dark:border-surface-700'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          selectedAffects.includes(affect)
                            ? 'text-white'
                            : 'text-surface-700 dark:text-surface-300'
                        }`}
                      >
                        {affect}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* My Part */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  {config.myPartLabel}
                </Text>
                <TextInput
                  value={myPart}
                  onChangeText={setMyPart}
                  placeholder={config.myPartPlaceholder}
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={4}
                  className="bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-3 text-surface-900 dark:text-surface-100 min-h-[100px]"
                  textAlignVertical="top"
                />
              </View>

              {/* Tip */}
              <Card variant="outlined" className="mt-2 mb-8">
                <Text className="text-sm text-surface-500 text-center">
                  💡 Remember: The goal is to identify YOUR part. 
                  What could you have done differently?
                </Text>
              </Card>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

