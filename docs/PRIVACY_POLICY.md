# Privacy Policy (Draft)

**Last Updated:** January 29, 2026

This Privacy Policy explains how Steps to Recovery ("we", "our", "the app") collects, uses, and protects your information. This is a **draft** and must be reviewed and finalized before release.

## Summary

- Sensitive recovery data is encrypted **before** storage or sync.
- Local database (SQLite/IndexedDB) is the source of truth.
- Cloud sync uses Supabase and stores encrypted payloads.
- We do **not** sell your data or show ads.

## Information We Collect

### 1) Account Information

If you create an account, we store:

- Email address (via Supabase Auth)
- User ID (UUID)

### 2) User-Generated Content (Encrypted)

We store encrypted content such as:

- Journal entries
- Step work answers
- Daily check-in reflections
- Reading reflections
- Meeting notes

### 3) App Metadata (Not Encrypted)

Some operational fields are stored to make the app work:

- Timestamps (created/updated)
- Sync status
- Record IDs
- Streak counts or completion flags

### 4) Location Data (Optional)

If you enable location features for meeting search/geofencing:

- Your latitude/longitude may be used to find nearby meetings
- Location data is stored locally and used for cache regions

### 5) Device/Diagnostic Data (Optional)

If error monitoring is enabled (e.g., Sentry), basic diagnostic data may be sent to help fix crashes. We do not send plaintext recovery content.

## How We Use Information

- Provide core recovery features
- Sync encrypted data across devices (if enabled)
- Cache nearby meetings for offline use
- Improve stability and fix bugs

## Where Data Is Stored

- **On-device**: SQLite/IndexedDB with encryption for sensitive fields
- **Cloud (optional)**: Supabase stores encrypted payloads and basic metadata

## Third-Party Services

We may use the following services:

- **Supabase** (Auth + Database) for optional cloud sync
- **Sentry** (optional) for crash reporting
- **Meeting Guide API** (e.g., `https://aasanjose.org/api/meetings`) for public meeting data

These providers may process limited data required for their service (e.g., API requests).

## Data Retention

Your data is retained until you delete it. Deleting data in-app removes it from the local database; synced data is removed from the cloud during the next sync.

## Your Choices

- Use the app offline without cloud sync
- Disable location and notifications
- Export your data (if export feature is enabled)
- Delete your data at any time

## Security

We use AES encryption for sensitive content and secure key storage on supported platforms. Never store or log plaintext sensitive data.

## Children's Privacy

This app is intended for adults. We do not knowingly collect data from children under 13.

## Changes to This Policy

We will update the "Last Updated" date and notify users of material changes.

## Contact

Replace with your official support contact:

- Email: support@stepstorecovery.app
- Website: https://stepstorecovery.app/privacy

---

**Important:** This document is a draft. Review with legal counsel before release.
