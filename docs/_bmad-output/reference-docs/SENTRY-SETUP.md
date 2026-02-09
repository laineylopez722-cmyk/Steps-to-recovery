# Sentry Error Tracking Setup

This guide explains how to set up Sentry error tracking for the Recovery Companion app.

## Why Sentry?

Sentry provides:
- Real-time error monitoring
- Crash reporting for native and JavaScript errors
- Performance monitoring
- Release tracking
- User session replay (optional)

## Setup Steps

### 1. Create a Sentry Account

1. Go to [sentry.io](https://sentry.io) and create an account
2. Create a new project for "React Native"
3. Note your DSN (Data Source Name) from the project settings

### 2. Install Sentry

```bash
npx expo install @sentry/react-native
```

### 3. Configure Environment Variables

Create or update your `.env` file:

```env
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
```

For production builds, set this in your EAS secrets:

```bash
eas secret:create --name EXPO_PUBLIC_SENTRY_DSN --value "your-sentry-dsn-here"
```

### 4. Enable Sentry in Code

Open `lib/services/errorTracking.ts` and uncomment the Sentry-related code:

1. Uncomment the import at the top:
   ```typescript
   import * as Sentry from '@sentry/react-native';
   ```

2. Uncomment the `Sentry.init()` call in `initializeErrorTracking()`

3. Uncomment the Sentry calls in each function

### 5. Initialize in App Entry

In `app/_layout.tsx`, add:

```typescript
import { initializeErrorTracking } from '../lib/services/errorTracking';

// At the top of your root layout component
useEffect(() => {
  initializeErrorTracking();
}, []);
```

### 6. Configure EAS Build (Optional)

For source maps and release tracking, update `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "@sentry/react-native/expo",
        {
          "organization": "your-org",
          "project": "recovery-companion"
        }
      ]
    ]
  }
}
```

And add to `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "SENTRY_AUTH_TOKEN": "@sentry-auth-token"
      }
    }
  }
}
```

## Privacy Considerations

The error tracking service is configured with privacy in mind:

1. **No PII by default**: `sendDefaultPii` is set to `false`
2. **Filtered breadcrumbs**: Sensitive data (journal content, step work answers, reflections) is automatically filtered from error reports
3. **Anonymous user IDs**: Only anonymous identifiers are sent, never personal information
4. **Local encryption**: All sensitive data is encrypted locally and never sent to Sentry

## Usage Examples

### Capture Exceptions

```typescript
import { captureException } from '../lib/services/errorTracking';

try {
  await riskyOperation();
} catch (error) {
  captureException(error as Error, {
    component: 'JournalScreen',
    action: 'saveEntry',
  });
}
```

### Log User Actions

```typescript
import { logUserAction } from '../lib/services/errorTracking';

logUserAction('completed_checkin', { mood: 7, craving: 3 });
```

### Track Navigation

```typescript
import { logNavigation } from '../lib/services/errorTracking';

logNavigation('JournalScreen', { entryId: '123' });
```

### Performance Monitoring

```typescript
import { startTransaction } from '../lib/services/errorTracking';

const transaction = startTransaction('loadMeetings', 'db.query');
await loadMeetingsFromDatabase();
transaction.finish();
```

## Testing

To test error tracking in development:

1. Set `debug: true` in the Sentry config
2. Trigger a test error:
   ```typescript
   throw new Error('Test error for Sentry');
   ```
3. Check your Sentry dashboard for the error

## Troubleshooting

### Errors not appearing in Sentry

1. Verify your DSN is correct
2. Check that `initializeErrorTracking()` is called early in app startup
3. Ensure you're not in development mode (or set `debug: true`)

### Source maps not working

1. Verify your Sentry auth token is set
2. Run `npx sentry-expo upload-sourcemaps` after building
3. Check that the release version matches

### Performance data missing

1. Verify `tracesSampleRate` is set (e.g., `0.2` for 20% sampling)
2. Ensure transactions are properly started and finished

