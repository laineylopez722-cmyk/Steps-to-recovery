/**
 * Chat Bubble Component
 * Displays individual chat messages with typing indicator support.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import type { Message } from '../types';

interface ChatBubbleProps {
  message: Message;
  isTyping?: boolean;
}

export function ChatBubble({ message, isTyping }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <View
      className={`flex-row ${isUser ? 'justify-end' : 'justify-start'} mb-3 px-4`}
      accessibilityRole="text"
      accessibilityLabel={`${isUser ? 'You' : 'Companion'} said: ${message.content}`}
    >
      <View
        className={`
          max-w-[85%] rounded-2xl px-4 py-3
          ${isUser ? 'bg-amber-500 rounded-br-sm' : 'bg-gray-800 rounded-bl-sm'}
        `}
      >
        {isTyping ? (
          <TypingDots />
        ) : (
          <Text className={`text-base ${isUser ? 'text-black' : 'text-white'}`}>
            {message.content}
          </Text>
        )}

        <Text className={`text-xs mt-1 ${isUser ? 'text-black/50' : 'text-gray-500'}`}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
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
