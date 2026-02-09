# Privacy Policy - Steps to Recovery

**Last Updated:** February 9, 2026  
**Effective Date:** February 9, 2026

## Introduction

Steps to Recovery ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and safeguard your information when you use our mobile application (the "App").

We understand that recovery is deeply personal. That's why we've designed our App with privacy-first principles: your journal entries, step work, and personal reflections are encrypted on your device and only you hold the encryption keys.

## Information We Collect

### 1. Account Information
When you create an account, we collect:
- **Email address**: Used for authentication and account recovery
- **Password**: Stored as a secure hash (we cannot read your password)
- **Account creation date**: For account management purposes

### 2. Recovery Data (Encrypted)
All recovery-related data is encrypted on your device before storage:
- **Journal entries**: Your daily reflections, gratitude lists, and personal writings
- **Step work**: Answers to 12-step questions and progress tracking
- **Check-ins**: Morning intentions and evening reflections
- **Meeting notes**: Personal notes about meetings you attend

**Important**: This data is encrypted using AES-256-CBC encryption with keys that only exist on your device. We cannot decrypt or access this content.

### 3. Optional Profile Information
- **Display name**: How you want to be identified in the app (optional)
- **Sobriety date**: For calculating your clean time (optional, stored locally)
- **Current step**: To track your step work progress (optional, stored locally)

### 4. Technical Information
- **Device type**: For optimizing the user experience
- **App version**: For providing updates and support
- **Error logs**: For debugging (sanitized, no personal content)

## How We Use Your Information

### Primary Uses
- **Authentication**: To verify your identity and secure your account
- **Data synchronization**: To sync your encrypted data across devices
- **App functionality**: To provide journaling, step work, and recovery tools
- **Technical support**: To help resolve issues with the App

### We DO NOT
- ❌ Read your journal entries or step work (impossible - they're encrypted)
- ❌ Sell your personal information to third parties
- ❌ Use your data for advertising
- ❌ Share your information with employers, insurance companies, or legal authorities
- ❌ Track your location (except when you explicitly search for meetings)

## Data Storage and Security

### Encryption
All sensitive data uses industry-standard encryption:
- **Algorithm**: AES-256-CBC with PBKDF2 key derivation
- **Key storage**: Encryption keys stored in device secure storage (Keychain/Keystore)
- **Iterations**: 100,000 PBKDF2 iterations
- **Authentication**: HMAC-SHA256 integrity verification

### Cloud Storage
Your encrypted data is synchronized to Supabase (our cloud database provider):
- Data remains encrypted during transmission (TLS 1.3)
- Only encrypted blobs are stored in the cloud
- Row-Level Security ensures you can only access your own data
- No decryption happens in the cloud

### Local Storage
- **Mobile**: SQLite database with encrypted content
- **Web**: IndexedDB with encrypted content
- Offline-first: All data available without internet connection

## Data Retention

### Active Accounts
Your data is retained as long as your account is active.

### Account Deletion
You can delete your account at any time:
- All cloud data is permanently deleted within 30 days
- Local data is removed immediately upon app deletion
- Encryption keys are destroyed, making any backups unreadable

### Recovery Data
Due to the nature of recovery, we recommend:
- Regular exports of your journal (available in-app)
- Keeping personal backups of important step work
- Understanding that account deletion is irreversible

## Your Rights (GDPR/CCPA)

Depending on your location, you may have the right to:

### Access
Request a copy of all data we hold about you (provided in encrypted format with your key)

### Portability
Export your data in a machine-readable format through the app's export feature

### Deletion
Delete your account and all associated data

### Correction
Update your account information through the app settings

### Objection
Opt-out of non-essential data processing

To exercise these rights, contact us at: privacy@stepstorecovery.app

## Third-Party Services

We use the following services to operate the App:

### Supabase
- **Purpose**: Cloud database and authentication
- **Data**: Encrypted user data, account information
- **Privacy**: https://supabase.com/privacy
- **Location**: United States (with EU data residency options)

### Sentry (Optional)
- **Purpose**: Error tracking and performance monitoring
- **Data**: Sanitized error logs (no personal content)
- **Privacy**: https://sentry.io/privacy/
- **Opt-out**: Available in app settings

### Meeting Guide API
- **Purpose**: Finding local recovery meetings
- **Data**: Location coordinates (only when searching)
- **Privacy**: Anonymous requests, no user identification

## Children's Privacy

The App is not intended for users under 13 years of age. We do not knowingly collect information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.

## International Data Transfers

If you are accessing the App from outside the United States, please be aware that your data may be transferred to, stored, and processed in the United States where our servers are located. By using the App, you consent to this transfer.

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by:
- Posting the new policy in the App
- Updating the "Last Updated" date
- Sending an email notification for significant changes

Your continued use of the App after changes constitutes acceptance of the updated policy.

## Contact Us

If you have questions, concerns, or requests regarding this Privacy Policy:

**Email**: privacy@stepstorecovery.app  
**Address**: Steps to Recovery Privacy Team  
**Response Time**: Within 48 hours

## Special Note for Recovery Community

We understand the sensitive nature of recovery work. Your anonymity is protected by:
- No requirement for real names
- No social media integration
- No data sharing with treatment centers
- No analytics that could identify individuals
- Complete encryption of all personal reflections

## Emergency Resources

If you are in crisis, please contact:
- **SAMHSA National Helpline**: 1-800-662-4357
- **Crisis Text Line**: Text HOME to 741741
- **988 Suicide & Crisis Lifeline**: Call or text 988

---

**By using Steps to Recovery, you acknowledge that you have read and understood this Privacy Policy.**
