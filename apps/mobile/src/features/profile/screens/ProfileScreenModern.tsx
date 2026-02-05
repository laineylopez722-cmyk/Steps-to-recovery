import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../../design-system/components/GlassCard';
import { GlassListItem } from '../../../design-system/components/GlassListItem';
import { GradientButton } from '../../../design-system/components/GradientButton';
import { darkAccent, gradients, radius, spacing, typography } from '../../../design-system/tokens/modern';
import { useAuth } from '../../../contexts/AuthContext';
import { useCleanTime } from '../../home/hooks/useCleanTime';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

interface MenuItem {
  icon: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
  danger?: boolean;
}

export function ProfileScreenModern(): React.ReactElement {
  const navigation = useNavigation();
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  
  // Get clean time for display
  const { days } = useCleanTime(user?.id || '');

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            try {
              await signOut();
            } finally {
              setSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const menuItems: MenuItem[] = [
    {
      icon: 'person',
      title: 'Edit Profile',
      subtitle: 'Update your name and photo',
      onPress: () => navigation.navigate('EditProfile' as any),
    },
    {
      icon: 'notifications',
      title: 'Notifications',
      subtitle: 'Manage reminders and alerts',
      onPress: () => navigation.navigate('NotificationSettings' as any),
    },
    {
      icon: 'security',
      title: 'Privacy & Security',
      subtitle: 'Biometric lock and data settings',
      onPress: () => navigation.navigate('PrivacySettings' as any),
    },
    {
      icon: 'backup',
      title: 'Data & Backup',
      subtitle: 'Export and sync settings',
      onPress: () => navigation.navigate('DataSettings' as any),
    },
  ];

  const supportItems: MenuItem[] = [
    {
      icon: 'help-outline',
      title: 'Help & Support',
      subtitle: 'FAQs and contact information',
      onPress: () => navigation.navigate('Support' as any),
    },
    {
      icon: 'policy',
      title: 'Privacy Policy',
      subtitle: 'How we protect your data',
      onPress: () => navigation.navigate('PrivacyPolicy' as any),
    },
    {
      icon: 'description',
      title: 'Terms of Service',
      subtitle: 'Legal terms and conditions',
      onPress: () => navigation.navigate('TermsOfService' as any),
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={[darkAccent.background, darkAccent.surface]} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <AnimatedScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={gradients.primary}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText} accessible={false}>
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </LinearGradient>
              <View 
                style={styles.statusIndicator} 
                accessibilityLabel="Online status"
                accessibilityRole="image"
              />
            </View>
            
            <Text style={styles.profileName} accessibilityRole="header">
              {user?.user_metadata?.name || 'Recovery Warrior'}
            </Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            
            {/* Sobriety Badge */}
            <View 
              style={styles.sobrietyBadge}
              accessibilityLabel={`${days} days clean`}
              accessibilityRole="text"
            >
              <MaterialIcons name="local-fire-department" size={16} color="#FBBF24" accessible={false} />
              <Text style={styles.sobrietyText}>{days} Days Clean</Text>
            </View>
          </Animated.View>

          {/* Stats Row */}
          <Animated.View entering={FadeInUp.delay(100)} style={styles.statsRow}>
            <GlassCard intensity="light" style={styles.statCard}>
              <MaterialIcons name="book" size={24} color={darkAccent.primary} accessible={false} />
              <Text style={styles.statValue}>24</Text>
              <Text style={styles.statLabel}>Entries</Text>
            </GlassCard>
            <GlassCard intensity="light" style={styles.statCard}>
              <MaterialIcons name="groups" size={24} color={darkAccent.success} accessible={false} />
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Meetings</Text>
            </GlassCard>
            <GlassCard intensity="light" style={styles.statCard}>
              <MaterialIcons name="emoji-events" size={24} color={darkAccent.warning} accessible={false} />
              <Text style={styles.statValue}>5</Text>
              <Text style={styles.statLabel}>Milestones</Text>
            </GlassCard>
          </Animated.View>

          {/* Settings Menu */}
          <Animated.View entering={FadeInUp.delay(200)}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Settings</Text>
            <View style={styles.menuList}>
              {menuItems.map((item, index) => (
                <GlassListItem
                  key={item.title}
                  title={item.title}
                  subtitle={item.subtitle}
                  icon={item.icon}
                  iconColor={item.danger ? darkAccent.error : darkAccent.primary}
                  onPress={item.onPress}
                />
              ))}
            </View>
          </Animated.View>

          {/* Support Menu */}
          <Animated.View entering={FadeInUp.delay(300)}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Support</Text>
            <View style={styles.menuList}>
              {supportItems.map((item) => (
                <GlassListItem
                  key={item.title}
                  title={item.title}
                  subtitle={item.subtitle}
                  icon={item.icon}
                  iconColor={darkAccent.textMuted}
                  onPress={item.onPress}
                />
              ))}
            </View>
          </Animated.View>

          {/* App Info */}
          <Animated.View entering={FadeInUp.delay(400)} style={styles.appInfo}>
            <Text style={styles.appVersion}>Steps to Recovery v1.0.0</Text>
            <Text style={styles.appBuild}>Build 2025.1.1</Text>
          </Animated.View>

          {/* Sign Out Button */}
          <Animated.View entering={FadeInUp.delay(500)} style={styles.signOutContainer}>
            <GradientButton
              title="Sign Out"
              variant="ghost"
              size="lg"
              fullWidth
              loading={signingOut}
              onPress={handleSignOut}
              accessibilityLabel="Sign out"
              accessibilityRole="button"
              accessibilityHint="Signs you out of your account"
            />
          </Animated.View>

          {/* Bottom padding */}
          <View style={{ height: spacing[4] }} />
        </AnimatedScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[3],
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing[3],
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFF',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: darkAccent.success,
    borderWidth: 3,
    borderColor: darkAccent.background,
  },
  profileName: {
    ...typography.h2,
    color: darkAccent.text,
    marginBottom: spacing[0.5],
  },
  profileEmail: {
    ...typography.body,
    color: darkAccent.textMuted,
    marginBottom: spacing[2],
  },
  sobrietyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251,191,36,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  sobrietyText: {
    ...typography.bodySmall,
    color: '#FBBF24',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing[2.5],
  },
  statValue: {
    ...typography.h3,
    color: darkAccent.text,
    marginTop: spacing[1],
  },
  statLabel: {
    ...typography.caption,
    color: darkAccent.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    ...typography.h4,
    color: darkAccent.text,
    marginBottom: spacing[2],
    marginTop: spacing[2],
  },
  menuList: {
    gap: spacing[2],
  },
  appInfo: {
    alignItems: 'center',
    marginTop: spacing[4],
    marginBottom: spacing[3],
  },
  appVersion: {
    ...typography.bodySmall,
    color: darkAccent.textMuted,
  },
  appBuild: {
    ...typography.caption,
    color: darkAccent.textSubtle,
    marginTop: 2,
  },
  signOutContainer: {
    marginTop: spacing[2],
  },
});
