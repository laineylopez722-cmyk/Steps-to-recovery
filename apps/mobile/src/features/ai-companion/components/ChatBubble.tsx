/**
 * Chat Bubble Component
 *
 * Apple Messages-inspired bubbles.
 * Smooth animations, no harsh edges.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import * as Haptics from '@/platform/haptics';
import { useThemedStyles, type DS } from '../../../design-system/hooks/useThemedStyles';
import { useDs } from '../../../design-system/DsProvider';
import type { Message } from '../types';

interface ChatBubbleProps {
  message: Message;
  isTyping?: boolean;
  isNew?: boolean;
}

export function ChatBubble({ message, isTyping, isNew = false }: ChatBubbleProps) {
  const styles = useThemedStyles(createStyles);
  const ds = useDs();
  const isUser = message.role === 'user';
  const fadeAnim = useRef(new Animated.Value(isNew ? 0 : 1)).current;
  const scaleAnim = useRef(new Animated.Value(isNew ? 0.95 : 1)).current;

  useEffect(() => {
    if (isNew) {
      if (!isUser) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          ...ds.spring.smooth,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isNew, isUser, fadeAnim, scaleAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        isUser ? styles.containerUser : styles.containerAssistant,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${isUser ? 'You' : 'Companion'} said: ${message.content}`}
    >
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        {isTyping ? (
          <TypingDots />
        ) : (
          <Text style={[styles.text, isUser ? styles.textUser : styles.textAssistant]} selectable>
            {message.content}
          </Text>
        )}

        <Text style={[styles.time, isUser ? styles.timeUser : styles.timeAssistant]}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </Animated.View>
  );
}

function TypingDots() {
  const styles = useThemedStyles(createStyles);
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createBounce = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -4,
            duration: 200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 200,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
    };

    const animation1 = createBounce(dot1, 0);
    const animation2 = createBounce(dot2, 150);
    const animation3 = createBounce(dot3, 300);

    animation1.start();
    animation2.start();
    animation3.start();

    return () => {
      animation1.stop();
      animation2.stop();
      animation3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.dots} accessibilityLabel="Typing...">
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View key={i} style={[styles.dot, { transform: [{ translateY: dot }] }]} />
      ))}
    </View>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const createStyles = (ds: DS) =>
  ({
    container: {
      flexDirection: 'row',
      marginBottom: ds.space[3],
      paddingHorizontal: ds.space[4],
    },
    containerUser: {
      justifyContent: 'flex-end',
    },
    containerAssistant: {
      justifyContent: 'flex-start',
    },

    bubble: {
      maxWidth: '80%',
      paddingHorizontal: ds.space[4],
      paddingVertical: ds.space[3],
    },
    bubbleUser: {
      backgroundColor: ds.colors.accent,
      borderRadius: 22,
      borderBottomRightRadius: 6,
    },
    bubbleAssistant: {
      backgroundColor: ds.colors.bgTertiary,
      borderRadius: 22,
      borderBottomLeftRadius: 6,
    },

    text: {
      fontSize: 17,
      lineHeight: 24,
    },
    textUser: {
      color: ds.colors.text,
    },
    textAssistant: {
      color: ds.colors.textPrimary,
    },

    time: {
      fontSize: 11,
      marginTop: ds.space[2],
    },
    timeUser: {
      color: ds.colors.textMuted,
    },
    timeAssistant: {
      color: ds.colors.textQuaternary,
    },

    dots: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 24,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: ds.colors.textTertiary,
      marginHorizontal: 2,
    },
  }) as const;

