/**
 * Profile Screen
 *
 * Apple Settings-inspired design.
 * Clean groups, no visible borders.
 */

import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useAuth } from '../../../contexts/AuthContext';
import { Modal } from '../../../design-system';
import { MotionTransitions } from '../../../design-system/tokens/motion';
import { useMotionPress } from '../../../design-system/hooks/useMotionPress';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import type { ProfileStackParamList, MainTabParamList } from '../../../navigation/types';

type ProfileScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList>,
  NativeStackNavigationProp<MainTabParamList>
>;

// Animated List Item
function ListItem({
  icon,
  title,
  subtitle,
  onPress,
  disabled,
  iconColor,
  isLast,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  disabled?: boolean;
  iconColor?: string;
  isLast?: boolean;
}) {
  const { onPressIn, onPressOut, animatedStyle } = useMotionPress();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();

  const handlePress = () => {
    if (onPress && !disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onPress();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle || undefined}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Animated.View style={[styles.listItem, disabled && styles.listItemDisabled, animatedStyle]}>
        <View
          style={[
            styles.listItemIcon,
            { backgroundColor: iconColor ? `${iconColor}20` : ds.semantic.intent.primary.muted },
          ]}
        >
          <Feather name={icon} size={20} color={iconColor || ds.semantic.intent.primary.solid} />
        </View>

        <View style={styles.listItemContent}>
          <Text style={styles.listItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.listItemSubtitle}>{subtitle}</Text>}
        </View>

        {!disabled && <Feather name="chevron-right" size={18} color={ds.semantic.text.muted} />}
      </Animated.View>

      {!isLast && <View style={styles.listItemDivider} />}
    </Pressable>
  );
}

// Section Header
function SectionHeader({ title, delay = 0 }: { title: string; delay?: number }) {
  const styles = useThemedStyles(createStyles);
  return (
    <Animated.View entering={MotionTransitions.fadeDelayed(delay)}>
      <Text style={styles.sectionHeader}>{title}</Text>
    </Animated.View>
  );
}

