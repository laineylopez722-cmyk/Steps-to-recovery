# Supabase MCP Authentication Setup

**Project Reference:** `tbiunmmvfbakwlzykpwq`
**MCP URL:** https://mcp.supabase.com/mcp?project_ref=tbiunmmvfbakwlzykpwq

---

## Quick Setup

The Supabase MCP is currently showing "⚠️ Needs authentication". To enable it:

### Option 1: OAuth Authentication (Recommended)

When you start Claude Code, the Supabase MCP will prompt you to authenticate via OAuth:

1. Start Claude Code
2. Look for the Supabase authentication prompt
3. Follow the browser redirect to login
4. Authorize the MCP server

### Option 2: Access Token (Manual)

1. **Get your Supabase Access Token:**
   - Go to https://supabase.com/dashboard
   - Navigate to Account > Access Tokens
   - Create a new token or copy an existing one

2. **Set the environment variable:**

   **For PowerShell:**

   ```powershell
   $env:SUPABASE_ACCESS_TOKEN = "your-access-token-here"
   ```

   **For Command Prompt:**

   ```cmd
   set SUPABASE_ACCESS_TOKEN=your-access-token-here
   ```

   **Permanent (add to System Environment Variables):**
   - Right-click "This PC" → Properties
   - Advanced system settings → Environment Variables
   - Add new User variable:
     - Name: `SUPABASE_ACCESS_TOKEN`
     - Value: `your-access-token-here`

3. **Restart Claude Code**

---

## What This Enables

Once authenticated, you'll have access to these Supabase MCP tools:

### Database Operations

- `list_organizations` - List your Supabase organizations
- `get_organization` - Get org details and subscription plan
- `list_projects` - List all your Supabase projects
- `get_project` - Get project details and status
- `create_project` - Create new Supabase projects
- `pause_project` / `restore_project` - Manage project state

### Database Schema

- `list_tables` - View all tables and schemas
- `list_extensions` - See installed Postgres extensions
- `list_migrations` - View migration history
- `apply_migration` - Execute DDL migrations
- `execute_sql` - Run SQL queries

### Development Branches

- `create_branch` - Create dev branches for testing
- `list_branches` - View all branches
- `merge_branch` - Merge changes to production
- `reset_branch` / `rebase_branch` - Manage branch state
- `delete_branch` - Remove branches

### Edge Functions

- `list_edge_functions` - View deployed functions
- `get_edge_function` - Read function code
- `deploy_edge_function` - Deploy new functions

### Monitoring & Security

- `get_logs` - Fetch logs by service (api, postgres, auth, etc.)
- `get_advisors` - Security and performance recommendations
- `generate_typescript_types` - Auto-generate TypeScript types from DB
- `get_publishable_keys` - Retrieve API keys

---

## Integration with Your Project

Your Steps to Recovery app uses:

- **Local-first SQLite** - Primary data storage
- **Supabase** - Cloud backup and sync

With the Supabase MCP enabled, Claude Code can:

1. ✅ Create/modify database tables and RLS policies
2. ✅ Test SQL queries before implementing
3. ✅ Generate TypeScript types from your schema
4. ✅ Deploy Edge Functions for sync operations
5. ✅ Monitor logs for debugging
6. ✅ Check security advisors for RLS issues

---

## Verification

After authentication, verify it's working:

```bash
claude mcp list
```

You should see:

```
plugin:supabase:supabase: https://mcp.supabase.com/mcp (HTTP) - ✓ Connected
```

---

## Troubleshooting

### "401 Unauthorized" Error

- Your access token may have expired
- Regenerate token at https://supabase.com/dashboard

### "Failed to connect" Error

- Check your internet connection
- Verify the project reference is correct: `tbiunmmvfbakwlzykpwq`

### OAuth Redirect Issues

- Make sure port 45454 is not blocked by firewall
- Try manual access token method instead

---

**Last Updated:** 2026-01-02
