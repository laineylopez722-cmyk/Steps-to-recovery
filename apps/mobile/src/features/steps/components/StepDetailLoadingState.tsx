import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Skeleton, useDs } from '../../../design-system';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';

export function StepDetailLoadingState(): React.ReactElement {
  const ds = useDs();
  const styles = useThemedStyles(createStyles);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: ds.semantic.surface.app }]}
      edges={['bottom']}
    >
      <View style={styles.loadingSkeletonContainer} accessible accessibilityLabel="Loading step details" accessibilityRole="progressbar">
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

const createStyles = (ds: DS) =>
  ({
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
  }) as const;
