/**
 * Chat Bubble Component
 * Displays individual chat messages with typing indicator and animations.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Message } from '../types';

interface ChatBubbleProps {
  message: Message;
  isTyping?: boolean;
  isNew?: boolean;
}

export function ChatBubble({ message, isTyping, isNew = false }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const fadeAnim = useRef(new Animated.Value(isNew ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(isNew ? 10 : 0)).current;

  useEffect(() => {
    if (isNew) {
      // Subtle haptic for new AI messages
      if (!isUser) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      
      // Fade and slide in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isNew, isUser, fadeAnim, slideAnim]);

  return (
    <Animated.View
      className={`flex-row ${isUser ? 'justify-end' : 'justify-start'} mb-3 px-4`}
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
      accessibilityRole="text"
      accessibilityLabel={`${isUser ? 'You' : 'Companion'} said: ${message.content}`}
    >
      <View
        className={`
          max-w-[80%] rounded-2xl px-4 py-3 shadow-sm
          ${isUser ? 'bg-amber-500 rounded-br-sm' : 'bg-gray-800/90 rounded-bl-sm'}
        `}
      >
        {isTyping ? (
          <TypingDots />
        ) : (
          <Text 
            className={`text-base leading-6 ${isUser ? 'text-black' : 'text-white'}`}
            selectable
          >
            {message.content}
          </Text>
        )}

        <Text className={`text-xs mt-1.5 ${isUser ? 'text-black/40' : 'text-gray-500'}`}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </Animated.View>
  );
}

function TypingDots() {
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
        ])
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
    <View className="flex-row items-center h-6" accessibilityLabel="Typing...">
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          className="w-2 h-2 rounded-full bg-gray-400 mx-0.5"
          style={{ transform: [{ translateY: dot }] }}
        />
      ))}
    </View>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
