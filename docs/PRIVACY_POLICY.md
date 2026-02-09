# Privacy Policy

**Steps to Recovery**  
**Last Updated: February 9, 2026**  
**Effective Date: February 9, 2026**

---

## Introduction

Steps to Recovery ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your information when you use our 12-Step Recovery Companion mobile application (the "App").

**Our Core Privacy Promise:**
- Your recovery journey is **private and confidential**
- All sensitive data is **encrypted on your device** before storage
- We **cannot read your journal entries, step work, or personal reflections**
- You maintain **full control** over your data with export and deletion options

---

## Information We Collect

### 1. Account Information

When you create an account, we collect:
- **Email address** (for authentication and account recovery)
- **Secure authentication tokens** (managed by Supabase Auth)
- **Account creation date**

### 2. Recovery-Related Data (End-to-End Encrypted)

All recovery-related content is encrypted on your device using AES-256-CBC encryption **before** being stored or transmitted. We cannot access the decrypted content:

| Data Type | Description | Encryption |
|-----------|-------------|------------|
| **Journal Entries** | Your personal reflections and daily writings | Encrypted locally |
| **Daily Check-ins** | Mood, urges, gratitude, and daily reflections | Encrypted locally |
| **Step Work** | 12-step worksheets, inventories, and progress | Encrypted locally |
| **Reading Reflections** | Notes on daily recovery readings | Encrypted locally |
| **Meeting Notes** | Personal notes about meetings attended | Encrypted locally |
| **Clean Time Tracker** | Sobriety dates and milestones (dates only, optional) | Stored locally |

### 3. Optional Features Data

**Meeting Finder (Optional):**
- Location data (only when you actively search)
- Meeting preferences (day, time, type)
- Favorite meetings list (stored locally)

**Sponsor Connections (Optional):**
- Connection codes you generate or enter
- Shared progress (only what you explicitly choose to share)

**AI Companion (Optional):**
- Conversation history (stored locally on your device)
- Memory context (anonymized, local only)
- AI interactions never sent to third parties without consent

### 4. Technical Data

**App Performance:**
- Crash logs and error reports (via Sentry, anonymized)
- App version and device type (for compatibility)
- Anonymous usage statistics (only with your explicit consent)

**Sync Information:**
- Sync timestamps (to manage data consistency)
- Queue status (for offline sync management)
- Device identifiers (for multi-device sync)

---

## How We Store and Protect Your Data

### End-to-End Encryption

Your sensitive data follows this secure flow:

```
Your Input
    ↓
[Encrypted on Device] (AES-256-CBC)
    ↓
Stored in Local SQLite Database
    ↓
Sync to Cloud (Encrypted) → Supabase
```

**Encryption Details:**
- **Algorithm:** AES-256-CBC
- **Key Derivation:** PBKDF2 with 100,000 iterations
- **Authentication:** HMAC-SHA256 (encrypt-then-MAC)
- **Key Storage:** iOS Keychain / Android Keystore (never transmitted)

### Local-First Architecture

- **Primary Storage:** Your device (SQLite on mobile, IndexedDB on web)
- **Offline Functionality:** Works completely without internet
- **Cloud Backup:** Optional encrypted backup to Supabase
- **Data Residency:** Your data primarily stays on your device

### Third-Party Services

| Service | Purpose | Data Shared |
|---------|---------|-------------|
| **Supabase** | Authentication & encrypted cloud backup | Encrypted data only, email |
| **Sentry** | Error tracking | Anonymized crash logs |
| **Expo** | App infrastructure | None (build service only) |

**Important:** We do not and will not sell your personal information to third parties.

---

## Your Privacy Rights

### Right to Access

You can access all your data at any time through the app:
- View all journal entries, check-ins, and step work
- Review your progress and milestones
- Access your account information

### Right to Export

You can export your data in a portable format:
- **Export Location:** Settings → Privacy → Export My Data
- **Format:** JSON with all decrypted content
- **Timeline:** Available instantly
- **Contents:** All journal entries, check-ins, step work, and account data

### Right to Delete

You can delete your data at any time:

**Option 1: Delete Specific Content**
- Delete individual journal entries
- Remove specific check-ins or step work
- Data is permanently removed from your device and cloud

**Option 2: Delete Account (Complete Data Removal)**
- **Location:** Settings → Privacy → Delete Account
- **What Happens:**
  1. All local data is wiped from your device
  2. All cloud backups are deleted
  3. Encryption keys are destroyed
  4. Account is permanently deleted within 30 days
- **Timeline:** Immediate local deletion, 30 days for complete server removal

### Right to Restrict Processing

You can use the app in offline-only mode:
- Disable cloud sync in Settings
- All data remains local to your device
- No data transmitted to our servers

### Right to Object