// Card Group
function CardGroup({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const styles = useThemedStyles(createStyles);
  return (
    <Animated.View
      entering={MotionTransitions.cardEnter(Math.floor(delay / 50))}
      style={styles.cardGroup}
    >
      {children}
    </Animated.View>
  );
}

export function ProfileScreen(): React.ReactElement {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, signOut, loading: _loading } = useAuth();
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const [_signingOut, setSigningOut] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    try {
      await signOut();
    } catch (_error) {
      // Error handled by auth context
    } finally {
      setSigningOut(false);
      setShowSignOutModal(false);
    }
  }, [signOut]);

  return (
    <>
      <View style={styles.container}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Animated.View entering={MotionTransitions.screenEnter()} style={styles.header}>
              <Text style={styles.title}>Settings</Text>
              <Text style={styles.subtitle}>Recovery profile, privacy, and app preferences</Text>
            </Animated.View>

            {/* Profile Card */}
            <CardGroup delay={100}>
              <View style={styles.profileCard}>
                <View style={styles.avatar}>
                  <Feather name="user" size={32} color={ds.semantic.intent.primary.solid} />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileEmail} numberOfLines={1}>
                    {user?.email || 'Loading...'}
                  </Text>
                  <Text style={styles.profileLabel}>Personal Account</Text>
                </View>
                <Feather name="chevron-right" size={18} color={ds.semantic.text.muted} />
              </View>
            </CardGroup>

            {/* Recovery Section */}
            <SectionHeader title="Recovery" delay={150} />
            <CardGroup delay={200}>
              <ListItem
                icon="users"
                title="Sponsor"
                subtitle="Connect with your sponsor"
                onPress={() => navigation.navigate('Sponsor')}
              />
              <ListItem
                icon="calendar"
                title="Meeting Stats"
                subtitle="Track your attendance"
                onPress={() => navigation.navigate('Home', { screen: 'MeetingStats' })}
              />
              <ListItem
                icon="award"
                title="Achievements"
                subtitle="View your milestones"
                onPress={() => navigation.navigate('Home', { screen: 'Achievements' })}
                isLast
              />
            </CardGroup>

            {/* App Section */}
            <SectionHeader title="App" delay={250} />
            <CardGroup delay={300}>
              <ListItem
                icon="message-circle"
                title="AI Companion"
                subtitle="Configure your companion"
                onPress={() => navigation.navigate('AISettings')}
              />
              <ListItem
                icon="bell"
                title="Notifications"
                subtitle="Manage alerts"
                onPress={() => navigation.navigate('NotificationSettings')}
              />
              <ListItem
                icon="shield"
                title="Privacy & Security"
                subtitle="Biometrics and encryption"
                onPress={() => navigation.navigate('SecuritySettings')}
              />
              <ListItem
                icon="smartphone"
                title="Home Screen Widget"
                subtitle="Recovery progress at a glance"
                onPress={() => navigation.navigate('WidgetSettings')}
                isLast
              />
            </CardGroup>

            {/* Legal Section */}
            <SectionHeader title="Legal" delay={250} />
            <CardGroup delay={300}>
              <ListItem
                icon="file-text"
                title="Privacy Policy"
                subtitle="How we protect your data"
                onPress={() => navigation.navigate('PrivacyPolicy')}
              />
              <ListItem
                icon="book-open"
                title="Terms of Service"
                subtitle="Usage terms and conditions"
                onPress={() => navigation.navigate('TermsOfService')}
                isLast
              />
            </CardGroup>

            {/* Privacy Banner */}
            <Animated.View entering={MotionTransitions.cardEnter(5)} style={styles.privacyBanner}>
              <View style={styles.privacyIcon}>
                <Feather name="lock" size={20} color={ds.semantic.intent.secondary.solid} />
              </View>
              <View style={styles.privacyContent}>
                <Text style={styles.privacyTitle}>End-to-End Encrypted</Text>
                <Text style={styles.privacyText}>
                  Your journal and step work are encrypted with AES-256. Only you can read them.
                </Text>
              </View>
            </Animated.View>

            {/* Sign Out */}
            <Animated.View entering={MotionTransitions.cardEnter(6)}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                  setShowSignOutModal(true);
                }}
                style={({ pressed }) => [
                  styles.signOutButton,
                  pressed && styles.signOutButtonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Sign out"
                accessibilityHint="Opens confirmation dialog to sign out of your account"
              >
                <Text style={styles.signOutText}>Sign Out</Text>
              </Pressable>
            </Animated.View>

            {/* Footer */}
            <Text style={styles.footer}>Made with care for the recovery community</Text>

            <View style={{ height: ds.space[20] }} />
          </ScrollView>
        </SafeAreaView>
      </View>

      {/* Sign Out Modal */}
      <Modal
        visible={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        variant="center"
        actions={[
          {
            title: 'Cancel',
            onPress: () => {},
            variant: 'outline',
          },
          {
            title: 'Sign Out',
            onPress: handleSignOut,
            variant: 'danger',
          },
        ]}
        dismissable
      />
    </>
  );
}

const createStyles = (ds: DS) =>
  ({
    container: {
      flex: 1,
      backgroundColor: ds.semantic.surface.app,
    },
    safe: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: ds.semantic.layout.screenPadding,
    },

    // Header
    header: {
      paddingTop: ds.space[6],
      paddingBottom: ds.space[4],
    },
    title: {
      fontSize: 34,
      fontWeight: '700',
      color: ds.semantic.text.primary,
      letterSpacing: -0.5,
    },
    subtitle: {
      ...ds.typography.caption,
      color: ds.semantic.text.tertiary,
      marginTop: ds.space[1],
    },

    // Profile Card
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: ds.space[4],
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: ds.semantic.intent.primary.muted,
      justifyContent: 'center',
      alignItems: 'center',
    },
    profileInfo: {
      flex: 1,
      marginLeft: ds.space[4],
    },
    profileEmail: {
      ...ds.typography.body,
      fontWeight: '600',
      color: ds.semantic.text.primary,
    },
    profileLabel: {
      ...ds.typography.caption,
      color: ds.semantic.text.tertiary,
      marginTop: 2,
    },

    // Section Header
    sectionHeader: {
      ...ds.typography.caption,
      color: ds.semantic.text.tertiary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginTop: ds.space[6],
      marginBottom: ds.space[2],
      marginLeft: ds.space[1],
    },

    // Card Group
    cardGroup: {
      backgroundColor: ds.semantic.surface.card,
      borderRadius: ds.radius.lg,
      overflow: 'hidden',
    },

    // List Item
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: ds.space[4],
      paddingHorizontal: ds.space[4],
    },
    listItemDisabled: {
      opacity: 0.5,
    },
    listItemIcon: {
      width: 36,
      height: 36,
      borderRadius: ds.radius.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listItemContent: {
      flex: 1,
      marginLeft: ds.space[3],
    },
    listItemTitle: {
      ...ds.typography.body,
      color: ds.semantic.text.primary,
    },
    listItemSubtitle: {
      ...ds.typography.caption,
      color: ds.semantic.text.tertiary,
      marginTop: 1,
    },
    listItemDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: ds.colors.divider,
      marginLeft: 36 + ds.space[4] + ds.space[3],
    },

    // Privacy Banner
    privacyBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: ds.semantic.intent.secondary.muted,
      borderRadius: ds.radius.lg,
      padding: ds.space[4],
      marginTop: ds.space[6],
    },
    privacyIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: ds.semantic.intent.secondary.subtle,
      justifyContent: 'center',
      alignItems: 'center',
    },
    privacyContent: {
      flex: 1,
      marginLeft: ds.space[3],
    },
    privacyTitle: {
      ...ds.typography.body,
      fontWeight: '600',
      color: ds.semantic.intent.secondary.solid,
    },
    privacyText: {
      ...ds.typography.caption,
      color: ds.semantic.text.secondary,
      marginTop: ds.space[1],
      lineHeight: 18,
    },

    // Sign Out
    signOutButton: {
      backgroundColor: ds.semantic.surface.card,
      borderRadius: ds.radius.lg,
      paddingVertical: ds.space[4],
      marginTop: ds.space[6],
      alignItems: 'center',
    },
    signOutButtonPressed: {
      backgroundColor: ds.semantic.surface.interactive,
    },
    signOutText: {
      ...ds.typography.body,
      color: ds.semantic.intent.alert.solid,
      fontWeight: '500',
    },

    // Footer
    footer: {
      ...ds.typography.caption,
      color: ds.semantic.text.muted,
      textAlign: 'center',
      marginTop: ds.space[6],
    },
  }) as const;
