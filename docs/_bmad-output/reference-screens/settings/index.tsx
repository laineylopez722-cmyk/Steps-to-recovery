/**
 * Settings Screen
 * App configuration and profile management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Card } from '../../components/ui';
import { useSettingsStore, useProfileStore, useAuthStore } from '../../lib/store';
import { clearAllData } from '../../lib/db/client';
import { clearEncryptionKey } from '../../lib/encryption';
import { exportAndShare, getExportStats } from '../../lib/export';
import type { ProgramType, CrisisRegion } from '../../lib/types';
import { getAvailableRegions } from '../../lib/constants/crisisResources';

interface SettingRowProps {
  icon: string;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

function SettingRow({
  icon,
  title,
  subtitle,
  value,
  onPress,
  toggle,
  toggleValue,
  onToggle,
  accessibilityLabel,
  accessibilityHint,
}: SettingRowProps) {
  const content = (
    <View 
      className="flex-row items-center py-3 border-b border-surface-100 dark:border-surface-800"
      accessible={!onPress && !toggle}
      accessibilityLabel={accessibilityLabel || `${title}${value ? `, ${value}` : ''}`}
    >
      <Text className="text-2xl mr-4" accessibilityElementsHidden>{icon}</Text>
      <View className="flex-1">
        <Text className="text-base text-surface-900 dark:text-surface-100">
          {title}
        </Text>
        {subtitle && (
          <Text className="text-sm text-surface-500">{subtitle}</Text>
        )}
      </View>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: '#e4e4e7', true: '#3b82f6' }}
          thumbColor="#fff"
          accessibilityLabel={`${title} toggle`}
          accessibilityRole="switch"
          accessibilityState={{ checked: toggleValue }}
        />
      ) : value ? (
        <Text className="text-surface-500">{value}</Text>
      ) : onPress ? (
        <Text className="text-surface-400" accessibilityElementsHidden>→</Text>
      ) : null}
    </View>
  );

  if (onPress && !toggle) {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint || (subtitle ? subtitle : undefined)}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const PROGRAM_OPTIONS: { value: ProgramType; label: string }[] = [
  { value: '12-step-aa', label: 'Alcoholics Anonymous' },
  { value: '12-step-na', label: 'Narcotics Anonymous' },
  { value: 'smart', label: 'SMART Recovery' },
  { value: 'custom', label: 'Custom Program' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings, setNotificationsEnabled, setCrisisRegion } = useSettingsStore();
  const { profile, updateProfile } = useProfileStore();
  const { lock, hasPin: checkHasPin } = useAuthStore();
  
  const [hasPin, setHasPin] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Profile editing state
  const [showNameModal, setShowNameModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [editingDate, setEditingDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    checkHasPin().then(setHasPin);
  }, []);

  const getProgramLabel = () => {
    const option = PROGRAM_OPTIONS.find(o => o.value === profile?.programType);
    return option?.label || 'Not set';
  };

  const handleToggleBiometric = async (enabled: boolean) => {
    await updateSettings({ biometricEnabled: enabled });
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    const success = await setNotificationsEnabled(enabled);
    if (!success && enabled) {
      Alert.alert(
        'Permission Required',
        'Please enable notifications in your device settings to receive daily reminders.'
      );
    }
  };

  const handleSetCheckInTime = () => {
    Alert.alert('Check-In Time', 'Select your preferred check-in time', [
      { text: 'Morning (8:00)', onPress: () => updateSettings({ checkInTime: '08:00' }) },
      { text: 'Midday (12:00)', onPress: () => updateSettings({ checkInTime: '12:00' }) },
      { text: 'Evening (18:00)', onPress: () => updateSettings({ checkInTime: '18:00' }) },
      { text: 'Night (21:00)', onPress: () => updateSettings({ checkInTime: '21:00' }) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSetAutoLock = () => {
    Alert.alert('Auto-Lock Timer', 'Lock app after being in background', [
      { text: 'Immediately', onPress: () => updateSettings({ autoLockMinutes: 0 }) },
      { text: '1 minute', onPress: () => updateSettings({ autoLockMinutes: 1 }) },
      { text: '5 minutes', onPress: () => updateSettings({ autoLockMinutes: 5 }) },
      { text: '15 minutes', onPress: () => updateSettings({ autoLockMinutes: 15 }) },
      { text: 'Never', onPress: () => updateSettings({ autoLockMinutes: 999 }) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Get stats to show user what will be exported
      const stats = await getExportStats();
      
      Alert.alert(
        'Export Your Data',
        `This will export all your recovery data:\n\n` +
        `📝 ${stats.journalCount} journal entries\n` +
        `✅ ${stats.checkinCount} daily check-ins\n` +
        `🏆 ${stats.milestoneCount} milestones\n` +
        `📍 ${stats.meetingCount} meeting logs\n` +
        `💎 ${stats.vaultCount} vault items\n` +
        `💌 ${stats.capsuleCount} time capsules\n\n` +
        `The file will contain decrypted data. Keep it secure!`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Export',
            onPress: async () => {
              try {
                await exportAndShare();
              } catch (error) {
                Alert.alert(
                  'Export Failed',
                  'Unable to export your data. Please try again.'
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to prepare export. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearData = () => {
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmText !== 'DELETE') {
      Alert.alert('Incorrect', 'Please type DELETE exactly to confirm.');
      return;
    }

    setIsDeleting(true);
    try {
      // Clear all data from SQLite
      await clearAllData();
      // Clear encryption key from SecureStore
      await clearEncryptionKey();
      
      setShowDeleteModal(false);
      
      // Navigate to onboarding
      router.replace('/onboarding/welcome');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear data. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleLockNow = () => {
    lock();
    router.replace('/(auth)/lock');
  };

  const handleChangeTheme = () => {
    Alert.alert('Theme', 'Choose your preferred theme', [
      { text: 'System Default', onPress: () => updateSettings({ themeMode: 'system' }) },
      { text: 'Light', onPress: () => updateSettings({ themeMode: 'light' }) },
      { text: 'Dark', onPress: () => updateSettings({ themeMode: 'dark' }) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleChangeCrisisRegion = () => {
    const regions = getAvailableRegions();
    Alert.alert(
      'Crisis Resources Region',
      'Select your region for local emergency hotlines',
      regions.map(({ code, name }) => ({
        text: name,
        onPress: () => setCrisisRegion(code as CrisisRegion),
      }))
    );
  };

  const getAutoLockLabel = () => {
    if (!settings) return '';
    if (settings.autoLockMinutes === 0) return 'Immediately';
    if (settings.autoLockMinutes >= 999) return 'Never';
    return `${settings.autoLockMinutes} min`;
  };

  const getThemeLabel = () => {
    if (!settings) return 'System';
    return settings.themeMode.charAt(0).toUpperCase() + settings.themeMode.slice(1);
  };

  const getCrisisRegionLabel = () => {
    if (!settings) return 'United States';
    const regions = getAvailableRegions();
    return regions.find(r => r.code === settings.crisisRegion)?.name || 'United States';
  };

  // Profile editing handlers
  const handleEditName = () => {
    setEditingName(profile?.displayName || '');
    setShowNameModal(true);
  };

  const handleSaveName = async () => {
    await updateProfile({ displayName: editingName || undefined });
    setShowNameModal(false);
  };

  const handleEditDate = () => {
    setEditingDate(profile?.sobrietyDate ? new Date(profile.sobrietyDate) : new Date());
    setShowDateModal(true);
    if (Platform.OS === 'android') {
      setShowDatePicker(true);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'dismissed') {
        setShowDateModal(false);
        return;
      }
    }
    if (selectedDate) {
      setEditingDate(selectedDate);
    }
  };

  const handleSaveDate = async () => {
    await updateProfile({ sobrietyDate: editingDate });
    setShowDateModal(false);
  };

  const handleEditProgram = () => {
    setShowProgramModal(true);
  };

  const handleSelectProgram = async (program: ProgramType) => {
    await updateProfile({ programType: program });
    setShowProgramModal(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-surface-900">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text className="text-primary-600 text-base">← Back</Text>
          </TouchableOpacity>
          <Text 
            className="text-2xl font-bold text-surface-900 dark:text-surface-100"
            accessibilityRole="header"
          >
            Settings
          </Text>
          <View className="w-12" />
        </View>

        {/* Profile Section */}
        <View className="mb-6">
          <Text 
            className="text-sm font-semibold text-surface-500 uppercase mb-2"
            accessibilityRole="header"
          >
            Profile
          </Text>
          <Card variant="default">
            <SettingRow
              icon="👤"
              title="Display Name"
              value={profile?.displayName || 'Not set'}
              onPress={handleEditName}
              accessibilityLabel={`Display name: ${profile?.displayName || 'Not set'}`}
              accessibilityHint="Double tap to edit your display name"
            />
            <SettingRow
              icon="📅"
              title="Sobriety Date"
              value={profile?.sobrietyDate
                ? new Date(profile.sobrietyDate).toLocaleDateString()
                : 'Not set'}
              onPress={handleEditDate}
              accessibilityLabel={`Sobriety date: ${profile?.sobrietyDate ? new Date(profile.sobrietyDate).toLocaleDateString() : 'Not set'}`}
              accessibilityHint="Double tap to edit your sobriety date"
            />
            <SettingRow
              icon="🎯"
              title="Program"
              value={getProgramLabel()}
              onPress={handleEditProgram}
              accessibilityLabel={`Recovery program: ${getProgramLabel()}`}
              accessibilityHint="Double tap to change your recovery program"
            />
          </Card>
        </View>

        {/* Security Section */}
        <View className="mb-6">
          <Text 
            className="text-sm font-semibold text-surface-500 uppercase mb-2"
            accessibilityRole="header"
          >
            Security
          </Text>
          <Card variant="default">
            <SettingRow
              icon="🔐"
              title="Biometric Lock"
              subtitle="Use Face ID / Fingerprint"
              toggle
              toggleValue={settings?.biometricEnabled ?? true}
              onToggle={handleToggleBiometric}
              accessibilityLabel={`Biometric lock: ${settings?.biometricEnabled ? 'enabled' : 'disabled'}`}
              accessibilityHint="Toggle to enable or disable biometric authentication"
            />
            <SettingRow
              icon="⏱️"
              title="Auto-Lock"
              value={getAutoLockLabel()}
              onPress={handleSetAutoLock}
              accessibilityLabel={`Auto-lock timer: ${getAutoLockLabel()}`}
              accessibilityHint="Double tap to change auto-lock duration"
            />
            <SettingRow
              icon="🔒"
              title="Lock Now"
              subtitle="Manually lock the app"
              onPress={handleLockNow}
              accessibilityLabel="Lock the app now"
              accessibilityHint="Double tap to immediately lock the app"
            />
          </Card>
        </View>

        {/* Notifications Section */}
        <View className="mb-6">
          <Text 
            className="text-sm font-semibold text-surface-500 uppercase mb-2"
            accessibilityRole="header"
          >
            Notifications
          </Text>
          <Card variant="default">
            <SettingRow
              icon="🔔"
              title="Daily Reminders"
              subtitle="Get check-in notifications"
              toggle
              toggleValue={settings?.notificationsEnabled ?? true}
              onToggle={handleToggleNotifications}
              accessibilityLabel={`Daily reminders: ${settings?.notificationsEnabled ? 'enabled' : 'disabled'}`}
              accessibilityHint="Toggle to enable or disable daily check-in reminders"
            />
            <SettingRow
              icon="⏰"
              title="Check-In Time"
              value={settings?.checkInTime || '08:00'}
              onPress={handleSetCheckInTime}
              accessibilityLabel={`Check-in reminder time: ${settings?.checkInTime || '08:00'}`}
              accessibilityHint="Double tap to change your daily check-in reminder time"
            />
          </Card>
        </View>

        {/* Appearance Section */}
        <View className="mb-6">
          <Text 
            className="text-sm font-semibold text-surface-500 uppercase mb-2"
            accessibilityRole="header"
          >
            Appearance
          </Text>
          <Card variant="default">
            <SettingRow
              icon="🎨"
              title="Theme"
              value={getThemeLabel()}
              onPress={handleChangeTheme}
              accessibilityLabel={`App theme: ${getThemeLabel()}`}
              accessibilityHint="Double tap to change the app theme"
            />
          </Card>
        </View>

        {/* Crisis Resources Section */}
        <View className="mb-6">
          <Text 
            className="text-sm font-semibold text-surface-500 uppercase mb-2"
            accessibilityRole="header"
          >
            Crisis Resources
          </Text>
          <Card variant="default">
            <SettingRow
              icon="📍"
              title="Region"
              subtitle="Local emergency hotlines"
              value={getCrisisRegionLabel()}
              onPress={handleChangeCrisisRegion}
              accessibilityLabel={`Crisis resources region: ${getCrisisRegionLabel()}`}
              accessibilityHint="Double tap to change your region for crisis resources"
            />
          </Card>
        </View>

        {/* Data Section */}
        <View className="mb-6">
          <Text 
            className="text-sm font-semibold text-surface-500 uppercase mb-2"
            accessibilityRole="header"
          >
            Data & Privacy
          </Text>
          <Card variant="default">
            <SettingRow
              icon="📤"
              title={isExporting ? 'Preparing Export...' : 'Export Data'}
              subtitle="Download your recovery data"
              onPress={handleExportData}
              accessibilityLabel="Export all your data"
              accessibilityHint="Double tap to export all your recovery data to a file"
            />
            <SettingRow
              icon="🗑️"
              title="Delete All Data"
              subtitle="Permanently delete everything"
              onPress={handleClearData}
              accessibilityLabel="Delete all data"
              accessibilityHint="Double tap to permanently delete all your recovery data"
            />
          </Card>
        </View>

        {/* About Section */}
        <View className="mb-6">
          <Text 
            className="text-sm font-semibold text-surface-500 uppercase mb-2"
            accessibilityRole="header"
          >
            About
          </Text>
          <Card variant="default">
            <SettingRow
              icon="ℹ️"
              title="Version"
              value="1.0.0"
              accessibilityLabel="App version 1.0.0"
            />
            <SettingRow
              icon="📜"
              title="Privacy Policy"
              onPress={() => Alert.alert('Privacy', 'Your data never leaves your device. All journal entries are encrypted and stored locally. No analytics, no tracking, no accounts.')}
              accessibilityLabel="View privacy policy"
              accessibilityHint="Double tap to read our privacy policy"
            />
            <SettingRow
              icon="💚"
              title="Made with love"
              subtitle="For the recovery community"
              accessibilityLabel="Made with love for the recovery community"
            />
          </Card>
        </View>

        {/* Footer */}
        <View className="items-center py-8">
          <Text className="text-surface-400 text-sm" accessibilityLabel="One day at a time">
            🌱 One day at a time
          </Text>
        </View>
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal
        visible={showNameModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowNameModal(false)}
        accessibilityViewIsModal
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white dark:bg-surface-800 rounded-2xl p-6 w-full max-w-sm">
            <Text 
              className="text-xl font-bold text-surface-900 dark:text-surface-100 text-center mb-4"
              accessibilityRole="header"
            >
              Edit Display Name
            </Text>
            
            <TextInput
              className="border-2 border-surface-200 dark:border-surface-600 rounded-xl px-4 py-3 text-lg text-surface-900 dark:text-surface-100 mb-4"
              value={editingName}
              onChangeText={setEditingName}
              placeholder="Enter your name"
              placeholderTextColor="#9ca3af"
              autoFocus
              accessibilityLabel="Display name input"
            />
            
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowNameModal(false)}
                className="flex-1 py-3 rounded-xl bg-surface-100 dark:bg-surface-700"
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text className="text-center font-semibold text-surface-700 dark:text-surface-300">
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleSaveName}
                className="flex-1 py-3 rounded-xl bg-primary-600"
                accessibilityRole="button"
                accessibilityLabel="Save name"
              >
                <Text className="text-center font-semibold text-white">
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Date Modal */}
      <Modal
        visible={showDateModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowDateModal(false)}
        accessibilityViewIsModal
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white dark:bg-surface-800 rounded-2xl p-6 w-full max-w-sm">
            <Text 
              className="text-xl font-bold text-surface-900 dark:text-surface-100 text-center mb-4"
              accessibilityRole="header"
            >
              Edit Sobriety Date
            </Text>
            
            <Text className="text-surface-500 text-center mb-4">
              This is the date you started your recovery journey.
            </Text>

            {Platform.OS === 'ios' ? (
              <DateTimePicker
                value={editingDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date()}
                style={{ height: 150 }}
              />
            ) : showDatePicker ? (
              <DateTimePicker
                value={editingDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            ) : (
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="border-2 border-surface-200 dark:border-surface-600 rounded-xl px-4 py-3 mb-4"
              >
                <Text className="text-lg text-center text-surface-900 dark:text-surface-100">
                  {editingDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            )}
            
            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                onPress={() => setShowDateModal(false)}
                className="flex-1 py-3 rounded-xl bg-surface-100 dark:bg-surface-700"
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text className="text-center font-semibold text-surface-700 dark:text-surface-300">
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleSaveDate}
                className="flex-1 py-3 rounded-xl bg-primary-600"
                accessibilityRole="button"
                accessibilityLabel="Save date"
              >
                <Text className="text-center font-semibold text-white">
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Program Modal */}
      <Modal
        visible={showProgramModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowProgramModal(false)}
        accessibilityViewIsModal
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white dark:bg-surface-800 rounded-2xl p-6 w-full max-w-sm">
            <Text 
              className="text-xl font-bold text-surface-900 dark:text-surface-100 text-center mb-4"
              accessibilityRole="header"
            >
              Select Program
            </Text>
            
            <View className="gap-2">
              {PROGRAM_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => handleSelectProgram(option.value)}
                  className={`py-4 px-4 rounded-xl ${
                    profile?.programType === option.value
                      ? 'bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500'
                      : 'bg-surface-100 dark:bg-surface-700'
                  }`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: profile?.programType === option.value }}
                >
                  <Text className={`text-center font-medium ${
                    profile?.programType === option.value
                      ? 'text-primary-700 dark:text-primary-300'
                      : 'text-surface-700 dark:text-surface-300'
                  }`}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity
              onPress={() => setShowProgramModal(false)}
              className="mt-4 py-3 rounded-xl bg-surface-100 dark:bg-surface-700"
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text className="text-center font-semibold text-surface-700 dark:text-surface-300">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent
        onRequestClose={() => !isDeleting && setShowDeleteModal(false)}
        accessibilityViewIsModal
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white dark:bg-surface-800 rounded-2xl p-6 w-full max-w-sm">
            <Text 
              className="text-xl font-bold text-surface-900 dark:text-surface-100 text-center mb-4"
              accessibilityRole="header"
            >
              ⚠️ Delete All Data
            </Text>
            
            <Text className="text-surface-600 dark:text-surface-400 text-center mb-4">
              This will permanently delete all your:
            </Text>
            
            <View className="mb-4">
              <Text className="text-surface-700 dark:text-surface-300 text-center">
                • Journal entries{'\n'}
                • Daily check-ins{'\n'}
                • Progress & milestones{'\n'}
                • Meeting logs{'\n'}
                • Motivation vault{'\n'}
                • Time capsules{'\n'}
                • All settings
              </Text>
            </View>
            
            <Text className="text-red-600 font-semibold text-center mb-4">
              This action cannot be undone!
            </Text>
            
            <Text className="text-surface-500 text-center text-sm mb-2">
              Type DELETE to confirm:
            </Text>
            
            <TextInput
              className="border-2 border-surface-200 dark:border-surface-600 rounded-xl px-4 py-3 text-center text-lg font-mono text-surface-900 dark:text-surface-100 mb-4"
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="Type DELETE"
              placeholderTextColor="#9ca3af"
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isDeleting}
              accessibilityLabel="Confirmation text input"
              accessibilityHint="Type DELETE in all caps to confirm deletion"
            />
            
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-surface-100 dark:bg-surface-700"
                accessibilityRole="button"
                accessibilityLabel="Cancel deletion"
              >
                <Text className="text-center font-semibold text-surface-700 dark:text-surface-300">
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleConfirmDelete}
                disabled={isDeleting || deleteConfirmText !== 'DELETE'}
                className={`flex-1 py-3 rounded-xl ${
                  deleteConfirmText === 'DELETE' && !isDeleting
                    ? 'bg-red-600'
                    : 'bg-red-300'
                }`}
                accessibilityRole="button"
                accessibilityLabel="Confirm delete all data"
                accessibilityState={{ disabled: isDeleting || deleteConfirmText !== 'DELETE' }}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-center font-semibold text-white">
                    Delete All
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
