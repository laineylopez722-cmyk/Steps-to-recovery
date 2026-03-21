---
id: "CFG-001"
title: "iOS encryption compliance declaration is incorrect"
category: "configuration"
severity: "critical"
status: "fixed"
priority: "P0"
created: "2026-03-21"
updated: "2026-03-21"
fixed_date: "2026-03-21"
labels:
  - "ios"
  - "compliance"
  - "app-store"
  - "encryption"
  - "apple-export-control"
assignee: "unassigned"
github_issue: null
blocked_by: []
effort: "XS"
effort_hours: "0.5-1"
---

## Problem Statement

`app.json` declares `ITSAppUsesNonExemptEncryption: false` in the iOS `infoPlist` section.
This tells Apple's App Store review that the app does NOT use encryption beyond the iOS system
encryption. However, the app uses AES-256-CBC encryption (crypto-js) for all sensitive user
data stored locally and synced to Supabase.

This is an **Apple export control compliance violation**. Under US export control law (EAR),
apps using non-exempt encryption must either:
1. File an annual self-classification report (SCR) with the US Bureau of Industry and Security
2. Declare `ITSAppUsesNonExemptEncryption: true` in `app.json` and provide the ERN (Encryption
   Registration Number) or certify eligibility for an exemption

Filing a false declaration during App Store submission is a legal risk and could result in
app removal or account termination.

The correct value depends on which exemption category applies:
- If the encryption is exclusively for data protection (user data, not communication), the app
  may qualify for the "data protection" exemption under ERN 740.17(b)(4)
- If not exempt, `ITSAppUsesNonExemptEncryption: true` must be set and the ERN provided

---

## Current Impact

| Dimension | Impact |
|---|---|
| Who is affected | All iOS users (compliance risk for the app developer/publisher) |
| How often | On every App Store submission |
| Severity when triggered | Legal compliance violation; potential App Store removal |
| Workaround available | No — must be corrected before next App Store submission |

---

## Steps to Reproduce

1. Open `apps/mobile/app.json`
2. Find: `"ITSAppUsesNonExemptEncryption": false`
3. Note: `apps/mobile/src/utils/encryption.ts` uses AES-256-CBC via crypto-js

**Expected:** Declaration matches actual encryption usage
**Actual:** Declaration falsely states no non-exempt encryption is used

---

## Acceptance Criteria

- [ ] Legal review completed: determine if AES-256-CBC for data-at-rest qualifies for
  the 740.17(b)(4) exemption (data protection, no authentication/key exchange)
- [ ] If exempt: `ITSAppUsesNonExemptEncryption` changed to `true` AND `ITSEncryptionExportComplianceCode`
  is added with the ERN or exemption code — OR the `ITSAppUsesNonExemptEncryption` key is removed
  and replaced with the correct compliance documentation
- [ ] If not exempt: ERN obtained from BIS and documented in `SECURITY.md`
- [ ] `app.json` `infoPlist` section updated to reflect the correct declaration
- [ ] `eas build --platform ios --dry-run` succeeds after the change
- [ ] Change documented in `SECURITY.md` with compliance rationale

---

## Implementation Notes

- Current declaration in `apps/mobile/app.json`:
  ```json
  "ios": {
    "infoPlist": {
      "ITSAppUsesNonExemptEncryption": false
    }
  }
  ```
- The app uses crypto-js AES-256-CBC — this is non-exempt encryption
- Data-protection exemption (740.17(b)(4)) applies when encryption is used solely to protect
  user data on device — this may apply if the app does not use encryption for authentication
  or network communication (Supabase handles the TLS, not the app)
- Apple's compliance guide: https://developer.apple.com/documentation/security/complying_with_encryption_export_regulations
- If using the exemption, the updated `infoPlist` should be:
  ```json
  "ITSAppUsesNonExemptEncryption": true
  ```
  With the exemption code set via `ITSEncryptionExportComplianceCode` if required
- Consult with a lawyer or Apple's export compliance documentation before changing this

---

## Effort Estimate

| Field | Value |
|---|---|
| T-shirt size | XS |
| Hours estimate | 0.5-1 hour (code change only; legal review is separate) |
| Confidence | high |
| Rationale | One-line config change; the work is in the legal/compliance determination, not the code |

---

## Blocked By

Legal review of encryption exemption eligibility.

---

## Related Documentation

- `apps/mobile/app.json` — file to modify
- `apps/mobile/src/utils/encryption.ts` — confirms AES-256-CBC usage
- `SECURITY.md` — security practices and audit history (update after resolution)
- Apple export compliance: https://developer.apple.com/documentation/security/complying_with_encryption_export_regulations
