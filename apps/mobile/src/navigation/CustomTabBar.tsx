import React, { useCallback } from 'react';
import { View, Pressable, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useDs } from '../design-system/DsProvider';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TAB_CONFIG: Record<string, { label: string; icon: string; iconFocused: string }> = {
  Home: { label: 'Home', icon: 'home-outline', iconFocused: 'home' },
  Journal: { label: 'Journal', icon: 'journal-outline', iconFocused: 'journal' },
  Steps: { label: 'Steps', icon: 'footsteps-outline', iconFocused: 'footsteps' },
  Meetings: { label: 'Meetings', icon: 'location-outline', iconFocused: 'location' },
  Profile: { label: 'Profile', icon: 'person-outline', iconFocused: 'person' },
};

function TabItem({
  routeName,
  isFocused,
  onPress,
  onLongPress,
  accessibilityLabel,
}: {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel?: string;
}) {
  const ds = useDs();
  const config = TAB_CONFIG[routeName] ?? { label: routeName, icon: 'ellipse-outline', iconFocused: 'ellipse' };

  const scale = useSharedValue(1);
  const pillWidth = useSharedValue(isFocused ? 56 : 0);
  const pillOpacity = useSharedValue(isFocused ? 1 : 0);

  React.useEffect(() => {
    pillWidth.value = withSpring(isFocused ? 56 : 0, { damping: 15, stiffness: 200 });
    pillOpacity.value = withTiming(isFocused ? 1 : 0, { duration: 150 });
  }, [isFocused, pillWidth, pillOpacity]);

  const pillStyle = useAnimatedStyle(() => ({
    width: pillWidth.value,
    opacity: pillOpacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.85, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const iconColor = isFocused
    ? ds.semantic.intent.primary.solid
    : ds.semantic.text.muted;
  const labelColor = isFocused
    ? ds.semantic.intent.primary.solid
    : ds.semantic.text.muted;

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={accessibilityLabel}
      style={styles.tabItem}
    >
      <View style={styles.iconContainer}>
        <Animated.View
          style={[
            styles.pill,
            { backgroundColor: ds.semantic.intent.primary.muted },
            pillStyle,
          ]}
        />
        <Animated.View style={iconStyle}>
          <Ionicons
            name={(isFocused ? config.iconFocused : config.icon) as keyof typeof Ionicons.glyphMap}
            size={22}
            color={iconColor}
          />
        </Animated.View>
      </View>
      <Text
        style={[
          styles.label,
          {
            color: labelColor,
            fontWeight: isFocused ? '600' : '400',
          },
        ]}
        numberOfLines={1}
      >
        {config.label}
      </Text>
    </Pressable>
  );
}

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const ds = useDs();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: ds.semantic.surface.elevated,
          borderTopColor: ds.semantic.surface.overlay,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabItem
            key={route.key}
            routeName={route.name}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityLabel={options.tabBarAccessibilityLabel}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconContainer: {
    width: 56,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    height: 32,
    borderRadius: 16,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.2,
    lineHeight: 12,
  },
});
