/**
 * AI Settings Screen
 * Configure API key for AI companion.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Eye, EyeOff, ExternalLink, Check, X } from 'lucide-react-native';
import { getAIService } from '../services/aiService';

export function AISettingsScreen() {
  const navigation = useNavigation();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [provider, setProvider] = useState<'openai' | 'anthropic' | null>(null);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      const service = await getAIService();
      const configured = await service.isConfigured();
      setIsConfigured(configured);
      if (configured) {
        setProvider(service.getProvider());
      }
    } catch {
      setIsConfigured(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }

    setIsSaving(true);
    try {
      const service = await getAIService();
      await service.setApiKey(apiKey.trim());
      setIsConfigured(true);
      setProvider(service.getProvider());
      setApiKey('');
      Alert.alert('Success', 'API key saved successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to save API key');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    Alert.alert(
      'Clear API Key',
      'Are you sure you want to remove your API key? The AI companion will stop working.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const service = await getAIService();
            await service.clearApiKey();
            setIsConfigured(false);
            setProvider(null);
          },
        },
      ]
    );
  };

  const openProviderSite = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-800">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white">AI Companion Settings</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* Status */}
        <View className="bg-gray-900 rounded-2xl p-4 mb-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-400">Status</Text>
            <View className="flex-row items-center">
              {isConfigured ? (
                <>
                  <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                  <Text className="text-green-500">Connected</Text>
                </>
              ) : (
                <>
                  <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                  <Text className="text-red-500">Not configured</Text>
                </>
              )}
            </View>
          </View>

          {isConfigured && provider && (
            <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-800">
              <Text className="text-gray-400">Provider</Text>
              <Text className="text-white capitalize">{provider}</Text>
            </View>
          )}
        </View>

        {/* API Key Input */}
        <View className="mb-6">
          <Text className="text-white font-medium mb-2">
            {isConfigured ? 'Update API Key' : 'Enter API Key'}
          </Text>
          <View className="flex-row items-center bg-gray-900 rounded-xl">
            <TextInput
              value={apiKey}
              onChangeText={setApiKey}
              placeholder={isConfigured ? '••••••••••••••••' : 'sk-... or sk-ant-...'}
              placeholderTextColor="#6B7280"
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
              className="flex-1 px-4 py-4 text-white"
            />
            <TouchableOpacity
              onPress={() => setShowKey(!showKey)}
              className="px-4"
            >
              {showKey ? (
                <EyeOff size={20} color="#6B7280" />
              ) : (
                <Eye size={20} color="#6B7280" />
              )}
            </TouchableOpacity>
          </View>

          <Text className="text-gray-500 text-sm mt-2">
            Your key is stored securely on-device and never sent to our servers.
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving || !apiKey.trim()}
          className={`rounded-xl py-4 mb-4 ${
            apiKey.trim() && !isSaving ? 'bg-amber-500' : 'bg-gray-800'
          }`}
        >
          <Text
            className={`text-center font-semibold ${
              apiKey.trim() && !isSaving ? 'text-black' : 'text-gray-500'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save API Key'}
          </Text>
        </TouchableOpacity>

        {/* Clear Button */}
        {isConfigured && (
          <TouchableOpacity
            onPress={handleClear}
            className="rounded-xl py-4 border border-red-500/30"
          >
            <Text className="text-red-500 text-center font-semibold">
              Clear API Key
            </Text>
          </TouchableOpacity>
        )}

        {/* Help Section */}
        <View className="mt-8">
          <Text className="text-white font-medium mb-4">Get an API Key</Text>

          <TouchableOpacity
            onPress={() => openProviderSite('https://platform.openai.com/api-keys')}
            className="flex-row items-center justify-between bg-gray-900 rounded-xl p-4 mb-3"
          >
            <View>
              <Text className="text-white font-medium">OpenAI</Text>
              <Text className="text-gray-500 text-sm">GPT-4o, GPT-4o-mini</Text>
            </View>
            <ExternalLink size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => openProviderSite('https://console.anthropic.com/settings/keys')}
            className="flex-row items-center justify-between bg-gray-900 rounded-xl p-4"
          >
            <View>
              <Text className="text-white font-medium">Anthropic</Text>
              <Text className="text-gray-500 text-sm">Claude 3.5 Sonnet</Text>
            </View>
            <ExternalLink size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Privacy Note */}
        <View className="mt-8 p-4 bg-gray-900/50 rounded-xl">
          <Text className="text-gray-400 text-sm leading-5">
            💡 Your conversations are encrypted on your device. The AI provider only
            sees your messages during the conversation - they don't store them.
            Your API key stays on your phone.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
