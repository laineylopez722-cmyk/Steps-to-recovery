import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Slider } from '../../../components/Slider';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  useCreateJournalEntry,
  useUpdateJournalEntry,
  useJournalEntries,
} from '../hooks/useJournalEntries';
import {
  useTheme,
  Input,
  Button,
  Badge,
  TextArea,
  Toast,
  Card,
  Divider,
} from '../../../design-system';

const MOOD_LABELS: Record<number, string> = {
  1: 'Very Sad',
  2: 'Sad',
  3: 'Neutral',
  4: 'Good',
  5: 'Great',
};

const MOOD_EMOJI: Record<number, string> = {
  1: '😢',
  2: '😔',
  3: '😐',
  4: '🙂',
  5: '😊',
};

interface JournalEditorScreenProps {
  userId: string;
}

export function JournalEditorScreen({ userId }: JournalEditorScreenProps): React.ReactElement {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as { mode?: 'create' | 'edit'; entryId?: string } | undefined;

  const { entries } = useJournalEntries(userId);
  const { createEntry, isPending: isCreating } = useCreateJournalEntry(userId);
  const { updateEntry, isPending: isUpdating } = useUpdateJournalEntry(userId);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mood, setMood] = useState<number | null>(3);
  const [craving, setCraving] = useState<number | null>(0);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'error' | 'info' | 'warning'>(
    'success',
  );

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const isEditMode = params?.mode === 'edit';
  const entryId = params?.entryId;

  useEffect(() => {
    if (isEditMode && entryId) {
      const entry = entries.find((e) => e.id === entryId);
      if (entry) {
        setTitle(entry.title || '');
        setBody(entry.body);
        setMood(entry.mood);
        setCraving(entry.craving);
        setTags(entry.tags);
      }
    }
  }, [isEditMode, entryId, entries]);

  const handleAddTag = (): void => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string): void => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = async (): Promise<void> => {
    if (!body.trim()) return;

    try {
      if (isEditMode && entryId) {
        await updateEntry(entryId, {
          title: title.trim() || null,
          body: body.trim(),
          mood,
          craving,
          tags,
        });
      } else {
        await createEntry({ title: title.trim() || null, body: body.trim(), mood, craving, tags });
      }

      // Success feedback
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setToastMessage(isEditMode ? 'Entry updated successfully' : 'Entry saved successfully');
      setToastVariant('success');
      setShowToast(true);

      // Navigate back after short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    } catch (_err) {
      setToastMessage('Failed to save entry. Please try again.');
      setToastVariant('error');
      setShowToast(true);
    }
  };

  const isPending = isCreating || isUpdating;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <Toast
        visible={showToast}
        message={toastMessage}
        variant={toastVariant}
        onDismiss={() => setShowToast(false)}
      />

      <Animated.ScrollView
        style={[
          styles.scrollView,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
        contentContainerStyle={styles.contentContainer}
      >
        <Card variant="elevated" style={styles.headerCard}>
          <View style={styles.headerContent}>
            <MaterialIcons name="lock" size={20} color={theme.colors.success} accessible={false} />
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, marginLeft: 8 },
              ]}
            >
              Your entry is encrypted and private
            </Text>
          </View>
        </Card>

        <Input
          label="Title (optional)"
          value={title}
          onChangeText={setTitle}
          placeholder="Give your entry a title"
          containerStyle={styles.inputContainer}
          maxLength={100}
          accessibilityLabel="Journal entry title"
          accessibilityHint="Optional title for your journal entry"
        />

        <TextArea
          label="Write your thoughts..."
          value={body}
          onChangeText={setBody}
          placeholder="Share your thoughts, feelings, and progress on your recovery journey. Remember, this is a safe space for you."
          containerStyle={styles.textAreaContainer}
          minHeight={200}
          maxLength={5000}
          showCharacterCount
          accessibilityLabel="Journal entry content"
          accessibilityHint="Write your thoughts and feelings for this journal entry"
        />

        <View style={styles.section}>
          <Text
            style={[
              theme.typography.h3,
              { marginBottom: 12, fontWeight: '600', color: theme.colors.text },
            ]}
            accessibilityRole="header"
          >
            How are you feeling? {mood !== null && MOOD_EMOJI[mood]}
          </Text>
          <View style={styles.sliderContainer}>
            <Slider
              value={mood || 3}
              onValueChange={setMood}
              minimumValue={1}
              maximumValue={5}
              step={1}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor={theme.colors.border}
              accessibilityLabel={`Mood: ${mood !== null ? MOOD_LABELS[mood] : 'Not set'}`}
              accessibilityRole="adjustable"
              accessibilityHint="Slide to adjust your mood from 1 to 5"
            />
            <Text
              style={[
                theme.typography.caption,
                { textAlign: 'center', marginTop: 8, color: theme.colors.textSecondary },
              ]}
            >
              {mood !== null ? MOOD_LABELS[mood] : 'Not set'}
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Text
            style={[
              theme.typography.h3,
              { marginBottom: 12, fontWeight: '600', color: theme.colors.text },
            ]}
            accessibilityRole="header"
          >
            Craving level (0-10)
          </Text>
          <View style={styles.sliderContainer}>
            <Slider
              value={craving || 0}
              onValueChange={setCraving}
              minimumValue={0}
              maximumValue={10}
              step={1}
              minimumTrackTintColor={
                craving && craving > 5 ? theme.colors.danger : theme.colors.success
              }
              maximumTrackTintColor={theme.colors.border}
              accessibilityLabel={`Craving level: ${craving || 0} out of 10`}
              accessibilityRole="adjustable"
              accessibilityHint="Slide to adjust your craving level from 0 to 10"
            />
            <Text
              style={[
                theme.typography.caption,
                { textAlign: 'center', marginTop: 8, color: theme.colors.textSecondary },
              ]}
            >
              {craving || 0}/10
            </Text>
          </View>
          {craving !== null && craving >= 7 && (
            <Card
              variant="outlined"
              style={[styles.warningCard, { borderColor: theme.colors.danger }]}
              accessibilityRole="alert"
              accessibilityLabel="High craving warning"
            >
              <View style={styles.warningContent}>
                <MaterialIcons
                  name="warning"
                  size={20}
                  color={theme.colors.danger}
                  accessible={false}
                />
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.danger, marginLeft: 8, flex: 1 },
                  ]}
                >
                  High craving detected. Consider reaching out to your sponsor or using emergency
                  tools.
                </Text>
              </View>
            </Card>
          )}
        </View>

        <View style={styles.section}>
          <Text
            style={[
              theme.typography.h3,
              { marginBottom: 12, fontWeight: '600', color: theme.colors.text },
            ]}
            accessibilityRole="header"
          >
            Tags
          </Text>
          <View style={styles.tagInputContainer}>
            <Input
              label=""
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={handleAddTag}
              placeholder="Add a tag"
              containerStyle={styles.tagInputField}
              accessibilityLabel="Tag input"
              accessibilityHint="Enter a tag and press add"
            />
            <Button
              title="Add"
              onPress={handleAddTag}
              variant="primary"
              size="medium"
              style={styles.addTagButton}
              accessibilityLabel="Add tag"
              accessibilityRole="button"
              accessibilityHint="Add the tag to this journal entry"
            />
          </View>
          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => (
              <View key={index} style={styles.tagWrapper}>
                <Badge variant="primary" size="medium">
                  {tag}
                </Badge>
                <TouchableOpacity
                  onPress={() => handleRemoveTag(tag)}
                  style={styles.removeTagButton}
                  accessibilityLabel={`Remove tag ${tag}`}
                  accessibilityRole="button"
                >
                  <MaterialIcons name="close" size={16} color={theme.colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </Animated.ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
        ]}
      >
        <Button
          title={isEditMode ? 'Update Entry' : 'Save Entry'}
          onPress={handleSave}
          disabled={!body.trim() || isPending}
          loading={isPending}
          variant="primary"
          fullWidth
          accessibilityLabel={isEditMode ? 'Update journal entry' : 'Save journal entry'}
          accessibilityRole="button"
          accessibilityHint={
            isEditMode ? 'Save changes to this journal entry' : 'Save this new journal entry'
          }
          accessibilityState={{ disabled: !body.trim() || isPending }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  headerCard: {
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  textAreaContainer: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 24,
  },
  section: {
    marginBottom: 24,
  },
  sliderContainer: {
    paddingHorizontal: 8,
  },
  warningCard: {
    marginTop: 12,
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInputContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
    alignItems: 'flex-start',
  },
  tagInputField: {
    flex: 1,
    marginBottom: 0,
  },
  addTagButton: {
    minWidth: 80,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  removeTagButton: {
    marginLeft: -8,
    marginTop: -8,
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
});
