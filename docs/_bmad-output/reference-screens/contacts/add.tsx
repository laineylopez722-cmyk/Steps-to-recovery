/**
 * Add/Edit Contact Screen
 * Form for creating or editing recovery contacts
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useContacts } from '../../lib/hooks/useContacts';
import { Card, Button, Input } from '../../components/ui';
import type { ContactRole } from '../../lib/types';

const ROLE_OPTIONS: { role: ContactRole; label: string; description: string }[] = [
  { role: 'sponsor', label: 'Sponsor', description: 'Your primary guide in recovery' },
  { role: 'emergency', label: 'Emergency', description: 'For crisis situations' },
  { role: 'sponsee', label: 'Sponsee', description: 'Someone you sponsor' },
  { role: 'home_group', label: 'Home Group', description: 'Members of your home group' },
  { role: 'fellowship', label: 'Fellowship', description: 'Other recovery contacts' },
];

export default function AddContactScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ editId?: string; role?: ContactRole }>();
  const {
    addContact,
    updateContact,
    getContactById,
    decryptContactNotes,
    sponsor,
  } = useContacts();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<ContactRole>(
    params.role || 'fellowship'
  );
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Load existing contact for editing
  useEffect(() => {
    const loadContact = async () => {
      if (params.editId) {
        setIsEditing(true);
        const contact = await getContactById(params.editId);
        if (contact) {
          setName(contact.name);
          setPhone(contact.phone);
          setSelectedRole(contact.role);
          if (contact.notes) {
            const decryptedNotes = await decryptContactNotes(contact);
            setNotes(decryptedNotes || '');
          }
        }
      }
    };

    loadContact();
  }, [params.editId]);

  const formatPhoneNumber = (text: string): string => {
    // Remove non-digits
    const digits = text.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for US numbers
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (text: string) => {
    setPhone(formatPhoneNumber(text));
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return false;
    }

    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return false;
    }

    // Warn if trying to add second sponsor
    if (selectedRole === 'sponsor' && sponsor && !isEditing) {
      Alert.alert(
        'Sponsor Already Set',
        'You already have a sponsor. Adding a new sponsor will not replace the existing one.',
        [{ text: 'OK' }]
      );
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (isEditing && params.editId) {
        await updateContact(params.editId, {
          name: name.trim(),
          phone: phone.trim(),
          role: selectedRole,
          notes: notes.trim() || undefined,
        });
      } else {
        await addContact(
          name.trim(),
          phone.trim(),
          selectedRole,
          notes.trim() || undefined
        );
      }
      router.back();
    } catch (error) {
      console.error('Failed to save contact:', error);
      Alert.alert('Error', 'Failed to save contact. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-surface-200 dark:border-surface-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center -ml-2"
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <Text className="flex-1 text-xl font-bold text-surface-900 dark:text-surface-100 text-center">
          {isEditing ? 'Edit Contact' : 'Add Contact'}
        </Text>
        <View className="w-10" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4 py-6">
          {/* Name Input */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Name *
            </Text>
            <Input
              value={name}
              onChangeText={setName}
              placeholder="John D."
              autoCapitalize="words"
              autoComplete="name"
            />
          </View>

          {/* Phone Input */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Phone Number *
            </Text>
            <Input
              value={phone}
              onChangeText={handlePhoneChange}
              placeholder="(555) 123-4567"
              keyboardType="phone-pad"
              autoComplete="tel"
            />
          </View>

          {/* Role Selection */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
              Relationship
            </Text>
            <View className="gap-2">
              {ROLE_OPTIONS.map(({ role, label, description }) => (
                <TouchableOpacity
                  key={role}
                  onPress={() => setSelectedRole(role)}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selectedRole === role }}
                  accessibilityLabel={`${label}: ${description}`}
                >
                  <Card
                    variant={selectedRole === role ? 'default' : 'outlined'}
                    className={
                      selectedRole === role
                        ? 'border-2 border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : ''
                    }
                  >
                    <View className="flex-row items-center">
                      <View
                        className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                          selectedRole === role
                            ? 'border-primary-600 bg-primary-600'
                            : 'border-surface-400'
                        }`}
                      >
                        {selectedRole === role && (
                          <View className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text
                          className={`font-medium ${
                            selectedRole === role
                              ? 'text-primary-700 dark:text-primary-300'
                              : 'text-surface-900 dark:text-surface-100'
                          }`}
                        >
                          {label}
                        </Text>
                        <Text className="text-sm text-surface-500">
                          {description}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes Input */}
          <View className="mb-8">
            <Text className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Notes (Optional)
            </Text>
            <Input
              value={notes}
              onChangeText={setNotes}
              placeholder="Meeting they attend, how we met, etc."
              multiline
              numberOfLines={3}
              className="h-24"
            />
            <Text className="text-xs text-surface-500 mt-1">
              Notes are encrypted and stored securely on your device.
            </Text>
          </View>

          {/* Save Button */}
          <Button
            title={isEditing ? 'Save Changes' : 'Add Contact'}
            onPress={handleSave}
            loading={isLoading}
            disabled={!name.trim() || phone.replace(/\D/g, '').length < 10}
            size="lg"
          />

          {/* Bottom spacing */}
          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

