/**
 * AddRiskyContactModal Component
 *
 * Modal for adding a new risky contact to the danger zone
 */

import { useState, type ReactElement } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, useTheme } from '../../../design-system';
import { hapticSelection, hapticSuccess, hapticWarning } from '../../../utils/haptics';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import type { RelationshipType } from '../hooks';

interface AddRiskyContactModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (contact: {
    name: string;
    phoneNumber: string;
    relationshipType: RelationshipType;
    notes?: string;
  }) => Promise<void>;
}

const RELATIONSHIP_OPTIONS: Array<{
  value: RelationshipType;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  description: string;
}> = [
  {
    value: 'dealer',
    label: 'Dealer',
    icon: 'pill',
    description: 'Someone who sells substances',
  },
  {
    value: 'old_friend',
    label: 'Old Using Friend',
    icon: 'account-group',
    description: 'Friend from active addiction days',
  },
  {
    value: 'trigger_person',
    label: 'Trigger Person',
    icon: 'alert-circle',
    description: 'Someone who triggers cravings or stress',
  },
  {
    value: 'other',
    label: 'Other',
    icon: 'account-alert',
    description: 'Another risky contact',
  },
];

export function AddRiskyContactModal({
  visible,
  onClose,
  onAdd,
      }: AddRiskyContactModalProps): ReactElement {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('dealer');
  const [notes, setNotes] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const resetForm = (): void => {
    setName('' as string);
        setPhoneNumber('' as string);
    setRelationshipType('other');
      setNotes(undefined);
  };

  const handleClose = (): void => {
    if (name || phoneNumber || notes) {
      hapticWarning();
      Alert.alert('Discard Changes?', 'You have unsaved changes. Are you sure you want to close?', [
        { text: 'Keep Editing', style: 'cancel', onPress: () => hapticSelection() },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            resetForm();
            onClose();
          },
        },
      ]);
    } else {
      onClose();
    }
  };

  const validateForm = (): string | null => {
    if (!name.trim()) return 'Please enter a name';
    if (!phoneNumber.trim()) return 'Please enter a phone number';

    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length < 10) return 'Please enter a valid phone number';

    return null;
  };

  const handleSubmit = async (): Promise<void> => {
    const error = validateForm();
    if (error) {
      hapticWarning();
      Alert.alert('Incomplete Form', error);
      return;
    }

    hapticWarning();
    Alert.alert(
      'Add to Danger Zone?',
      `Are you sure you want protection from "${name.trim()}"?\n\nWhen you try to call this contact, we'll intervene and offer healthier alternatives.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => hapticSelection(),
        },
        {
          text: 'Add Protection',
          style: 'default',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              await onAdd({
                name: name.trim(),
                phoneNumber: phoneNumber.trim(),
                relationshipType,
                notes: notes?.trim() || undefined,
              });

              hapticSuccess();
              resetForm();
              onClose();
            } catch (err) {
              hapticWarning();
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add contact');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ],
    );
  };

  const formatPhoneNumber = (text: string): string => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;

    if (cleaned.length >= 10) {
      formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    } else if (cleaned.length >= 6) {
      formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length >= 3) {
      formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    }

    return formatted;
  };

  const handlePhoneChange = (text: string): void => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Pressable
            onPress={handleClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close"
            disabled={isSubmitting}
          >
            <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
          </Pressable>
          <Text
            style={[
              theme.typography.h2,
              { color: theme.colors.text, flex: 1, textAlign: 'center', marginRight: 40 },
            ]}
          >
            Add Protection
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Introduction */}
          <Card
            variant="outlined"
            style={[styles.introCard, { backgroundColor: theme.colors.primary + '15' }]}
          >
            <MaterialCommunityIcons
              name="shield-check"
              size={32}
              color={theme.colors.primary}
              style={{ marginBottom: 8 }}
            />
            <Text
              style={[theme.typography.body, { color: theme.colors.text, textAlign: 'center' }]}
            >
              Add contacts you want protection from. When you try to call them, we'll help you make
              healthier choices.
            </Text>
          </Card>

          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text
              style={[theme.typography.labelLarge, { color: theme.colors.text, marginBottom: 8 }]}
            >
              What should we call this contact? *
            </Text>
            <TextInput
              value={name as string}
              onChangeText={setName as (text: string) => void     }
              placeholder="e.g., My Dealer, Old Friend"
              placeholderTextColor={theme.colors.textSecondary}
              style={[
                styles.input,
                theme.typography.body,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              accessibilityLabel="Contact name"
              autoCapitalize="words"
              editable={!isSubmitting}
            />
          </View>

          {/* Phone Number Input */}
          <View style={styles.inputGroup}>
            <Text
              style={[theme.typography.labelLarge, { color: theme.colors.text, marginBottom: 8 }]}
            >
              Phone Number *
            </Text>
            <TextInput
              value={phoneNumber as string}
              onChangeText={handlePhoneChange as (text: string) => void}
              placeholder="(555) 123-4567"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
              style={[
                styles.input,
                theme.typography.body,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              accessibilityLabel="Phone number"
              maxLength={14}
              editable={!isSubmitting}
            />
          </View>

          {/* Relationship Type Picker */}
          <View style={styles.inputGroup}>
            <Text
              style={[theme.typography.labelLarge, { color: theme.colors.text, marginBottom: 8 }]}
            >
              Relationship Type *
            </Text>
            <View style={styles.relationshipGrid}>
              {RELATIONSHIP_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    hapticSelection();
                    setRelationshipType(option.value);
                  }}
                  style={[
                    styles.relationshipOption,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor:
                        relationshipType === option.value
                          ? theme.colors.primary
                          : theme.colors.border,
                      borderWidth: relationshipType === option.value ? 2 : 1,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: relationshipType === option.value }}
                  accessibilityLabel={option.label}
                  disabled={isSubmitting}
                >
                  <MaterialCommunityIcons
                    name={option.icon}
                    size={32}
                    color={
                      relationshipType === option.value
                        ? theme.colors.primary
                        : theme.colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      theme.typography.labelLarge,
                      {
                        color:
                          relationshipType === option.value
                            ? theme.colors.primary
                            : theme.colors.text,
                        marginTop: 8,
                        textAlign: 'center',
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      theme.typography.caption,
                      {
                        color: theme.colors.textSecondary,
                        marginTop: 4,
                        textAlign: 'center',
                      },
                    ]}
                  >
                    {option.description}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Notes Input */}
          <View style={styles.inputGroup}>
            <Text
              style={[theme.typography.labelLarge, { color: theme.colors.text, marginBottom: 8 }]}
            >
              Why is this contact risky? (Optional)
            </Text>
            <TextInput
              value={notes as string | undefined}
              onChangeText={setNotes as (text: string | undefined) => void}
              placeholder="e.g., Always calls when I'm vulnerable..."
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={4}
              style={[
                styles.input,
                styles.textArea,
                theme.typography.body,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              accessibilityLabel="Notes"
              textAlignVertical="top"
              editable={!isSubmitting}
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View
          style={[
            styles.footer,
            { borderTopColor: theme.colors.border, backgroundColor: theme.colors.background },
          ]}
        >
          <Button
            title={isSubmitting ? 'Adding...' : 'Add to Danger Zone'}
            onPress={handleSubmit}
            variant="primary"
            size="large"
            fullWidth
            disabled={isSubmitting}
            icon={<MaterialCommunityIcons name="shield-plus" size={20} color={ds.semantic.text.onDark} />}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (ds: DS) => ({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
    position: 'absolute',
    left: 8,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  introCard: {
    alignItems: 'center',
    padding: 16,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  relationshipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  relationshipOption: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
} as const);
