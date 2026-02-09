/**
 * Step 10 Daily Review
 * Evening inventory prompts.
 */

import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';

interface DailyReviewProps {
  onComplete: (review: DailyReviewData) => Promise<void>;
  date: string;
}

export interface DailyReviewData {
  date: string;
  wasSelfish: string;
  wasDishonest: string;
  wasAfraid: string;
  oweApology: string;
  didWell: string;
  gratefulFor: string;
}

const PROMPTS = [
  { key: 'wasSelfish', question: 'Was I selfish today?', placeholder: 'Where did I put myself first unfairly...' },
  { key: 'wasDishonest', question: 'Was I dishonest?', placeholder: 'Any lies, even small ones...' },
  { key: 'wasAfraid', question: 'Was I afraid?', placeholder: 'What fears drove my actions...' },
  { key: 'oweApology', question: 'Do I owe anyone an apology?', placeholder: 'Who did I wrong today...' },
  { key: 'didWell', question: 'What did I do well?', placeholder: 'Acknowledge your wins...' },
  { key: 'gratefulFor', question: 'What am I grateful for?', placeholder: 'Three things...' },
];

export function DailyReview({ onComplete, date }: DailyReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  const currentPrompt = PROMPTS[currentIndex];
  const isLast = currentIndex === PROMPTS.length - 1;
  
  const handleNext = () => {
    if (isLast) {
      onComplete({
        date,
        wasSelfish: answers.wasSelfish || '',
        wasDishonest: answers.wasDishonest || '',
        wasAfraid: answers.wasAfraid || '',
        oweApology: answers.oweApology || '',
        didWell: answers.didWell || '',
        gratefulFor: answers.gratefulFor || '',
      });
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  const handleSkip = () => {
    if (!isLast) setCurrentIndex(currentIndex + 1);
  };
  
  return (
    <View className="flex-1 bg-black p-4">
      {/* Progress */}
      <View className="flex-row gap-1 mb-8">
        {PROMPTS.map((_, i) => (
          <View 
            key={i} 
            className={`flex-1 h-1 rounded-full ${i <= currentIndex ? 'bg-amber-500' : 'bg-gray-800'}`} 
          />
        ))}
      </View>
      
      {/* Question */}
      <Text className="text-2xl font-bold text-white mb-2">
        {currentPrompt.question}
      </Text>
      <Text className="text-gray-500 mb-6">Step 10 · Daily Inventory</Text>
      
      {/* Answer */}
      <TextInput
        value={answers[currentPrompt.key] || ''}
        onChangeText={(v) => setAnswers(prev => ({ ...prev, [currentPrompt.key]: v }))}
        placeholder={currentPrompt.placeholder}
        placeholderTextColor="#9CA3AF"
        multiline
        className="bg-gray-800 rounded-xl p-4 text-white text-base min-h-[150px] flex-1"
        textAlignVertical="top"
        autoFocus
      />
      
      {/* Navigation */}
      <View className="flex-row gap-3 mt-4">
        {currentIndex > 0 && (
          <TouchableOpacity 
            onPress={() => setCurrentIndex(currentIndex - 1)}
            className="bg-gray-800 rounded-xl py-4 px-6"
          >
            <Text className="text-white">Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          onPress={handleSkip}
          className="bg-gray-800 rounded-xl py-4 px-6"
        >
          <Text className="text-gray-400">Skip</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={handleNext}
          className="flex-1 bg-amber-500 rounded-xl py-4"
        >
          <Text className="text-black text-center font-medium">
            {isLast ? 'Complete' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
