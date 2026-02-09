import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Skeleton, useTheme } from '../../../design-system';
import { ds } from '../../../design-system/tokens/ds';

export function StepDetailLoadingState(): React.ReactElement {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <View style={styles.loadingSkeletonContainer}>
        <Card variant="elevated" style={styles.headerCard}>
          <View style={styles.header}>
            <Skeleton width={50} height={50} borderRadius={25} />
            <View style={[styles.headerContent, { gap: 8 }]}> 
              <Skeleton width="80%" height={20} />
              <Skeleton width="50%" height={14} />
            </View>
          </View>
          <View style={styles.progressSection}>
            <Skeleton width="100%" height={8} borderRadius={4} />
          </View>
        </Card>

        <Card variant="outlined" style={styles.descriptionCard}>
          <Skeleton width="40%" height={12} />
          <View style={{ height: 8 }} />
          <Skeleton width="100%" height={14} />
          <View style={{ height: 4 }} />
          <Skeleton width="90%" height={14} />
        </Card>

        <View style={{ padding: 16, gap: 16 }}>
          <Skeleton width="100%" height={100} borderRadius={8} />
          <Skeleton width="100%" height={100} borderRadius={8} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingSkeletonContainer: {
    flex: 1,
  },
  headerCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  progressSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: ds.colors.borderSubtle,
  },
  descriptionCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderColor: ds.colors.borderSubtle,
  },
});
