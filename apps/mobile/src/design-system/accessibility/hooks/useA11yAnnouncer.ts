/**
 * useA11yAnnouncer Hook
 *
 * Screen reader announcement utility with queue system for multiple announcements.
 * Supports priority levels (critical, normal, info) for proper message ordering.
 *
 * Used for announcements like:
 * - "Journal saved"
 * - "Milestone reached: 30 days"
 * - "Error: Please check your input"
 *
 * @example
 * ```tsx
 * const { announce, announceCritical, clearQueue } = useA11yAnnouncer();
 *
 * // Normal announcement
 * announce('Journal entry saved');
 *
 * // Critical announcement (interrupts current)
 * announceCritical('Emergency contact activated');
 *
 * // Queued announcements
 * announce('Step 1 completed', { priority: 'normal' });
 * announce('Great progress!', { priority: 'info', delay: 1000 });
 * ```
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Announcement priority levels */
export type AnnouncementPriority = 'critical' | 'normal' | 'info';

/** Announcement options */
export interface AnnouncementOptions {
  /** Priority level */
  priority?: AnnouncementPriority;
  /** Delay before announcing (ms) */
  delay?: number;
  /** Whether to interrupt current announcement */
  interrupt?: boolean;
  /** Custom politeness level for screen reader */
  politeness?: 'assertive' | 'polite';
}

/** Queue item */
interface AnnouncementQueueItem {
  id: string;
  message: string;
  priority: AnnouncementPriority;
  delay: number;
  politeness: 'assertive' | 'polite';
  timestamp: number;
}

/** Hook return type */
export interface UseA11yAnnouncerReturn {
  /** Announce a message */
  announce: (message: string, options?: AnnouncementOptions) => void;
  /** Announce with critical priority (interrupts others) */
  announceCritical: (message: string, options?: Omit<AnnouncementOptions, 'priority'>) => void;
  /** Announce with info priority (lowest) */
  announceInfo: (message: string, options?: Omit<AnnouncementOptions, 'priority'>) => void;
  /** Clear all pending announcements */
  clearQueue: () => void;
  /** Get current queue length */
  queueLength: number;
  /** Whether an announcement is currently being spoken */
  isAnnouncing: boolean;
  /** Last announced message */
  lastAnnouncement: string | null;
}

/** Priority weights for sorting */
const PRIORITY_WEIGHTS: Record<AnnouncementPriority, number> = {
  critical: 3,
  normal: 2,
  info: 1,
};

/** Minimum time between announcements (ms) */
const MIN_ANNOUNCEMENT_INTERVAL = 100;

/** Default announcement duration estimate (ms) - used for queue timing */
const DEFAULT_ANNOUNCEMENT_DURATION = 2000;

/**
 * Screen reader announcer with priority queue
 * @returns Announcement functions and state
 */
export function useA11yAnnouncer(): UseA11yAnnouncerReturn {
  const queueRef = useRef<AnnouncementQueueItem[]>([]);
  const processingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnnouncementRef = useRef<string | null>(null);
  const lastAnnounceTimeRef = useRef(0);
  const mountedRef = useRef(true);

  const [queueLength, setQueueLength] = useState(0);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [lastAnnouncement, setLastAnnouncement] = useState<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Process the announcement queue
   */
  const processQueue = useCallback(() => {
    if (processingRef.current || queueRef.current.length === 0 || !mountedRef.current) {
      return;
    }

    processingRef.current = true;
    setIsAnnouncing(true);

    // Sort queue by priority (highest first) and timestamp
    queueRef.current.sort((a, b) => {
      const priorityDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp;
    });

    const item = queueRef.current.shift();
    setQueueLength(queueRef.current.length);

    if (!item) {
      processingRef.current = false;
      setIsAnnouncing(false);
      return;
    }

    // Format message for better screen reader pronunciation
    const formattedMessage = formatAnnouncement(item.message);
    lastAnnouncementRef.current = formattedMessage;
    setLastAnnouncement(formattedMessage);

    // Make the announcement
    const announce = () => {
      AccessibilityInfo.announceForAccessibility(formattedMessage);
      lastAnnounceTimeRef.current = Date.now();

      // Estimate announcement duration and process next
      const estimatedDuration = estimateAnnouncementDuration(formattedMessage);

      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          processingRef.current = false;
          setIsAnnouncing(false);
          // Process next item if any
          if (queueRef.current.length > 0) {
            processQueue();
          }
        }
      }, estimatedDuration + MIN_ANNOUNCEMENT_INTERVAL);
    };

    // Apply delay if specified
    if (item.delay > 0) {
      timeoutRef.current = setTimeout(announce, item.delay);
    } else {
      announce();
    }
  }, []);

  /**
   * Add announcement to queue
   */
  const announce = useCallback(
    (message: string, options: AnnouncementOptions = {}): void => {
      const { priority = 'normal', delay = 0, interrupt = false, politeness = 'polite' } = options;

      // Skip empty messages
      if (!message || message.trim().length === 0) return;

      // Don't announce duplicates immediately
      if (message === lastAnnouncementRef.current) {
        const timeSinceLast = Date.now() - lastAnnounceTimeRef.current;
        if (timeSinceLast < 3000) return; // Don't repeat within 3 seconds
      }

      const item: AnnouncementQueueItem = {
        id: generateId(),
        message,
        priority,
        delay,
        politeness,
        timestamp: Date.now(),
      };

      if (interrupt && priority === 'critical') {
        // Clear queue and current processing
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        queueRef.current = [item];
        processingRef.current = false;
        setQueueLength(0);
        processQueue();
      } else {
        queueRef.current.push(item);
        setQueueLength(queueRef.current.length);

        // Start processing if not already
        if (!processingRef.current) {
          processQueue();
        }
      }
    },
    [processQueue],
  );

  /**
   * Announce with critical priority (interrupts others)
   */
  const announceCritical = useCallback(
    (message: string, options: Omit<AnnouncementOptions, 'priority'> = {}): void => {
      announce(message, {
        ...options,
        priority: 'critical',
        interrupt: true,
        politeness: 'assertive',
      });
    },
    [announce],
  );

  /**
   * Announce with info priority (lowest)
   */
  const announceInfo = useCallback(
    (message: string, options: Omit<AnnouncementOptions, 'priority'> = {}): void => {
      announce(message, { ...options, priority: 'info' });
    },
    [announce],
  );

  /**
   * Clear all pending announcements
   */
  const clearQueue = useCallback((): void => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    queueRef.current = [];
    processingRef.current = false;
    setQueueLength(0);
    setIsAnnouncing(false);
  }, []);

  return {
    announce,
    announceCritical,
    announceInfo,
    clearQueue,
    queueLength,
    isAnnouncing,
    lastAnnouncement,
  };
}

/**
 * Format announcement for better screen reader pronunciation
 */
function formatAnnouncement(text: string): string {
  return (
    text
      // Add pauses for numbers (e.g., "30 days" -> "30, days")
      .replace(/(\d+)(\s+)(days?|hours?|minutes?|seconds?|weeks?|months?|years?)/gi, '$1, $3')
      // Replace ellipsis with pause
      .replace(/\.{3}/g, ', ')
      // Add spaces in camelCase
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Remove multiple spaces
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Estimate how long it takes to announce a message
 * Roughly 150ms per word + 300ms overhead
 */
function estimateAnnouncementDuration(message: string): number {
  const wordCount = message.split(/\s+/).length;
  return Math.max(DEFAULT_ANNOUNCEMENT_DURATION, wordCount * 150 + 300);
}

/**
 * Generate unique ID for queue items
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default useA11yAnnouncer;
