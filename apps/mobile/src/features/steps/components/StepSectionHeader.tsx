import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, useTheme } from '../../../design-system';

interface StepSectionHeaderProps {
  title: string;
  questionRange: string;
  sectionStart: number;
  onJumpToQuestion: (questionNumber: number) => void;
}

export function StepSectionHeader({
  title,
  questionRange,
  sectionStart,
  onJumpToQuestion,
}: StepSectionHeaderProps): React.ReactElement {
  const theme = useTheme();

  return (
    <Pressable
      style={[styles.sectionHeader, { backgroundColor: theme.colors.primary + '10' }]}
      onPress={() => onJumpToQuestion(sectionStart)}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${questionRange}. Tap to jump to section.`}
    >
      <MaterialCommunityIcons
        name="bookmark-outline"
        size={20}
        color={theme.colors.primary}
        accessible={false}
      />
      <View style={styles.sectionHeaderContent}>
        <Text style={[theme.typography.h3, { color: theme.colors.primary, fontWeight: '600' }]}>
          {title}
        </Text>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}> 
          {questionRange} • tap to jump
        </Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={18}
        color={theme.colors.textSecondary}
        accessible={false}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
  },
  sectionHeaderContent: {
    marginLeft: 12,
    flex: 1,
  },
});
