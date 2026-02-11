import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, useTheme } from '../../../design-system';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';

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
  const styles = useThemedStyles(createStyles);
  const ds = useDs();

  return (
    <Pressable
      style={styles.sectionHeader}
      onPress={() => onJumpToQuestion(sectionStart)}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${questionRange}. Tap to jump to section.`}
    >
      <MaterialCommunityIcons
        name="bookmark-outline"
        size={20}
        color={ds.colors.accent}
        accessible={false}
      />
      <View style={styles.sectionHeaderContent}>
        <Text style={[theme.typography.h3, { color: ds.colors.textPrimary, fontWeight: '600' }]}>
          {title}
        </Text>
        <Text style={[theme.typography.caption, { color: ds.colors.textTertiary }]}> 
          {questionRange} • tap to jump
        </Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={18}
        color={ds.colors.textQuaternary}
        accessible={false}
      />
    </Pressable>
  );
}

const createStyles = (ds: DS) => ({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ds.colors.borderSubtle,
    backgroundColor: ds.colors.bgSecondary,
  },
  sectionHeaderContent: {
    marginLeft: 12,
    flex: 1,
  },
} as const);
