export const ImpactFeedbackStyle = {
  Light: 'light',
  Medium: 'medium',
  Heavy: 'heavy',
  Rigid: 'rigid',
  Soft: 'soft',
} as const;

export const NotificationFeedbackType = {
  Success: 'success',
  Warning: 'warning',
  Error: 'error',
} as const;

export type ImpactFeedbackStyleValue =
  (typeof ImpactFeedbackStyle)[keyof typeof ImpactFeedbackStyle];
export type NotificationFeedbackTypeValue =
  (typeof NotificationFeedbackType)[keyof typeof NotificationFeedbackType];

export interface HapticsPort {
  impactAsync(style: ImpactFeedbackStyleValue): Promise<void>;
  notificationAsync(type: NotificationFeedbackTypeValue): Promise<void>;
  selectionAsync(): Promise<void>;
}
