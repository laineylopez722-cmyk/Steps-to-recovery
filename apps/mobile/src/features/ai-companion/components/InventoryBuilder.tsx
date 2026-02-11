/**
 * Step 4 Inventory Builder
 * Interactive resentment/fear inventory using the Big Book column method.
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import type { ResentmentEntry } from '../types';
import { ds } from '../../../design-system/tokens/ds';

interface InventoryBuilderProps {
  onSave: (entry: ResentmentEntry) => Promise<void>;
  onCancel: () => void;
  initialEntry?: Partial<ResentmentEntry>;
}

// AFFECTS OPTIONS (what part of self was threatened)
const AFFECTS_OPTIONS = [
  { id: 'self-esteem', label: 'Self-esteem' },
  { id: 'security', label: 'Security' },
  { id: 'ambitions', label: 'Ambitions' },
  { id: 'personal_relations', label: 'Personal Relations' },
  { id: 'sex_relations', label: 'Sex Relations' },
];

export function InventoryBuilder({
  onSave,
  onCancel,
  initialEntry,
}: InventoryBuilderProps): React.ReactElement {
  const [entry, setEntry] = useState<Partial<ResentmentEntry>>({
    who: initialEntry?.who || '',
    cause: initialEntry?.cause || '',
    affects: initialEntry?.affects || [],
    myPart: initialEntry?.myPart || '',
  });
  const [step, setStep] = useState(1); // 1: Who, 2: Cause, 3: Affects, 4: My Part

  const updateField = (field: keyof ResentmentEntry, value: string | string[]): void => {
    setEntry((prev) => ({ ...prev, [field]: value }));
  };

  const toggleAffects = (id: string): void => {
    setEntry((prev) => ({
      ...prev,
      affects: prev.affects?.includes(id)
        ? prev.affects.filter((a) => a !== id)
        : [...(prev.affects || []), id],
    }));
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return !!entry.who?.trim();
      case 2:
        return !!entry.cause?.trim();
      case 3:
        return (entry.affects?.length || 0) > 0;
      case 4:
        return !!entry.myPart?.trim();
      default:
        return false;
    }
  };

  const handleNext = (): void => {
    if (step < 4) setStep(step + 1);
    else handleSave();
  };

  const handleSave = async (): Promise<void> => {
    if (entry.who && entry.cause && entry.affects?.length && entry.myPart) {
      await onSave(entry as ResentmentEntry);
    }
  };

  return (
    <View className="flex-1 bg-black p-4">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-white text-xl font-bold">Step 4 Inventory</Text>
        <Text className="text-gray-500">Column {step} of 4</Text>
      </View>

      {/* Step 1: Who */}
      {step === 1 && (
        <View>
          <Text className="text-amber-500 text-lg mb-2">Column 1: I'm resentful at...</Text>
          <Text className="text-gray-400 mb-4">Who or what are you resentful toward?</Text>
          <TextInput
            value={entry.who}
            onChangeText={(v) => updateField('who', v)}
            placeholder="Person, institution, or principle..."
            placeholderTextColor={ds.colors.textTertiary}
            className="bg-gray-800 rounded-xl p-4 text-white text-base"
            autoFocus
          />
        </View>
      )}

      {/* Step 2: The Cause */}
      {step === 2 && (
        <View>
          <Text className="text-amber-500 text-lg mb-2">Column 2: The cause</Text>
          <Text className="text-gray-400 mb-4">What did {entry.who} do?</Text>
          <TextInput
            value={entry.cause}
            onChangeText={(v) => updateField('cause', v)}
            placeholder="What happened..."
            placeholderTextColor={ds.colors.textTertiary}
            multiline
            className="bg-gray-800 rounded-xl p-4 text-white text-base min-h-[120px]"
            textAlignVertical="top"
            autoFocus
          />
        </View>
      )}

      {/* Step 3: Affects */}
      {step === 3 && (
        <View>
          <Text className="text-amber-500 text-lg mb-2">Column 3: Affects my...</Text>
          <Text className="text-gray-400 mb-4">What part of you was threatened?</Text>
          <View className="gap-2">
            {AFFECTS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => toggleAffects(option.id)}
                className={`
                  p-4 rounded-xl border
                  ${
                    entry.affects?.includes(option.id)
                      ? 'bg-amber-500/20 border-amber-500'
                      : 'bg-gray-800 border-gray-700'
                  }
                `}
              >
                <Text
                  className={entry.affects?.includes(option.id) ? 'text-amber-500' : 'text-white'}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Step 4: My Part */}
      {step === 4 && (
        <View>
          <Text className="text-amber-500 text-lg mb-2">Column 4: My part</Text>
          <Text className="text-gray-400 mb-4">
            What was your role? Where were you selfish, dishonest, self-seeking, or frightened?
          </Text>
          <TextInput
            value={entry.myPart}
            onChangeText={(v) => updateField('myPart', v)}
            placeholder="Be honest with yourself..."
            placeholderTextColor={ds.colors.textTertiary}
            multiline
            className="bg-gray-800 rounded-xl p-4 text-white text-base min-h-[150px]"
            textAlignVertical="top"
            autoFocus
          />
        </View>
      )}

      {/* Navigation */}
      <View className="flex-row gap-3 mt-auto pt-4">
        <TouchableOpacity
          onPress={step > 1 ? () => setStep(step - 1) : onCancel}
          className="flex-1 bg-gray-800 rounded-xl py-4"
        >
          <Text className="text-white text-center font-medium">{step > 1 ? 'Back' : 'Cancel'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNext}
          disabled={!canProceed()}
          className={`flex-1 rounded-xl py-4 ${canProceed() ? 'bg-amber-500' : 'bg-gray-700'}`}
        >
          <Text
            className={`text-center font-medium ${canProceed() ? 'text-black' : 'text-gray-500'}`}
          >
            {step < 4 ? 'Next' : 'Save Entry'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
