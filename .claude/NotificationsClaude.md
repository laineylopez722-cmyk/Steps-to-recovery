# Notifications & Geofencing - Claude Prompt

## Objective

Implement local notifications, daily reminders, and geofence-based meeting location triggers.

## Target Files

- `apps/mobile/src/services/notificationService.ts` - Notification scheduling and management
- `apps/mobile/src/lib/notifications.ts` - Notification utilities and configuration
- `apps/mobile/src/types/notifications.ts` - Notification type definitions
- `apps/mobile/src/features/settings/screens/NotificationSettingsScreen.tsx` - Notification preferences UI
- Note: Permissions are handled inline in notification and location code (no separate permissions file)

## Requirements

### Local Notifications

1. **Daily Reminders**
   - Evening journaling reminder (customizable time)
   - Step 10 nightly review prompt
   - Morning gratitude reminder
   - User can enable/disable each type

2. **Milestone Notifications**
   - Celebrate sobriety milestones (1, 7, 14, 30, 60, 90 days, etc.)
   - Congratulatory messages
   - Badge/achievement unlock

### Geofencing

1. **Meeting Location Tracking**
   - User can save meeting locations
   - Set geofence radius (e.g., 100-200m)
   - Trigger on enter/exit

2. **Geofence Triggers**
   - **On Enter**: "You're near [Meeting Name]. Stay strong!"
   - **On Exit**: "Great job attending! Log a reflection?"
   - Platform limitations documented (iOS vs Android)

### Implementation Details

- Use Expo Notifications API for scheduling
- Use Expo Location + TaskManager for geofencing
- Request permissions at appropriate times
- Handle permission denials gracefully

### Background Tasks

```javascript
TaskManager.defineTask('geofence-task', ({ data: { eventType, region }, error }) => {
  if (error) {
    console.error(error);
    return;
  }
  if (eventType === Location.GeofencingEventType.Enter) {
    // Schedule notification
  }
});
```

### Permissions

- Request notification permission on first launch
- Request "Always" location permission for geofencing
- Explain why permissions are needed
- Degrade gracefully if denied

### app.json Configuration

```json
{
  "ios": {
    "infoPlist": {
      "NSLocationAlwaysAndWhenInUseUsageDescription": "We use your location to notify you when you're near saved meeting locations.",
      "NSLocationWhenInUseUsageDescription": "We use your location to help you save meeting locations."
    },
    "UIBackgroundModes": ["location"]
  },
  "android": {
    "permissions": ["ACCESS_FINE_LOCATION", "ACCESS_BACKGROUND_LOCATION", "POST_NOTIFICATIONS"]
  }
}
```

### User Experience

- Supportive, non-intrusive notifications
- Respect quiet hours
- Allow full customization
- Discrete notification text (privacy-conscious)
