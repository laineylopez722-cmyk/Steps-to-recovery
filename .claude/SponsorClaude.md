# Sponsor Connection & Sharing - Claude Prompt

## Objective

Manage sponsor-sponsee connections and secure sharing of journal entries and progress.

## Target Files

- `apps/mobile/src/features/sponsor/screens/SponsorScreen.tsx`
- `apps/mobile/src/features/sponsor/screens/InviteSponsorScreen.tsx`
- `apps/mobile/src/features/sponsor/screens/SponsorRequestsScreen.tsx`
- `apps/mobile/src/features/sponsor/screens/SponseeProgressScreen.tsx`

## Requirements

### Sponsor Connection Flow

1. **Invite Sponsor**
   - Enter sponsor's email or unique code
   - Send sponsorship request via Supabase
   - Pending status until accepted

2. **Accept/Decline Requests**
   - View pending sponsorship requests
   - Accept or decline with confirmation
   - Notify requester of decision

3. **Manage Connection**
   - View current sponsor/sponsees
   - Option to disconnect (with confirmation)
   - Privacy settings for sharing

### Sharing Mechanism

- User can mark specific journal entries as "shared with sponsor"
- Shared entries visible to sponsor in read-only mode
- Step progress summary visible to sponsor
- Meeting attendance log sharing (optional)

### Database Schema

```sql
CREATE TABLE sponsorships (
  id TEXT PRIMARY KEY,
  sponsor_id TEXT NOT NULL,
  sponsee_id TEXT NOT NULL,
  status TEXT NOT NULL, -- 'pending', 'accepted', 'declined'
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE shared_entries (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  shared_with_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

### Supabase RLS Policies

- Sponsors can only read entries explicitly shared with them
- Sponsees control what is shared
- No access to unshared data

### Privacy Considerations

- Clear UI for what is shared vs. private
- Confirmation dialog before sharing
- Audit log of what was shared and when (optional)
- Encryption considerations for shared data

### User Experience

- Build trust through transparency
- Respectful of anonymity (use codes, not emails if preferred)
- One-to-one sponsorship (one sponsor per user for MVP)
- Supportive messaging around the sponsor relationship
