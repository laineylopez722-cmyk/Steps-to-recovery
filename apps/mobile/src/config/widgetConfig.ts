/**
 * Widget Configuration
 *
 * Configuration for future native widget support.
 * When expo-widget or react-native-widget-extension is added,
 * this config will drive the widget rendering on iOS and Android.
 *
 * @module config/widgetConfig
 */

export const WIDGET_CONFIG = {
  /** Widget data refresh interval in seconds */
  refreshInterval: 300, // 5 minutes

  /** Small widget (2×2) — clean time only */
  smallWidget: {
    showCleanTime: true,
    showDailyQuote: false,
    showTodayStatus: false,
    showStreaks: false,
  },

  /** Medium widget (4×2) — clean time + quote + today status */
  mediumWidget: {
    showCleanTime: true,
    showDailyQuote: true,
    showTodayStatus: true,
    showStreaks: false,
  },

  /** Large widget (4×4) — everything */
  largeWidget: {
    showCleanTime: true,
    showDailyQuote: true,
    showTodayStatus: true,
    showStreaks: true,
  },
} as const;

export type WidgetSize = 'smallWidget' | 'mediumWidget' | 'largeWidget';
