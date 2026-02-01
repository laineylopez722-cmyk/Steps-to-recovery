/**
 * Profile Screen
 * User settings, privacy information, and account management
 * Design: iOS-style with design system components
 */

import { useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme, Card, Button, Modal, ProfileSkeleton } from '../../../design-system';
import { Text } from 'react-native';

interface ListItemProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  onPress?: () => void;
  disabled?: boolean;
  iconColor?: string;
}

function ListItem({
  icon,
  title,
  description,
  onPress,
  disabled = false,
  iconColor,
}: ListItemProps): React.ReactElement {
  const theme = useTheme();

  const content = (
    <View style={[styles.listItem, { opacity: disabled ? 0.6 : 1 }]}>
      <View style={[styles.listItemIcon, { marginRight: theme.spacing.md }]}>
        <MaterialCommunityIcons name={icon} size={24} color={iconColor || theme.colors.primary} />
      </View>
      <View style={styles.listItemContent}>
        <Text style={[theme.typography.label, { color: theme.colors.text }]}>{title}</Text>
        <Text
          style={[theme.typography.bodySmall, { color: theme.colors.textSecondary, marginTop: 2 }]}
        >
          {description}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
    </View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityLabel={title}
        accessibilityRole="button"
        accessibilityHint={description}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View accessibilityLabel={`${title} - ${description}`}>{content}</View>;
}

function Divider(): React.ReactElement {
  const theme = useTheme();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: theme.colors.divider,
        marginVertical: theme.spacing.xs,
      }}
    />
  );
}

export function ProfileScreen(): React.ReactElement {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const { user, signOut, loading } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // Show skeleton while user data is loading
  const isLoading = loading && !user;

  const handleSignOut = async (): Promise<void> => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      // Error handled by auth context
    } finally {
      setSigningOut(false);
      setShowSignOutModal(false);
    }
  };

  return (
    <>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['bottom']}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.contentContainer, { paddingHorizontal: theme.spacing.md }]}
          showsVerticalScrollIndicator={false}
        >
          {/* User Profile Card */}
          <Card variant="elevated" style={{ marginBottom: theme.spacing.lg }}>
            <View style={styles.userProfile}>
              {isLoading ? (
                <ProfileSkeleton />
              ) : (
                <>
                  <View
                    style={[
                      styles.avatarContainer,
                      {
                        backgroundColor: theme.colors.primary + '20',
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        marginBottom: theme.spacing.md,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="account-circle"
                      size={64}
                      color={theme.colors.primary}
                    />
                  </View>
                  {user && (
                    <Text
                      style={[
                        theme.typography.body,
                        { color: theme.colors.textSecondary, textAlign: 'center' },
                      ]}
                    >
                      {user.email}
                    </Text>
                  )}
                </>
              )}
            </View>
          </Card>

          {/* App Settings Section */}
          <Text
            style={[
              theme.typography.h3,
              { color: theme.colors.text, marginBottom: theme.spacing.sm },
            ]}
            accessibilityRole="header"
          >
            Settings
          </Text>
          <Card variant="elevated" style={{ marginBottom: theme.spacing.lg }}>
            <ListItem
              icon="account-supervisor"
              title="Sponsor"
              description="Connect with sponsor or sponsees"
              onPress={() => navigation.navigate('Sponsor')}
            />
            <Divider />
            <ListItem
              icon="bell"
              title="Notifications"
              description="Manage notification preferences"
              onPress={() => navigation.navigate('NotificationSettings')}
            />
            <Divider />
            <ListItem
              icon="shield-lock"
              title="Privacy & Security"
              description="Biometrics, auto-lock, and encryption"
              disabled
            />
            <Divider />
            <ListItem
              icon="download"
              title="Data Export"
              description="Download your encrypted data"
              disabled
            />
          </Card>

          {/* Support & Resources Section */}
          <Text
            style={[
              theme.typography.h3,
              { color: theme.colors.text, marginBottom: theme.spacing.sm },
            ]}
            accessibilityRole="header"
          >
            Support & Resources
          </Text>
          <Card variant="elevated" style={{ marginBottom: theme.spacing.lg }}>
            <ListItem
              icon="phone-alert"
              title="Emergency Support"
              description="Crisis hotlines and resources"
              iconColor={theme.colors.danger}
              disabled
            />
            <Divider />
            <ListItem
              icon="information"
              title="About"
              description="Version 0.1.0 (Phase 2 Alpha)"
              disabled
            />
          </Card>

          {/* Privacy Info Card */}
          <Card
            variant="elevated"
            style={{
              backgroundColor: theme.colors.success + '15',
              marginBottom: theme.spacing.lg,
            }}
          >
            <View style={styles.privacyInfo}>
              <View
                style={[
                  styles.privacyIcon,
                  {
                    backgroundColor: theme.colors.success + '20',
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    marginBottom: theme.spacing.sm,
                  },
                ]}
              >
                <MaterialCommunityIcons name="lock" size={28} color={theme.colors.success} />
              </View>
              <Text
                style={[
                  theme.typography.label,
                  {
                    color: theme.colors.success,
                    marginBottom: theme.spacing.xs,
                    textAlign: 'center',
                  },
                ]}
              >
                Your Privacy is Protected
              </Text>
              <Text
                style={[
                  theme.typography.bodySmall,
                  {
                    color: theme.colors.text,
                    textAlign: 'center',
                    lineHeight: 20,
                  },
                ]}
              >
                All your journal entries and step work are encrypted with AES-256 encryption before
                being stored. Only you can decrypt and read your data.
              </Text>
            </View>
          </Card>

          {/* Sign Out Button */}
          <Button
            title="Sign Out"
            onPress={() => setShowSignOutModal(true)}
            variant="outline"
            size="large"
            fullWidth
            loading={signingOut}
            disabled={signingOut}
            icon={<MaterialCommunityIcons name="logout" size={20} color={theme.colors.danger} />}
            textStyle={{ color: theme.colors.danger }}
            style={{ marginBottom: theme.spacing.md }}
            accessibilityLabel="Sign out of your account"
            accessibilityHint="Requires confirmation"
          />

          {/* Footer */}
          <Text
            style={[
              theme.typography.caption,
              {
                color: theme.colors.textSecondary,
                textAlign: 'center',
                marginTop: theme.spacing.sm,
                marginBottom: theme.spacing.xl,
              },
            ]}
          >
            Made with care for the recovery community
          </Text>
        </ScrollView>
      </SafeAreaView>

      {/* Sign Out Confirmation Modal */}
      <Modal
        visible={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        title="Sign Out"
        message="Are you sure you want to sign out? Any unsynced data will be uploaded before signing out."
        variant="center"
        actions={[
          {
            title: 'Cancel',
            onPress: () => {},
            variant: 'outline',
            accessibilityLabel: 'Cancel sign out',
          },
          {
            title: 'Sign Out',
            onPress: handleSignOut,
            variant: 'danger',
            accessibilityLabel: 'Confirm sign out',
          },
        ]}
        dismissable
      />
    </>
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
    paddingTop: 16,
  },
  userProfile: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  listItemIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemContent: {
    flex: 1,
  },
  privacyInfo: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  privacyIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
