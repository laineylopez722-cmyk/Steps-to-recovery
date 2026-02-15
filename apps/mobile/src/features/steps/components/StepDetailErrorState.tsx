import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Text, useDs } from '../../../design-system';

export function StepDetailErrorState(): React.ReactElement {
  const ds = useDs();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: ds.semantic.surface.app }]}>
      <View style={styles.errorContainer} accessible accessibilityRole="alert" accessibilityLabel="Step not found">
        <MaterialIcons name="error-outline" size={48} color={ds.semantic.intent.alert.solid} importantForAccessibility="no" />
        <Text style={[ds.typography.h2, { color: ds.semantic.text.primary, marginTop: 16 }]}>
          Step not found
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
});