You can opt out of:
- Anonymous analytics collection
- Error reporting
- Push notifications
- Marketing communications (we don't send any)

---

## Data Retention

### Active Accounts

- **Local Data:** Retained until you delete it
- **Cloud Backups:** Retained while account is active
- **Sync Queue:** Cleared after successful sync (typically <24 hours)
- **Session Tokens:** Rotated regularly, stored securely

### Deleted Accounts

- **Immediate:** Local data deleted, cloud access revoked
- **30 Days:** Complete removal from all backups and logs
- **Encryption Keys:** Destroyed immediately

### Legal Requirements

We may retain data longer if required by law or to:
- Comply with legal obligations
- Resolve disputes
- Enforce our agreements

---

## Children's Privacy (COPPA Compliance)

**Our App is Not Intended for Children Under 13**

- We do not knowingly collect data from children under 13
- If we discover we've collected data from a child under 13, we will delete it immediately
- Parents or guardians who believe their child has provided us with information should contact us at privacy@stepstorecovery.app

---

## International Users (GDPR/CCPA Compliance)

### For European Union Users (GDPR)

If you are in the EU, you have additional rights:
- **Right to be informed** (this Privacy Policy)
- **Right of access** (export your data)
- **Right to rectification** (correct inaccurate data)
- **Right to erasure** (delete your account)
- **Right to restrict processing** (use offline mode)
- **Right to data portability** (export in JSON format)
- **Right to object** (opt out of analytics)

**Legal Basis for Processing:**
- Contract performance (providing the app service)
- Legal obligations
- Your consent (for optional features)

**Data Controller:**
Steps to Recovery App Team  
Contact: privacy@stepstorecovery.app

**Data Protection Officer:**
Email: dpo@stepstorecovery.app

### For California Residents (CCPA)

California residents have the following rights:
- **Right to know** what personal information is collected
- **Right to delete** personal information
- **Right to opt-out** of sale of personal information (we do not sell data)
- **Right to non-discrimination** for exercising privacy rights

**Categories of Personal Information Collected:**
- Identifiers (email address)
- Protected classifications (recovery-related data, encrypted)
- Commercial information (app usage)
- Internet activity (sync logs, error reports)

**Do Not Sell My Personal Information:**
We do not sell your personal information. We never have and never will.

---

## Push Notifications

We may send you push notifications for:
- Daily check-in reminders (if you enable them)
- Milestone celebrations
- Meeting reminders (if configured)

**How to Control:**
- iOS: Settings → Notifications → Steps to Recovery
- Android: Settings → Apps → Steps to Recovery → Notifications
- In-App: Settings → Notifications

---

## Location Data

**Meeting Finder Feature:**

- Location is only accessed when you actively search for meetings
- Location data is processed on your device only
- We do not store or transmit your location history
- You can use the app without enabling location services

**How to Control:**
- iOS: Settings → Privacy & Security → Location Services → Steps to Recovery
- Android: Settings → Location → App permissions → Steps to Recovery

---

## AI Companion Privacy

**Local-First AI:**
- AI conversations are stored locally on your device
- No conversation data is sent to third-party AI services without explicit consent
- AI memory is device-specific and encrypted

**Optional Cloud AI:**
- If enabled, only anonymized messages are processed
- No personally identifiable information is shared
- You can disable AI features at any time

---

## Security Measures

We implement industry-standard security measures:

### Technical Safeguards
- ✅ AES-256-CBC encryption for all sensitive data
- ✅ PBKDF2 key derivation (100,000 iterations)
- ✅ HMAC-SHA256 authentication
- ✅ Secure key storage (iOS Keychain / Android Keystore)
- ✅ HTTPS/TLS for all network communications
- ✅ Row-Level Security (RLS) on all database tables

### Organizational Safeguards
- ✅ Minimal data collection principle
- ✅ Regular security audits
- ✅ No third-party analytics without consent
- ✅ Employee background checks (if applicable)
- ✅ Incident response plan

### Incident Response
In the unlikely event of a data breach:
1. We will notify affected users within 72 hours
2. We will provide details of the breach and remediation steps
3. We will report to authorities as required by law

---

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by:
- Posting the new Privacy Policy in the app
- Updating the "Last Updated" date at the top of this policy
- Sending a notification for significant changes

**Review History:**
- February 9, 2026: Initial Privacy Policy published

---

## Contact Us

If you have any questions, concerns, or requests regarding this Privacy Policy or your data:

**Email:** privacy@stepstorecovery.app  
**Response Time:** Within 48 hours  
**Data Requests:** Please include "Data Request" in the subject line

**Mailing Address:**
```
Steps to Recovery Privacy Team
[Your Business Address]
```

---

## Your Recovery Journey is Sacred

We built Steps to Recovery with a fundamental belief: **your recovery is personal and private**. Every design decision prioritizes your privacy and security because we understand the sensitive nature of recovery work.

You trust us with your most personal thoughts, struggles, and victories. We take that trust seriously.

**Thank you for letting us be part of your journey.**

---

*This Privacy Policy is designed to be transparent and easy to understand. If you have any questions about specific sections, please don't hesitate to contact us.*
