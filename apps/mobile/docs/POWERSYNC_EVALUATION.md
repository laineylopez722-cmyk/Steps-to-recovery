# PowerSync Evaluation for Steps to Recovery

> Research Date: 2026-02-16
> Status: Research Complete | Decision Pending

## Executive Summary

**PowerSync is a strong candidate for Phase 2 offline sync** following the Vercel AI SDK integration. It provides automatic SQLite sync with Supabase using WAL replication and sync rules.

**Recommendation:** Proceed with PowerSync after rehab validation (post-Mar 01).

## What PowerSync Provides

### Core Capabilities
- **Local SQLite database** embedded in React Native app
- **Automatic sync** with Supabase Postgres via WAL (Write Ahead Log)
- **Offline-first architecture** — reads/writes work without network
- **Conflict resolution** via sync rules (last-write-wins, custom logic)
- **React Native SDK:** `@powersync/react-native` with `@journeyapps/react-native-quick-sqlite`

### How It Works
1. PowerSync Service monitors Supabase Postgres WAL
2. Changes streamed to mobile clients via WebSocket
3. Local SQLite reads happen instantly (no network)
4. Local writes queued and synced when online
5. Sync Rules define what data each user can access (row-level security)

## Integration Requirements

### Supabase Side
```sql
-- Create replication user for PowerSync
CREATE ROLE powersync_role WITH REPLICATION BYPASSRLS LOGIN PASSWORD 'strong_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO powersync_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO powersync_role;

-- Create publication for PowerSync
CREATE PUBLICATION powersync FOR ALL TABLES;
```

### PowerSync Cloud Side
- Create PowerSync Cloud account (free tier available)
- Connect to Supabase project
- Configure sync rules for user data isolation
- Deploy sync rules

### React Native Side
```bash
# Install dependencies (requires native rebuild)
npx expo install @powersync/react-native @journeyapps/react-native-quick-sqlite

# Metro config update required
# transformer.getTransformOptions.inlineRequires.blockList must exclude @powersync/react-native
```

### Code Integration Pattern
```typescript
// Initialize PowerSync
import { PowerSync } from '@powersync/react-native';
import { SupabaseConnector } from '@powersync/supabase';

const powerSync = new PowerSync({
  database: {
    dbFilename: 'recovery.db',
  },
  connector: new SupabaseConnector({
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  }),
});

// Use local SQLite for all reads
const result = await powerSync.db.getAllAsync('SELECT * FROM journal_entries');
```

## Comparison: Current Sync vs PowerSync

| Aspect | Current (Manual Queue) | PowerSync |
|--------|----------------------|-----------|
| Setup complexity | Low | Medium (Supabase + PowerSync) |
| Conflict resolution | Manual (custom code) | Sync rules (declarative) |
| Offline reads | SQLite only | SQLite (same) |
| Offline writes | Queue + retry | Queue + auto-sync |
| Real-time updates | No | Yes (WebSocket) |
| Schema changes | Manual migration | Supabase handles |
| Cost | $0 | Free tier + paid |

## Risks and Mitigations

### Risk: Double Sync Complexity
**Problem:** Current app has manual sync queue AND PowerSync would add another layer.
**Mitigation:** Migrate existing sync logic to PowerSync. Existing SQLite tables can remain; PowerSync syncs at row level.

### Risk: Supabase WAL Performance
**Problem:** PowerSync reads ALL changes from publication, even unused tables.
**Mitigation:** Create targeted publication for only synced tables:
```sql
CREATE PUBLICATION powersync FOR TABLE journal_entries, step_work, daily_checkins;
```

### Risk: Native Module Requirement
**Problem:** PowerSync SDK requires native rebuild (Expo prebuild).
**Mitigation:** Not a blocker — Steps to Recovery already uses prebuild workflow.

### Risk: Encryption at Rest
**Problem:** PowerSync syncs plaintext; Steps to Recovery encrypts sensitive fields.
**Mitigation:** Keep encryption layer above PowerSync. Encrypted content strings sync as BLOBs.

## Estimated Effort

| Task | Effort |
|------|--------|
| Supabase: Create PowerSync user + publication | 1 hour |
| PowerSync: Create account + configure instance | 2 hours |
| React Native: Install SDK + Metro config | 2 hours |
| React Native: Refactor data layer to use PowerSync | 4-6 hours |
| Testing: Offline scenarios | 2 hours |
| **Total** | **~12-14 hours** |

## Next Steps

### Before Rehab (Blocked)
1. Wait for EAS free tier reset (Mar 01)
2. Validate current app works reliably on device
3. Complete DEVICE_TESTING_CHECKLIST

### After Rehab (Phase 2)
1. Create PowerSync Cloud account
2. Configure Supabase side (user, publication, sync rules)
3. Install PowerSync SDK in React Native
4. Migrate data layer from manual sync to PowerSync
5. Test offline scenarios thoroughly
6. Deploy to TestFlight for beta

## Alternative Considered: PGLite + ElectricSQL

- **PGLite:** Postgres compiled to WebAssembly
- **ElectricSQL:** Postgres sync over CRDT
- **Verdict:** More complex setup, less React Native support. PowerSync is simpler for Supabase-native apps.

## References

- [PowerSync + Supabase Integration Guide](https://docs.powersync.com/integration-guides/supabase-+-powersync)
- [PowerSync React Native SDK](https://docs.powersync.com/client-sdk-references/react-native)
- [Ignite Cookbook: PowerSync + React Native](https://ignitecookbook.com/docs/recipes/LocalFirstDataWithPowerSync/)
