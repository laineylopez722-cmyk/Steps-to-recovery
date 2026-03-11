/**
 * MindfulnessLibraryScreen
 *
 * Categorized library of guided meditations and breathing exercises.
 * All content is offline-first — bundled with the app.
 * Accessible from Home quick actions, Emergency toolkit, and Craving Surf.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useDs } from '../../../design-system/DsProvider';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import {
  MEDITATIONS,
  CATEGORY_META,
  getEmergencyMeditations,
  formatDuration,
  type MeditationCategory,
  type Meditation,
} from '../data/meditations';
import type { HomeStackScreenProps } from '../../../navigation/types';

type Props = HomeStackScreenProps<'MindfulnessLibrary'>;

const ALL_CATEGORIES: MeditationCategory[] = [
  'breathing',
  'urge_surfing',
  'gratitude',
  'sleep',
  'affirmation',
];

function MeditationCard({
  item,
  onPress,
}: {
  item: Meditation;
  onPress: () => void;
}): React.ReactElement {
  const ds = useDs();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessibilityLabel={`${item.title}, ${formatDuration(item.durationSeconds)}`}
      accessibilityRole="button"
      accessibilityHint="Double tap to start this meditation"
    >
      <Text style={styles.cardIcon} accessibilityElementsHidden importantForAccessibility="no">
        {item.icon}
      </Text>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
      <View style={styles.cardMeta}>
        <Text style={styles.cardDuration}>{formatDuration(item.durationSeconds)}</Text>
        <Feather
          name="play-circle"
          size={22}
          color={ds.semantic.intent.primary.solid}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </View>
    </Pressable>
  );
}

export function MindfulnessLibraryScreen({ navigation }: Props): React.ReactElement {
  const insets = useSafeAreaInsets();
  const ds = useDs();
  const styles = useThemedStyles(createStyles);
  const [activeCategory, setActiveCategory] = useState<MeditationCategory | 'emergency'>(
    'breathing',
  );

  const displayedItems =
    activeCategory === 'emergency'
      ? getEmergencyMeditations()
      : MEDITATIONS.filter((m) => m.category === activeCategory);

  const navigateToPlayer = (meditationId: string): void => {
    navigation.navigate('MeditationPlayer', { meditationId });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={22} color={ds.semantic.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Mindfulness</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Offline-first. No account needed. Available anytime.
      </Text>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
        accessibilityRole="tablist"
      >
        {/* Emergency tab first */}
        <Pressable
          style={[
            styles.filterChip,
            activeCategory === 'emergency' && {
              backgroundColor: ds.semantic.intent.alert.solid,
              borderColor: ds.semantic.intent.alert.solid,
            },
          ]}
          onPress={() => setActiveCategory('emergency')}
          accessibilityRole="tab"
          accessibilityLabel="Crisis & Emergency meditations"
          accessibilityState={{ selected: activeCategory === 'emergency' }}
        >
          <Text
            style={[
              styles.filterChipText,
              activeCategory === 'emergency' && { color: '#fff' },
            ]}
          >
            🆘 Crisis
          </Text>
        </Pressable>

        {ALL_CATEGORIES.map((cat) => {
          const meta = CATEGORY_META[cat];
          const isActive = activeCategory === cat;
          return (
            <Pressable
              key={cat}
              style={[
                styles.filterChip,
                isActive && {
                  backgroundColor: ds.semantic.intent.primary.solid,
                  borderColor: ds.semantic.intent.primary.solid,
                },
              ]}
              onPress={() => setActiveCategory(cat)}
              accessibilityRole="tab"
              accessibilityLabel={`${meta.label} meditations`}
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.filterChipText, isActive && { color: '#fff' }]}>
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Category description */}
      <Text style={styles.categoryDesc}>
        {activeCategory === 'emergency'
          ? 'Quick tools for crisis moments — start immediately.'
          : CATEGORY_META[activeCategory].description}
      </Text>

      {/* Meditation list */}
      <FlatList
        data={displayedItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        renderItem={({ item }) => (
          <MeditationCard item={item} onPress={() => navigateToPlayer(item.id)} />
        )}
        showsVerticalScrollIndicator={false}
        accessibilityLabel="Meditation list"
      />
    </View>
  );
}

const createStyles = (ds: DS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ds.semantic.surface.app,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: ds.space[4],
      paddingVertical: ds.space[3],
      borderBottomWidth: 1,
      borderBottomColor: ds.colors.borderDefault,
    },
    backBtn: {
      width: 40,
      height: 40,
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      ...ds.typography.h2,
      color: ds.semantic.text.primary,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 40,
    },
    subtitle: {
      ...ds.typography.caption,
      color: ds.semantic.text.tertiary,
      textAlign: 'center',
      paddingHorizontal: ds.space[4],
      paddingTop: ds.space[2],
      paddingBottom: ds.space[1],
    },
    filterScroll: {
      flexGrow: 0,
      marginTop: ds.space[3],
    },
    filterContent: {
      paddingHorizontal: ds.space[4],
      gap: ds.space[2],
    },
    filterChip: {
      paddingHorizontal: ds.space[3],
      paddingVertical: ds.space[2],
      borderRadius: ds.radius.full,
      borderWidth: 1,
      borderColor: ds.colors.borderDefault,
      backgroundColor: ds.semantic.surface.card,
    },
    filterChipText: {
      ...ds.typography.caption,
      color: ds.semantic.text.secondary,
      fontWeight: '500',
    },
    categoryDesc: {
      ...ds.typography.caption,
      color: ds.semantic.text.tertiary,
      paddingHorizontal: ds.space[4],
      paddingTop: ds.space[2],
      paddingBottom: ds.space[1],
    },
    listContent: {
      paddingHorizontal: ds.space[4],
      paddingTop: ds.space[3],
      gap: ds.space[3],
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: ds.semantic.surface.card,
      borderRadius: ds.radius.lg,
      borderWidth: 1,
      borderColor: ds.colors.borderDefault,
      padding: ds.space[4],
      gap: ds.space[3],
    },
    cardIcon: {
      fontSize: 32,
      width: 44,
      textAlign: 'center',
    },
    cardBody: {
      flex: 1,
    },
    cardTitle: {
      ...ds.typography.h3,
      color: ds.semantic.text.primary,
      fontWeight: '600',
      marginBottom: ds.space[1],
    },
    cardDesc: {
      ...ds.typography.caption,
      color: ds.semantic.text.secondary,
      lineHeight: 18,
    },
    cardMeta: {
      alignItems: 'center',
      gap: ds.space[1],
    },
    cardDuration: {
      ...ds.typography.micro,
      color: ds.semantic.text.tertiary,
    },
  });
