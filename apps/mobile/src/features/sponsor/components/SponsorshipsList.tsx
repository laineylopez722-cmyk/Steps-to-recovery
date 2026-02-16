/**
 * SponsorshipsList - Displays list of sponsorship connections
 * Shows sponsor/sponsees with connection status and quick actions
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { GlassCard } from '../../../design-system/components/GlassCard';
import { darkAccent, spacing, typography } from '../../../design-system/tokens/modern';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';

export interface SponsorConnection {
  id: string;
  display_name?: string;
  status: 'pending' | 'active';
  direction: 'sponsor' | 'sponsee';
  lastContact?: string;
  unreadCount?: number;
}

interface SponsershipsListProps {
  connections: SponsorConnection[];
  onConnectionPress: (connection: SponsorConnection) => void;
  emptyMessage?: string;
}

export function SponsorshipsList({
  connections,
  onConnectionPress,
  emptyMessage = 'No connections yet',
}: SponsershipsListProps): React.ReactElement {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const formatLastContact = (dateString?: string) => {
    if (!dateString) return 'No recent contact';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getIconName = (direction: 'sponsor' | 'sponsee') => {
    return direction === 'sponsor' ? 'account-heart' : 'account-check';
  };

  const getStatusColor = (status: 'pending' | 'active') => {
    return status === 'active' ? darkAccent.success : darkAccent.warning;
  };

  if (connections.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="account-multiple-outline"
          size={48}
          color={darkAccent.textSubtle}
          importantForAccessibility="no"
          accessibilityElementsHidden
        />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {connections.map((connection, index) => (
        <Animated.View key={connection.id} entering={FadeInUp.delay(index * 50).duration(400)}>
          <Pressable
            onPress={() => onConnectionPress(connection)}
            accessibilityRole="button"
            accessibilityLabel={`${connection.direction === 'sponsor' ? 'Sponsor' : 'Sponsee'}: ${connection.display_name || 'Unknown'}`}
            accessibilityHint={`Tap to view shared entries${connection.unreadCount ? `. ${connection.unreadCount} unread entries` : ''}`}
          >
            <GlassCard intensity="medium" style={styles.card} pressable>
              <View style={styles.cardContent}>
                {/* Icon & Status Indicator */}
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name={getIconName(connection.direction)}
                    size={40}
                    color={getStatusColor(connection.status)}
                  />
                  {connection.status === 'pending' && (
                    <View style={[styles.statusBadge, styles.pendingBadge]}>
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={10}
                        color={ds.semantic.text.onDark}
                      />
                    </View>
                  )}
                  {connection.unreadCount && connection.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>
                        {connection.unreadCount > 9 ? '9+' : connection.unreadCount}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Connection Info */}
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>
                    {connection.display_name || 'Unknown'}
                  </Text>
                  <Text style={styles.role}>
                    {connection.direction === 'sponsor' ? 'My Sponsor' : 'My Sponsee'}
                  </Text>
                  <Text style={styles.lastContact}>
                    {formatLastContact(connection.lastContact)}
                  </Text>
                </View>

                {/* Chevron */}
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={darkAccent.textSubtle}
                  importantForAccessibility="no"
                  accessibilityElementsHidden
                />
              </View>
            </GlassCard>
          </Pressable>
        </Animated.View>
      ))}
    </View>
  );
}

const createStyles = (ds: DS) =>
  ({
    container: {
      gap: spacing[2],
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing[6],
    },
    emptyText: {
      ...typography.body,
      color: darkAccent.textMuted,
      marginTop: spacing[2],
      textAlign: 'center',
    },
    card: {
      padding: spacing[3],
    },
    cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    iconContainer: {
      position: 'relative',
    },
    statusBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 16,
      height: 16,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pendingBadge: {
      backgroundColor: darkAccent.warning,
    },
    unreadBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: darkAccent.danger,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    unreadText: {
      ...typography.caption,
      color: ds.semantic.text.onDark,
      fontSize: 10,
      fontWeight: '700',
    },
    info: {
      flex: 1,
    },
    name: {
      ...typography.h4,
      color: darkAccent.text,
      marginBottom: 2,
    },
    role: {
      ...typography.caption,
      color: darkAccent.primary,
      textTransform: 'uppercase',
      fontWeight: '600',
      marginBottom: 2,
    },
    lastContact: {
      ...typography.caption,
      color: darkAccent.textSubtle,
    },
  }) as const;
